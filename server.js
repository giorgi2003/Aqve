const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

require("./applications.js");
const Apps = globalThis.AqveApplications;
const { createBusinessApi } = require("./business-api.js");

const ROOT = __dirname;
const DATA_DIR = process.env.AQVE_DATA_DIR || path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "aqve.json");
const PORT = Number(process.env.AQVE_PORT || 5500);
const SESSION_HOURS = 12;
const BODY_LIMIT = 2600 * 1024;
const PUBLIC_FILES = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff2", ".map"]);

const emptyDb = () => ({
  admins: [],
  applications: [],
  businesses: [],
  members: [],
  blocked_users: [],
  audit: [],
  menu_categories: [],
  products: [],
  product_ingredients: [],
  business_hours: [],
  owners: [],
});

fs.mkdirSync(DATA_DIR, { recursive: true });

function readDb() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return {
      ...emptyDb(),
      ...parsed,
      admins: parsed.admins || [],
      applications: parsed.applications || [],
      businesses: parsed.businesses || [],
      members: parsed.members || [],
      blocked_users: parsed.blocked_users || [],
      audit: parsed.audit || [],
      menu_categories: parsed.menu_categories || [],
      products: parsed.products || [],
      product_ingredients: parsed.product_ingredients || [],
      business_hours: parsed.business_hours || [],
      owners: parsed.owners || [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

let db = readDb();
const sessions = new Map();

function uid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored || "").split(":");
    const next = crypto.scryptSync(password, salt, 32);
    const prev = Buffer.from(hash, "hex");
    if (next.length !== prev.length) return false;
    return crypto.timingSafeEqual(next, prev);
  } catch {
    return false;
  }
}

function bootstrapAdmin() {
  const email = String(process.env.AQVE_ADMIN_EMAIL || "admin@aqve.local").trim().toLowerCase();
  const password = process.env.AQVE_ADMIN_PASSWORD || "admin";
  if (!db.admins.length) {
    db.admins.push({
      id: uid(),
      email,
      password_hash: hashPassword(password),
      role: "admin",
      created_at: nowIso(),
    });
  } else {
    db.admins[0].email = email;
    db.admins[0].password_hash = hashPassword(password);
  }
  writeDb(db);
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i < 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setCookie(res, name, value, extra) {
  const parts = [
    name + "=" + encodeURIComponent(value),
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    extra || "Max-Age=" + SESSION_HOURS * 3600,
  ];
  const prev = res.getHeader("Set-Cookie");
  const list = prev ? [].concat(prev) : [];
  list.push(parts.join("; "));
  res.setHeader("Set-Cookie", list);
}

function clearCookie(res, name) {
  setCookie(res, name, "", "Max-Age=0");
}

function applicantId(req, res) {
  const cookies = parseCookies(req);
  if (cookies.aqve_uid && /^[a-zA-Z0-9-]{10,80}$/.test(cookies.aqve_uid)) return cookies.aqve_uid;
  const id = uid();
  setCookie(res, "aqve_uid", id, "Max-Age=" + 60 * 60 * 24 * 400);
  return id;
}

function adminSession(req) {
  const token = parseCookies(req).aqve_admin;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  const admin = db.admins.find((row) => row.id === session.adminId && row.role === "admin");
  return admin || null;
}

function send(res, status, body, headers) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(headers || {}),
  });
  res.end(payload);
}

function deny(res, status, code) {
  send(res, status, { error: "forbidden", code: code || "forbidden" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error("too_large"), { code: "too_large" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error("invalid_json"), { code: "invalid_json" }));
      }
    });
    req.on("error", reject);
  });
}

function audit(entry) {
  db.audit.push({
    id: uid(),
    timestamp: nowIso(),
    actor_user_id: entry.actor_user_id || null,
    application_id: entry.application_id || null,
    business_id: entry.business_id || null,
    action: entry.action,
    metadata: entry.metadata || {},
  });
}

function applicantView(row) {
  if (!row) return null;
  return {
    id: row.id,
    business_name: row.business_name,
    business_type: row.business_type,
    city: row.city,
    address: row.address,
    business_phone: row.business_phone,
    social_url: row.social_url,
    contact_first_name: row.contact_first_name,
    contact_last_name: row.contact_last_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    contact_role: row.contact_role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    needs_information_message: row.status === "needs_information" ? row.needs_information_message : undefined,
  };
}

function publicBusinessView(row) {
  if (!row || row.blocked || !businessApi.isReady(row.id)) return null;
  return {
    id: row.id,
    name: row.name,
    business_type: row.business_type,
    city: row.city,
    address: row.address,
    phone: row.phone,
    description: row.description || "",
    short_description: row.short_description || "",
    logo_url: row.logo_url || "",
    cover_url: row.cover_url || "",
    facebook: row.facebook || "",
    instagram: row.instagram || "",
    social_url: row.social_url || "",
  };
}

function requireAdmin(req, res) {
  const admin = adminSession(req);
  if (!admin) {
    deny(res, 401, "unauthorized");
    return null;
  }
  return admin;
}

function createApplicationRecord(raw, applicant) {
  const { data, errors, ok } = Apps.store.validate(raw);
  if (!ok) {
    const err = new Error("invalid");
    err.code = "invalid";
    err.errors = errors;
    throw err;
  }
  return {
    id: uid(),
    applicant_user_id: applicant,
    business_name: data.business_name,
    business_type: data.business_type,
    city: data.city,
    address: data.address,
    business_phone: data.business_phone,
    social_url: data.social_url,
    logo_url: data.logo_url || "",
    contact_first_name: data.contact_first_name,
    contact_last_name: data.contact_last_name,
    contact_phone: data.contact_phone,
    contact_email: data.contact_email,
    contact_role: data.contact_role,
    legal_name: data.legal_name,
    identification_number: data.identification_number,
    status: Apps.STATUSES.PENDING_REVIEW,
    created_at: nowIso(),
    updated_at: nowIso(),
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    rejection_reason: null,
    needs_information_message: null,
    business_id: null,
  };
}

function approveApplication(admin, id) {
  const app = db.applications.find((row) => row.id === id);
  if (!app) return { error: "not_found", status: 404 };
  if (app.status === Apps.STATUSES.APPROVED && app.business_id) {
    const business = db.businesses.find((row) => row.id === app.business_id);
    const member = db.members.find((row) => row.business_id === app.business_id && row.user_id === app.applicant_user_id);
    return { application: app, business, member, idempotent: true };
  }
  if (app.status === "blocked" || isBlockedUser(app.applicant_user_id)) {
    return { error: "blocked", status: 403 };
  }
  if (app.status !== Apps.STATUSES.PENDING_REVIEW && app.status !== Apps.STATUSES.NEEDS_INFORMATION) {
    return { error: "invalid_state", status: 409 };
  }
  const business = {
    id: uid(),
    application_id: app.id,
    name: app.business_name,
    business_type: app.business_type,
    city: app.city,
    address: app.address,
    phone: app.business_phone,
    social_url: app.social_url,
    logo_url: app.logo_url || "",
    cover_url: "",
    description: "",
    short_description: "",
    facebook: "",
    instagram: "",
    legal_name: app.legal_name,
    identification_number: app.identification_number,
    public_visible: false,
    created_at: nowIso(),
  };
  const member = {
    id: uid(),
    user_id: app.applicant_user_id,
    business_id: business.id,
    role: "owner",
    created_at: nowIso(),
  };
  app.status = Apps.STATUSES.APPROVED;
  app.approved_at = nowIso();
  app.approved_by = admin.id;
  app.business_id = business.id;
  app.updated_at = nowIso();
  db.businesses.push(business);
  db.members.push(member);
  businessApi.onApproved(business, app);
  audit({
    action: "business_application_approved",
    actor_user_id: admin.id,
    application_id: app.id,
    business_id: business.id,
    metadata: { applicant_user_id: app.applicant_user_id },
  });
  writeDb(db);
  return { application: app, business, member };
}

function rejectApplication(admin, id, reason) {
  const app = db.applications.find((row) => row.id === id);
  if (!app) return { error: "not_found", status: 404 };
  if (app.status === Apps.STATUSES.APPROVED) return { error: "invalid_state", status: 409 };
  const text = String(reason || "").trim();
  if (text.length < 3) return { error: "invalid", status: 400, errors: { rejection_reason: true } };
  app.status = Apps.STATUSES.REJECTED;
  app.rejected_at = nowIso();
  app.rejected_by = admin.id;
  app.rejection_reason = text;
  app.updated_at = nowIso();
  audit({
    action: "business_application_rejected",
    actor_user_id: admin.id,
    application_id: app.id,
    metadata: { reason: text },
  });
  writeDb(db);
  return { application: app };
}

function isBlockedUser(userId) {
  return (db.blocked_users || []).some((row) => row.user_id === userId);
}

function restrictBusiness(businessId, adminId) {
  const business = db.businesses.find((row) => row.id === businessId);
  if (!business) return;
  business.blocked = true;
  business.public_visible = false;
  business.blocked_at = nowIso();
  business.blocked_by = adminId;
}

function blockApplicant(userId, adminId, applicationId) {
  if (!userId || isBlockedUser(userId)) return;
  db.blocked_users = db.blocked_users || [];
  db.blocked_users.push({
    user_id: userId,
    application_id: applicationId || null,
    blocked_at: nowIso(),
    blocked_by: adminId,
  });
}

function deleteApplication(admin, id) {
  const index = db.applications.findIndex((row) => row.id === id);
  if (index < 0) return { error: "not_found", status: 404 };
  const app = db.applications[index];
  if (app.business_id) restrictBusiness(app.business_id, admin.id);
  db.applications.splice(index, 1);
  audit({
    action: "business_application_deleted",
    actor_user_id: admin.id,
    application_id: id,
    business_id: app.business_id || null,
    metadata: { business_name: app.business_name, applicant_user_id: app.applicant_user_id },
  });
  writeDb(db);
  return { ok: true, id };
}

function blockApplication(admin, id) {
  const app = db.applications.find((row) => row.id === id);
  if (!app) return { error: "not_found", status: 404 };
  if (app.status === "blocked") return { application: app, idempotent: true };
  app.previous_status = app.status;
  app.status = "blocked";
  app.blocked_at = nowIso();
  app.blocked_by = admin.id;
  app.updated_at = nowIso();
  blockApplicant(app.applicant_user_id, admin.id, app.id);
  if (app.business_id) restrictBusiness(app.business_id, admin.id);
  audit({
    action: "business_application_blocked",
    actor_user_id: admin.id,
    application_id: app.id,
    business_id: app.business_id || null,
    metadata: { applicant_user_id: app.applicant_user_id },
  });
  writeDb(db);
  return { application: app };
}

function requestInformation(admin, id, message) {
  const app = db.applications.find((row) => row.id === id);
  if (!app) return { error: "not_found", status: 404 };
  if (app.status === Apps.STATUSES.APPROVED || app.status === Apps.STATUSES.REJECTED) {
    return { error: "invalid_state", status: 409 };
  }
  const text = String(message || "").trim();
  if (text.length < 3) return { error: "invalid", status: 400, errors: { message: true } };
  app.status = Apps.STATUSES.NEEDS_INFORMATION;
  app.needs_information_message = text;
  app.updated_at = nowIso();
  audit({
    action: "business_application_information_requested",
    actor_user_id: admin.id,
    application_id: app.id,
    metadata: { message: text },
  });
  writeDb(db);
  return { application: app };
}

function matchesQuery(row, q) {
  if (!q) return true;
  const blob = [
    row.business_name,
    row.contact_first_name,
    row.contact_last_name,
    (row.contact_first_name || "") + " " + (row.contact_last_name || ""),
    row.contact_phone,
    row.business_phone,
    row.contact_email,
  ].join(" ").toLowerCase();
  return blob.includes(q);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  if (!rel || rel.endsWith("/")) rel += "index.html";
  if (rel === "index.html" && urlPath.split("?")[0] === "/") rel = "index.html";
  const blocked = rel.startsWith("data") || rel.includes("..") || rel.endsWith(".json") || rel.endsWith(".env") || rel === "server.js" || rel === "business-api.js";
  const abs = path.normalize(path.join(ROOT, rel));
  if (blocked || !abs.startsWith(ROOT)) {
    send(res, 403, "forbidden");
    return;
  }
  const ext = path.extname(abs).toLowerCase();
  if (!PUBLIC_FILES.has(ext)) {
    send(res, 404, "not found");
    return;
  }
  fs.readFile(abs, (err, buf) => {
    if (err) {
      send(res, 404, "not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": ext === ".js" || ext === ".css" ? "no-store" : "public, max-age=300",
    });
    res.end(buf);
  });
}

function serveAdminPage(res) {
  fs.readFile(path.join(ROOT, "admin", "index.html"), (err, buf) => {
    if (err) {
      send(res, 500, "admin ui missing");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(buf);
  });
}

function serveBusinessPage(res) {
  fs.readFile(path.join(ROOT, "business", "index.html"), (err, buf) => {
    if (err) {
      send(res, 500, "business ui missing");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(buf);
  });
}

const businessApi = createBusinessApi({
  getDb: () => db,
  writeDb,
  uid,
  nowIso,
  send,
  deny,
  isBlockedUser,
  Apps,
  DATA_DIR,
  readBody,
  hashPassword,
  verifyPassword,
  parseCookies,
  setCookie,
  clearCookie,
  sessions,
});

async function handleApi(req, res, url) {
  const method = req.method;
  const route = url.pathname;

  if (method === "GET" && route === "/api/health") {
    send(res, 200, { ok: true });
    return;
  }

  if (await businessApi.handle(req, res, url)) return;

  if (method === "POST" && route === "/api/auth/login") {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const admin = db.admins.find((row) => row.email === email);
    if (!admin || !verifyPassword(password, admin.password_hash) || admin.role !== "admin") {
      deny(res, 401, "invalid_credentials");
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { adminId: admin.id, expires: Date.now() + SESSION_HOURS * 3600 * 1000 });
    setCookie(res, "aqve_admin", token);
    send(res, 200, { id: admin.id, email: admin.email, role: "admin" });
    return;
  }

  if (method === "POST" && route === "/api/auth/logout") {
    const token = parseCookies(req).aqve_admin;
    if (token) sessions.delete(token);
    clearCookie(res, "aqve_admin");
    send(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && route === "/api/auth/me") {
    const admin = adminSession(req);
    if (!admin) {
      deny(res, 401, "unauthorized");
      return;
    }
    send(res, 200, { id: admin.id, email: admin.email, role: "admin" });
    return;
  }

  if (method === "POST" && route === "/api/applications") {
    const applicant = applicantId(req, res);
    if (isBlockedUser(applicant)) {
      deny(res, 403, "blocked");
      return;
    }
    const body = await readBody(req);
    delete body.status;
    delete body.approved_by;
    delete body.approved_at;
    delete body.rejected_by;
    delete body.applicant_user_id;
    delete body.role;
    delete body.id;
    delete body.business_id;
    try {
      const row = createApplicationRecord(body, applicant);
      db.applications.push(row);
      audit({ action: "application_submitted", actor_user_id: applicant, application_id: row.id });
      writeDb(db);
      send(res, 201, applicantView(row));
    } catch (err) {
      if (err.code === "invalid") {
        send(res, 400, { error: "invalid", code: "invalid", errors: err.errors });
        return;
      }
      throw err;
    }
    return;
  }

  if (method === "GET" && route === "/api/me/applications") {
    const applicant = applicantId(req, res);
    const rows = db.applications
      .filter((row) => row.applicant_user_id === applicant)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(applicantView);
    send(res, 200, rows);
    return;
  }

  if (method === "GET" && route === "/api/me/businesses") {
    const applicant = applicantId(req, res);
    const mine = db.members
      .filter((row) => row.user_id === applicant)
      .map((member) => {
        const business = db.businesses.find((row) => row.id === member.business_id);
        if (!business || business.blocked) return null;
        return {
          id: business.id,
          name: business.name,
          role: member.role,
          city: business.city,
        };
      })
      .filter(Boolean);
    send(res, 200, mine);
    return;
  }

  if (method === "GET" && route === "/api/public/businesses") {
    send(res, 200, db.businesses.map(publicBusinessView).filter(Boolean));
    return;
  }

  if (route.startsWith("/api/admin")) {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    if (method === "GET" && route === "/api/admin/overview") {
      const counts = {
        pending_review: 0,
        approved: 0,
        needs_information: 0,
        rejected: 0,
        blocked: 0,
      };
      db.applications.forEach((row) => {
        if (counts[row.status] !== undefined) counts[row.status] += 1;
      });
      const latest = [...db.applications]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8)
        .map((row) => ({
          id: row.id,
          business_name: row.business_name,
          business_type: row.business_type,
          city: row.city,
          status: row.status,
          created_at: row.created_at,
          contact_first_name: row.contact_first_name,
          contact_last_name: row.contact_last_name,
        }));
      send(res, 200, { counts, latest });
      return;
    }

    if (method === "GET" && route === "/api/admin/applications") {
      const status = url.searchParams.get("status") || "";
      const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
      const rows = db.applications
        .filter((row) => !status || row.status === status)
        .filter((row) => matchesQuery(row, q))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((row) => ({
          id: row.id,
          business_name: row.business_name,
          business_type: row.business_type,
          city: row.city,
          contact_first_name: row.contact_first_name,
          contact_last_name: row.contact_last_name,
          contact_phone: row.contact_phone,
          contact_email: row.contact_email,
          created_at: row.created_at,
          status: row.status,
        }));
      send(res, 200, rows);
      return;
    }

    const detail = route.match(/^\/api\/admin\/applications\/([^/]+)$/);
    if (method === "GET" && detail) {
      const row = db.applications.find((item) => item.id === detail[1]);
      if (!row) {
        send(res, 404, { error: "not_found", code: "not_found" });
        return;
      }
      send(res, 200, row);
      return;
    }

    const action = route.match(/^\/api\/admin\/applications\/([^/]+)\/(approve|reject|request-information|delete|block)$/);
    if (method === "POST" && action) {
      const id = action[1];
      const kind = action[2];
      const body = await readBody(req);
      let result;
      if (kind === "approve") result = approveApplication(admin, id);
      else if (kind === "reject") result = rejectApplication(admin, id, body.reason);
      else if (kind === "delete") result = deleteApplication(admin, id);
      else if (kind === "block") result = blockApplication(admin, id);
      else result = requestInformation(admin, id, body.message);
      if (result.error) {
        send(res, result.status || 400, { error: result.error, code: result.error, errors: result.errors });
        return;
      }
      send(res, 200, result);
      return;
    }

    deny(res, 404, "not_found");
    return;
  }

  send(res, 404, { error: "not_found", code: "not_found" });
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.setHeader("Vary", "Origin");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (url.pathname === "/media" || url.pathname.startsWith("/media/")) {
      businessApi.serveMedia(req, res, url.pathname);
      return;
    }
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      if (url.pathname === "/admin/admin.css" || url.pathname === "/admin/admin.js" || url.pathname === "/admin/index.html") {
        serveStatic(req, res, url.pathname);
        return;
      }
      serveAdminPage(res);
      return;
    }
    if (
      url.pathname === "/business/dashboard" ||
      url.pathname.startsWith("/business/dashboard/")
    ) {
      if (
        url.pathname === "/business/business.css" ||
        url.pathname === "/business/business.js" ||
        url.pathname === "/business/index.html"
      ) {
        serveStatic(req, res, url.pathname);
        return;
      }
      serveBusinessPage(res);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (err) {
    if (err.code === "too_large") {
      send(res, 413, { error: "too_large", code: "too_large" });
      return;
    }
    console.error(err);
    send(res, 500, { error: "server_error", code: "server_error" });
  }
});

bootstrapAdmin();

if (require.main === module) {
  server.listen(PORT, () => {
    console.log("AQVE http://localhost:" + PORT);
    console.log("Admin http://localhost:" + PORT + "/admin");
    console.log("Business http://localhost:" + PORT + "/business/dashboard");
  });
}

module.exports = { server, readDb, writeDb, getDb: () => db, bootstrapAdmin, sessions, DATA_DIR };
