const fs = require("fs");
const path = require("path");

const DAYS = [
  { id: 1, key: "mon" },
  { id: 2, key: "tue" },
  { id: 3, key: "wed" },
  { id: 4, key: "thu" },
  { id: 5, key: "fri" },
  { id: 6, key: "sat" },
  { id: 7, key: "sun" },
];

const IMAGE_TYPES = {
  jpeg: "jpg",
  jpg: "jpg",
  png: "png",
  webp: "webp",
};

function tbilisiNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tbilisi",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  const week = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { day: week[map.weekday] || 1, minutes: Number(map.hour) * 60 + Number(map.minute) };
}

function parseHHMM(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function liveFromHours(hoursRow) {
  const days = (hoursRow && hoursRow.days) || [];
  const now = tbilisiNow();
  const today = days.find((d) => Number(d.day) === now.day);
  if (!today || today.closed) {
    const opens = nextOpen(days, now);
    return { live: "closed", opens, until: "" };
  }
  const open = parseHHMM(today.open);
  const close = parseHHMM(today.close);
  if (open == null || close == null || now.minutes < open || now.minutes >= close) {
    return { live: "closed", opens: today.open, until: "" };
  }
  if (close - now.minutes <= 60) {
    return { live: "closing", until: today.close, opens: "" };
  }
  return { live: "open", until: today.close, opens: "" };
}

function nextOpen(days, now) {
  for (let i = 0; i < 7; i += 1) {
    const day = ((now.day - 1 + i) % 7) + 1;
    const row = days.find((d) => Number(d.day) === day);
    if (row && !row.closed && row.open) return row.open;
  }
  return "";
}

function defaultHours(businessId, nowIso) {
  return {
    business_id: businessId,
    days: DAYS.map((d) => ({ day: d.id, closed: true, open: "09:00", close: "22:00" })),
    updated_at: nowIso(),
  };
}

function parseGelToTetri(value) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const tetri = Math.round(Number(raw) * 100);
  if (!Number.isFinite(tetri) || tetri < 0 || tetri > 10000000) return null;
  return tetri;
}

function tetriToGel(tetri) {
  return Number(tetri || 0) / 100;
}

function normalizeIngredientNames(list) {
  const parsed = normalizeIngredientRows(list);
  return parsed.ok ? parsed.rows.map((row) => row.name) : [];
}

const ING_ERR = {
  extra_price: "\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d8\u10d7\u10d8 \u10de\u10dd\u10e0\u10ea\u10d8\u10d8\u10e1 \u10e4\u10d0\u10e1\u10d8 \u10d0\u10e0\u10d0\u10e1\u10ec\u10dd\u10e0\u10d8\u10d0",
  extra_need: "\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d8\u10d7\u10d8 \u10de\u10dd\u10e0\u10ea\u10d8\u10d8\u10e1 \u10e4\u10d0\u10e1\u10d8 \u10d0\u10e3\u10ea\u10d8\u10da\u10d4\u10d1\u10d4\u10da\u10d8\u10d0",
  role: "\u10d0\u10d8\u10e0\u10e9\u10d8\u10d4 \u10e8\u10d4\u10d3\u10d8\u10e1 \u10d9\u10d4\u10e0\u10eb\u10e8\u10d8 \u10d0\u10dc \u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d8\u10d7\u10d8 \u10de\u10dd\u10e0\u10ea\u10d8\u10d0",
  extra: "\u10d4\u10e1 \u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d0 \u10db\u10d8\u10e3\u10ec\u10d5\u10d3\u10dd\u10db\u10d4\u10da\u10d8\u10d0",
  extra_qty: "\u10d3\u10d0\u10db\u10d0\u10e2\u10d4\u10d1\u10d8\u10e1 \u10e0\u10d0\u10dd\u10d3\u10d4\u10dc\u10dd\u10d1\u10d0 \u10d0\u10e0\u10d0\u10e1\u10ec\u10dd\u10e0\u10d8\u10d0",
  product: "\u10d9\u10d4\u10e0\u10eb\u10d8 \u10d5\u10d4\u10e0 \u10db\u10dd\u10d8\u10eb\u10d4\u10d1\u10dc\u10d0",
  qty: "\u10e0\u10d0\u10dd\u10d3\u10d4\u10dc\u10dd\u10d1\u10d0 \u10d0\u10e0\u10d0\u10e1\u10ec\u10dd\u10e0\u10d8\u10d0",
};

function parseExtraPriceTetri(raw) {
  if (raw && typeof raw === "object") {
    if (raw.extra_price != null && String(raw.extra_price).trim() !== "") {
      return parseGelToTetri(raw.extra_price);
    }
    if (raw.extra_price_tetri != null && String(raw.extra_price_tetri).trim() !== "") {
      const n = Number(raw.extra_price_tetri);
      if (Number.isInteger(n) && n >= 0 && n <= 10000000) return n;
      return null;
    }
    return null;
  }
  return parseGelToTetri(raw);
}

function normalizeIngredientRows(list) {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(list) ? list : [];
  for (let i = 0; i < source.length; i += 1) {
    const row = source[i];
    const raw = row && typeof row === "object" ? row : { name: row };
    const name = String(raw.name || "").trim().replace(/\s+/g, " ");
    if (!name || name.length > 80) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const included_by_default = raw.included_by_default == null && raw.included == null
      ? true
      : Boolean(raw.included_by_default ?? raw.included);
    const extra_available = Boolean(raw.extra_available);
    let extra_price_tetri = 0;
    if (extra_available) {
      const hasPrice = (raw.extra_price != null && String(raw.extra_price).trim() !== "")
        || (raw.extra_price_tetri != null && String(raw.extra_price_tetri).trim() !== "");
      if (!hasPrice) return { ok: false, error: ING_ERR.extra_need, code: "invalid_extra_price" };
      const parsed = parseExtraPriceTetri(raw);
      if (parsed == null) return { ok: false, error: ING_ERR.extra_price, code: "invalid_extra_price" };
      extra_price_tetri = parsed;
    }
    if (!included_by_default && !extra_available) {
      return { ok: false, error: ING_ERR.role, code: "invalid_ingredient_role" };
    }
    out.push({
      name,
      included_by_default,
      extra_available,
      extra_price_tetri: extra_available ? extra_price_tetri : 0,
    });
  }
  return { ok: true, rows: out.slice(0, 40) };
}

function shapeIngredient(row, productId, businessId, index) {
  const extra_available = Boolean(row && row.extra_available);
  return {
    id: (row && row.id) || productId + "-" + index,
    product_id: (row && row.product_id) || productId,
    business_id: (row && row.business_id) || businessId,
    name: String((row && row.name) || row || "").trim(),
    included_by_default: !row || row.included_by_default !== false,
    extra_available,
    extra_price_tetri: extra_available ? Number(row.extra_price_tetri) || 0 : 0,
    sort_order: row && row.sort_order != null ? row.sort_order : index,
    created_at: (row && row.created_at) || "",
  };
}

function parseLegacyIngredients(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  let parts = [];
  if (raw.includes(",")) parts = raw.split(",");
  else if (/[.;·]/.test(raw)) {
    parts = raw.split(/[.;·]/);
    const filled = parts.map((p) => p.trim()).filter(Boolean);
    if (filled.length < 2 || filled.some((p) => p.length > 40)) return [];
  } else return [];
  return normalizeIngredientNames(parts);
}

const COVER_ZOOM_MIN = 1;
const COVER_ZOOM_MAX = 2.5;

function defaultCoverCrop() {
  return { x: 50, y: 50, zoom: 1 };
}

function clampCropNum(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}

function normalizeCoverCrop(raw, fallback) {
  const fb = fallback || defaultCoverCrop();
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    x: clampCropNum(src.x, 0, 100, fb.x),
    y: clampCropNum(src.y, 0, 100, fb.y),
    zoom: clampCropNum(src.zoom, COVER_ZOOM_MIN, COVER_ZOOM_MAX, fb.zoom),
  };
}

function cropFromLegacyFocal(row) {
  if (!row) return null;
  if (row.cover_focal_x == null && row.cover_focal_y == null) return null;
  return normalizeCoverCrop({ x: row.cover_focal_x, y: row.cover_focal_y, zoom: 1 });
}

function resolveCoverCrops(row) {
  const fallback = cropFromLegacyFocal(row) || defaultCoverCrop();
  return {
    mobile: normalizeCoverCrop(row && row.cover_crop_mobile, fallback),
    desktop: normalizeCoverCrop(row && row.cover_crop_desktop, fallback),
  };
}

function ownerPublicBusiness(row) {
  if (!row) return null;
  const crops = resolveCoverCrops(row);
  return {
    id: row.id,
    name: row.name,
    business_type: row.business_type,
    city: row.city,
    address: row.address,
    phone: row.phone,
    social_url: row.social_url || "",
    facebook: row.facebook || "",
    instagram: row.instagram || "",
    logo_url: row.logo_url || "",
    cover_url: row.cover_url || "",
    cover_original_url: row.cover_original_url || "",
    cover_normalized: Boolean(row.cover_normalized),
    cover_crop_mobile: crops.mobile,
    cover_crop_desktop: crops.desktop,
    description: row.description || "",
    short_description: row.short_description || "",
    blocked: Boolean(row.blocked),
  };
}

function createBusinessApi(ctx) {
  const {
    getDb,
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
  } = ctx;

  const UPLOADS = path.join(DATA_DIR, "uploads");

  function db() {
    return getDb();
  }

  function ensureCollections() {
    const data = db();
    if (!data.menu_categories) data.menu_categories = [];
    if (!data.products) data.products = [];
    if (!data.product_ingredients) data.product_ingredients = [];
    if (!data.business_hours) data.business_hours = [];
    if (!data.owners) data.owners = [];
    migrateLegacyIngredients(data);
  }

  function ingredientsOf(productId) {
    const rows = db().product_ingredients
      .filter((i) => i.product_id === productId)
      .sort((a, b) => a.sort_order - b.sort_order || String(a.created_at || "").localeCompare(String(b.created_at || "")));
    const product = db().products.find((p) => p.id === productId);
    if (rows.length) return rows.map((row, i) => shapeIngredient(row, productId, product && product.business_id, i));
    const embedded = product && Array.isArray(product.ingredients) ? product.ingredients : [];
    return embedded.map((row, i) => shapeIngredient(row, productId, product && product.business_id, i)).filter((row) => row.name);
  }

  function publicIngredient(row) {
    return {
      id: row.id,
      product_id: row.product_id,
      name: row.name,
      included_by_default: row.included_by_default !== false,
      extra_available: Boolean(row.extra_available),
      extra_price_tetri: row.extra_available ? Number(row.extra_price_tetri) || 0 : 0,
      sort_order: row.sort_order,
    };
  }

  function replaceIngredients(product, list) {
    const parsed = normalizeIngredientRows(list);
    if (!parsed.ok) return parsed;
    const stamp = nowIso();
    const rows = parsed.rows.map((row, i) => ({
      id: uid(),
      product_id: product.id,
      business_id: product.business_id,
      name: row.name,
      included_by_default: row.included_by_default,
      extra_available: row.extra_available,
      extra_price_tetri: row.extra_available ? row.extra_price_tetri : 0,
      sort_order: i,
      created_at: stamp,
    }));
    db().product_ingredients = db().product_ingredients.filter((i) => i.product_id !== product.id);
    rows.forEach((row) => db().product_ingredients.push(row));
    product.ingredients = rows.map(publicIngredient);
    return { ok: true, rows };
  }

  function quoteOrderLines(input) {
    const lines = [];
    const source = Array.isArray(input) ? input : [];
    for (let i = 0; i < source.length; i += 1) {
      const line = source[i] || {};
      const product = db().products.find((p) => p.id === line.itemId && !p.deleted_at);
      if (!product) return { ok: false, error: ING_ERR.product, code: "unknown_product" };
      const qty = Number(line.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return { ok: false, error: ING_ERR.qty, code: "invalid_qty" };
      }
      const ings = ingredientsOf(product.id);
      const included = ings.filter((ing) => ing.included_by_default !== false);
      const includedNames = included.map((ing) => ing.name);
      const removed = (Array.isArray(line.removed) ? line.removed : [])
        .map((name) => String(name || "").trim())
        .filter((name) => includedNames.includes(name));
      const extras = [];
      const extrasIn = Array.isArray(line.extras) ? line.extras : [];
      for (let j = 0; j < extrasIn.length; j += 1) {
        const ex = extrasIn[j] || {};
        const extraQty = Number(ex.qty);
        if (!Number.isInteger(extraQty) || extraQty < 0 || extraQty > 20) {
          return { ok: false, error: ING_ERR.extra_qty, code: "invalid_extra_qty" };
        }
        if (extraQty === 0) continue;
        const ing = ings.find((row) => row.id === ex.id);
        if (!ing || !ing.extra_available) {
          return { ok: false, error: ING_ERR.extra, code: "invalid_extra" };
        }
        const extra_price_tetri = Number(ing.extra_price_tetri) || 0;
        extras.push({
          id: ing.id,
          name: ing.name,
          qty: extraQty,
          extra_price_tetri,
          extra_total_tetri: extra_price_tetri * extraQty,
        });
      }
      const extras_unit_tetri = extras.reduce((n, row) => n + row.extra_total_tetri, 0);
      const unit_base_tetri = Number(product.price_tetri) || 0;
      const unit_tetri = unit_base_tetri + extras_unit_tetri;
      lines.push({
        itemId: product.id,
        name: product.name,
        qty,
        removed,
        extras,
        unit_base_tetri,
        extras_unit_tetri,
        unit_tetri,
        line_total_tetri: unit_tetri * qty,
        kitchen: {
          remove: removed,
          extra: extras.map((row) => ({ name: row.name, qty: row.qty })),
        },
      });
    }
    return {
      ok: true,
      items_tetri: lines.reduce((n, line) => n + line.line_total_tetri, 0),
      lines,
    };
  }

  function withIngredients(product) {
    return { ...product, ingredients: ingredientsOf(product.id) };
  }

  function migrateLegacyIngredients(data) {
    let changed = false;
    (data.products || []).forEach((p) => {
      if (p.ingredients_migrated_at) return;
      const existing = (data.product_ingredients || []).filter((i) => i.product_id === p.id);
      if (!existing.length) {
        parseLegacyIngredients(p.description).forEach((name, i) => {
          const row = {
            id: uid(),
            product_id: p.id,
            business_id: p.business_id,
            name,
            sort_order: i,
            created_at: nowIso(),
          };
          data.product_ingredients.push(row);
        });
      }
      p.ingredients = (data.product_ingredients || [])
        .filter((i) => i.product_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i, idx) => publicIngredient(shapeIngredient(i, p.id, p.business_id, idx)));
      p.ingredients_migrated_at = nowIso();
      changed = true;
    });
    if (changed) writeDb(data);
  }

  function hoursFor(businessId) {
    ensureCollections();
    let row = db().business_hours.find((h) => h.business_id === businessId);
    if (!row) {
      row = defaultHours(businessId, nowIso);
      db().business_hours.push(row);
      writeDb(db());
    }
    return row;
  }

  function categoriesOf(businessId) {
    ensureCollections();
    return db().menu_categories
      .filter((c) => c.business_id === businessId)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  }

  function productsOf(businessId, includeDeleted) {
    ensureCollections();
    return db().products.filter((p) => p.business_id === businessId && (includeDeleted || !p.deleted_at));
  }

  function isReady(businessId) {
    const cats = categoriesOf(businessId).filter((c) => c.active);
    const items = productsOf(businessId).filter((p) => p.available);
    return cats.length > 0 && items.length > 0;
  }

  function membershipsFor(userId) {
    const data = db();
    return data.members
      .filter((m) => m.user_id === userId)
      .map((m) => {
        const business = data.businesses.find((b) => b.id === m.business_id);
        if (!business || business.blocked) return null;
        return { member: m, business };
      })
      .filter(Boolean);
  }

  function businessUser(req) {
    const biz = parseCookies(req).aqve_biz;
    if (biz && sessions.get(biz) && sessions.get(biz).role === "owner" && sessions.get(biz).expires > Date.now()) {
      return sessions.get(biz).userId;
    }
    return parseCookies(req).aqve_uid || null;
  }

  function requireOwner(req, res, businessId) {
    const userId = businessUser(req);
    if (!userId) {
      deny(res, 401, "unauthorized");
      return null;
    }
    if (isBlockedUser(userId)) {
      deny(res, 403, "blocked");
      return null;
    }
    const hit = membershipsFor(userId).find((row) => row.business.id === businessId);
    if (!hit) {
      deny(res, 403, "forbidden");
      return null;
    }
    return hit;
  }

  function saveImage(dataUrl, relParts) {
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(String(dataUrl || "").replace(/\s/g, ""));
    if (!match) {
      const err = new Error("invalid");
      err.code = "invalid_image";
      throw err;
    }
    const ext = IMAGE_TYPES[match[1].toLowerCase()];
    const buf = Buffer.from(match[2], "base64");
    if (buf.length > 2 * 1024 * 1024) {
      const err = new Error("too_large");
      err.code = "too_large";
      throw err;
    }
    const rel = path.join("businesses", ...relParts) + "." + ext;
    const abs = path.join(UPLOADS, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, buf);
    return "/media/" + rel.split(path.sep).join("/");
  }

  function toRestaurant(business) {
    const hours = hoursFor(business.id);
    const live = liveFromHours(hours);
    const cats = categoriesOf(business.id).filter((c) => c.active);
    const items = productsOf(business.id);
    const menu = {};
    cats.forEach((cat) => {
      const rows = items
        .filter((p) => p.category_id === cat.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          desc: p.description || "",
          ingredients: ingredientsOf(p.id).map((i) => publicIngredient(i)),
          price: tetriToGel(p.price_tetri),
          price_tetri: Number(p.price_tetri) || 0,
          image: p.image_url || business.cover_url || business.logo_url || "",
          available: Boolean(p.available),
          prep_time: p.prep_time || "",
        }));
      if (rows.length) menu[cat.name] = rows;
    });
    const typeLabel = Apps.store.labelOf(Apps.BUSINESS_TYPES, business.business_type);
    const cityLabel = Apps.store.labelOf(Apps.CITIES, business.city);
    const firstTimes = items.map((p) => p.prep_time).filter(Boolean);
    return {
      id: business.id,
      name: business.name,
      cuisine: [typeLabel, cityLabel].filter(Boolean).join(" • "),
      category: business.business_type || "all",
      rating: 5,
      reviews: 0,
      time: firstTimes[0] || "25–35 წთ",
      timeMin: 25,
      fee: 0,
      promo: "",
      live: live.live,
      until: live.until,
      opens: live.opens,
      image: business.cover_url || business.logo_url || "",
      logo: business.logo_url || "",
      cover_crop_mobile: resolveCoverCrops(business).mobile,
      cover_crop_desktop: resolveCoverCrops(business).desktop,
      description: business.description || "",
      short_description: business.short_description || "",
      phone: business.phone,
      address: business.address,
      source: "live",
      ready: isReady(business.id),
      menu,
    };
  }

  function absUrl(req, value) {
    const raw = String(value || "");
    if (!raw || /^https?:\/\//i.test(raw)) return raw;
    const host = req.headers.host || "localhost";
    const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0];
    return proto + "://" + host + (raw.startsWith("/") ? raw : "/" + raw);
  }

  function withHost(req, rest) {
    const next = JSON.parse(JSON.stringify(rest));
    next.image = absUrl(req, next.image);
    next.logo = absUrl(req, next.logo);
    Object.keys(next.menu || {}).forEach((key) => {
      next.menu[key] = (next.menu[key] || []).map((item) => ({ ...item, image: absUrl(req, item.image) }));
    });
    return next;
  }

  function publicCatalog() {
    return db().businesses
      .filter((b) => !b.blocked && isReady(b.id))
      .map(toRestaurant);
  }

  function publicDetail(id) {
    const business = db().businesses.find((b) => b.id === id && !b.blocked);
    if (!business || !isReady(business.id)) return null;
    const view = toRestaurant(business);
    view.legal_name = undefined;
    view.identification_number = undefined;
    return view;
  }

  function overview(business) {
    const cats = categoriesOf(business.id);
    const items = productsOf(business.id);
    const hours = hoursFor(business.id);
    const hoursSet = hours.days.some((d) => !d.closed);
    const infoSet = Boolean(business.name && business.address && business.phone);
    const ready = isReady(business.id);
    return {
      business: ownerPublicBusiness(business),
      ready,
      live: liveFromHours(hours),
      checklist: {
        info: infoSet,
        hours: hoursSet,
        category: cats.length > 0,
        product: items.length > 0,
      },
      counts: { categories: cats.length, products: items.length },
    };
  }

  async function handle(req, res, url) {
    ensureCollections();
    const method = req.method;
    const route = url.pathname;

    if (method === "GET" && route === "/api/public/catalog") {
      send(res, 200, publicCatalog().map((row) => withHost(req, row)));
      return true;
    }
    if (method === "POST" && route === "/api/public/quote") {
      const body = await readBody(req);
      const quoted = quoteOrderLines(body && body.lines);
      if (!quoted.ok) {
        send(res, 400, { error: quoted.error, code: quoted.code });
        return true;
      }
      send(res, 200, quoted);
      return true;
    }
    const pub = route.match(/^\/api\/public\/businesses\/([^/]+)$/);
    if (method === "GET" && pub) {
      const row = publicDetail(pub[1]);
      if (!row) {
        send(res, 404, { error: "not_found", code: "not_found" });
        return true;
      }
      send(res, 200, withHost(req, row));
      return true;
    }

    if (method === "GET" && route === "/api/business/session") {
      const userId = businessUser(req);
      if (!userId) {
        deny(res, 401, "unauthorized");
        return true;
      }
      if (isBlockedUser(userId)) {
        deny(res, 403, "blocked");
        return true;
      }
      const mine = membershipsFor(userId);
      if (mine.length) {
        send(res, 200, {
          user_id: userId,
          businesses: mine.map((row) => ({
            id: row.business.id,
            name: row.business.name,
            role: row.member.role,
            logo_url: row.business.logo_url || "",
          })),
        });
        return true;
      }
      const apps = db().applications.filter((a) => a.applicant_user_id === userId);
      if (apps.some((a) => a.status === "pending_review" || a.status === "needs_information")) {
        deny(res, 403, "pending_review");
        return true;
      }
      if (apps.some((a) => a.status === "rejected")) {
        deny(res, 403, "rejected");
        return true;
      }
      deny(res, 403, "no_business");
      return true;
    }

    if (method === "POST" && route === "/api/business/login") {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const owner = db().owners.find((o) => o.email === email);
      if (!owner || !owner.password_hash || !verifyPassword(password, owner.password_hash)) {
        deny(res, 401, "invalid_credentials");
        return true;
      }
      if (isBlockedUser(owner.id) || !membershipsFor(owner.id).length) {
        deny(res, 403, "no_business");
        return true;
      }
      const token = require("crypto").randomBytes(32).toString("hex");
      sessions.set(token, { userId: owner.id, role: "owner", expires: Date.now() + 12 * 3600 * 1000 });
      setCookie(res, "aqve_biz", token);
      send(res, 200, { ok: true });
      return true;
    }

    if (method === "POST" && route === "/api/business/logout") {
      const token = parseCookies(req).aqve_biz;
      if (token) sessions.delete(token);
      clearCookie(res, "aqve_biz");
      clearCookie(res, "aqve_uid");
      send(res, 200, { ok: true });
      return true;
    }

    if (method === "POST" && route === "/api/business/password") {
      const userId = businessUser(req);
      if (!userId || !membershipsFor(userId).length) {
        deny(res, 403, "no_business");
        return true;
      }
      const body = await readBody(req);
      const password = String(body.password || "");
      if (password.length < 4) {
        send(res, 400, { error: "invalid", code: "invalid" });
        return true;
      }
      let owner = db().owners.find((o) => o.id === userId);
      const email = String(body.email || "").trim().toLowerCase();
      if (!owner) {
        owner = { id: userId, email, password_hash: hashPassword(password), created_at: nowIso() };
        db().owners.push(owner);
      } else {
        owner.password_hash = hashPassword(password);
        if (email) owner.email = email;
      }
      writeDb(db());
      send(res, 200, { ok: true });
      return true;
    }

    const bizRoute = route.match(/^\/api\/business\/([^/]+)(?:\/(.*))?$/);
    if (!bizRoute || bizRoute[1] === "session" || bizRoute[1] === "login" || bizRoute[1] === "logout" || bizRoute[1] === "password") {
      return false;
    }
    const businessId = bizRoute[1];
    const rest = bizRoute[2] || "";
    const access = requireOwner(req, res, businessId);
    if (!access) return true;
    const { business } = access;

    if (method === "GET" && rest === "") {
      send(res, 200, ownerPublicBusiness(business));
      return true;
    }
    if (method === "GET" && rest === "overview") {
      send(res, 200, overview(business));
      return true;
    }
    if (method === "PATCH" && rest === "") {
      const body = await readBody(req);
      ["name", "address", "phone", "description", "short_description", "facebook", "instagram", "social_url"].forEach((key) => {
        if (body[key] != null) business[key] = String(body[key]).trim();
      });
      if (body.business_type && Apps.BUSINESS_TYPES.some((t) => t.id === body.business_type)) {
        business.business_type = body.business_type;
      }
      try {
        if (body.logo_data) business.logo_url = saveImage(body.logo_data, [business.id, "logo", "logo"]);
        else if (body.remove_logo) business.logo_url = "";
        if (body.cover_original_data) {
          business.cover_original_url = saveImage(body.cover_original_data, [business.id, "cover", "original"]);
        }
        if (body.cover_data) {
          business.cover_url = saveImage(body.cover_data, [business.id, "cover", "cover"]);
          if (body.cover_normalized != null) business.cover_normalized = Boolean(body.cover_normalized);
          else if (body.cover_original_data) business.cover_normalized = true;
        } else if (body.remove_cover) {
          business.cover_url = "";
          business.cover_original_url = "";
          business.cover_normalized = false;
          business.cover_crop_mobile = defaultCoverCrop();
          business.cover_crop_desktop = defaultCoverCrop();
          delete business.cover_focal_x;
          delete business.cover_focal_y;
        }
        if (body.cover_crop_mobile != null) business.cover_crop_mobile = normalizeCoverCrop(body.cover_crop_mobile);
        if (body.cover_crop_desktop != null) business.cover_crop_desktop = normalizeCoverCrop(body.cover_crop_desktop);
        if (body.cover_crop_mobile == null && body.cover_crop_desktop == null && (body.cover_focal_x != null || body.cover_focal_y != null)) {
          const migrated = normalizeCoverCrop({ x: body.cover_focal_x, y: body.cover_focal_y, zoom: 1 });
          business.cover_crop_mobile = migrated;
          business.cover_crop_desktop = { ...migrated };
        }
        if (body.cover_crop_mobile != null || body.cover_crop_desktop != null || body.cover_focal_x != null || body.cover_focal_y != null) {
          delete business.cover_focal_x;
          delete business.cover_focal_y;
        }
      } catch (err) {
        send(res, err.code === "too_large" ? 413 : 400, { error: err.code || "invalid", code: err.code || "invalid" });
        return true;
      }
      delete business.identification_number_edit;
      business.updated_at = nowIso();
      writeDb(db());
      send(res, 200, ownerPublicBusiness(business));
      return true;
    }

    if (method === "GET" && rest === "hours") {
      send(res, 200, hoursFor(business.id));
      return true;
    }
    if ((method === "PUT" || method === "POST") && rest === "hours") {
      const body = await readBody(req);
      const days = Array.isArray(body.days) ? body.days : [];
      const cleaned = DAYS.map((d) => {
        const src = days.find((x) => Number(x.day) === d.id) || {};
        const closed = Boolean(src.closed);
        function hhmm(value, fallback) {
          const mins = parseHHMM(value);
          if (mins == null) return fallback;
          const h = String(Math.floor(mins / 60)).padStart(2, "0");
          const m = String(mins % 60).padStart(2, "0");
          return h + ":" + m;
        }
        return { day: d.id, closed, open: hhmm(src.open, "09:00"), close: hhmm(src.close, "22:00") };
      });
      const row = hoursFor(business.id);
      row.days = cleaned;
      row.updated_at = nowIso();
      writeDb(db());
      send(res, 200, row);
      return true;
    }

    if (method === "GET" && rest === "categories") {
      send(res, 200, categoriesOf(business.id));
      return true;
    }
    if (method === "POST" && rest === "categories") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      if (!name) {
        send(res, 400, { error: "invalid", code: "invalid" });
        return true;
      }
      const existing = categoriesOf(business.id);
      const row = {
        id: uid(),
        business_id: business.id,
        name,
        sort_order: existing.length,
        active: body.active !== false,
        created_at: nowIso(),
      };
      db().menu_categories.push(row);
      writeDb(db());
      send(res, 201, row);
      return true;
    }
    if (method === "POST" && rest === "categories/reorder") {
      const body = await readBody(req);
      const order = Array.isArray(body.order) ? body.order : [];
      categoriesOf(business.id).forEach((cat) => {
        const i = order.indexOf(cat.id);
        if (i >= 0) cat.sort_order = i;
      });
      writeDb(db());
      send(res, 200, categoriesOf(business.id));
      return true;
    }
    const catOne = rest.match(/^categories\/([^/]+)$/);
    if (catOne && method === "PATCH") {
      const cat = categoriesOf(business.id).find((c) => c.id === catOne[1]);
      if (!cat) {
        send(res, 404, { error: "not_found", code: "not_found" });
        return true;
      }
      const body = await readBody(req);
      if (body.name != null) {
        const name = String(body.name).trim();
        if (!name) {
          send(res, 400, { error: "invalid", code: "invalid" });
          return true;
        }
        cat.name = name;
      }
      if (body.active != null) cat.active = Boolean(body.active);
      writeDb(db());
      send(res, 200, cat);
      return true;
    }
    if (catOne && method === "DELETE") {
      const cat = categoriesOf(business.id).find((c) => c.id === catOne[1]);
      if (!cat) {
        send(res, 404, { error: "not_found", code: "not_found" });
        return true;
      }
      const count = productsOf(business.id).filter((p) => p.category_id === cat.id).length;
      if (count) {
        send(res, 409, { error: "has_products", code: "has_products", count });
        return true;
      }
      db().menu_categories = db().menu_categories.filter((c) => c.id !== cat.id);
      writeDb(db());
      send(res, 200, { ok: true });
      return true;
    }

    if (method === "GET" && rest === "products") {
      send(res, 200, productsOf(business.id).map(withIngredients));
      return true;
    }
    if (method === "POST" && rest === "products") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const category = categoriesOf(business.id).find((c) => c.id === body.category_id);
      const price_tetri = parseGelToTetri(body.price);
      if (!name || !category || price_tetri == null || !body.image_data) {
        send(res, 400, { error: "invalid", code: "invalid" });
        return true;
      }
      if (Array.isArray(body.ingredients)) {
        const parsed = normalizeIngredientRows(body.ingredients);
        if (!parsed.ok) {
          send(res, 400, { error: parsed.error, code: parsed.code });
          return true;
        }
      }
      const row = {
        id: uid(),
        business_id: business.id,
        category_id: category.id,
        name,
        description: String(body.description || "").trim(),
        price_tetri,
        image_url: "",
        available: body.available !== false,
        prep_time: String(body.prep_time || "").trim(),
        deleted_at: null,
        ingredients_migrated_at: nowIso(),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      try {
        row.image_url = saveImage(body.image_data, [business.id, "products", row.id]);
      } catch (err) {
        send(res, err.code === "too_large" ? 413 : 400, { error: err.code || "invalid", code: err.code || "invalid" });
        return true;
      }
      db().products.push(row);
      if (Array.isArray(body.ingredients)) {
        const result = replaceIngredients(row, body.ingredients);
        if (!result.ok) {
          send(res, 400, { error: result.error, code: result.code });
          return true;
        }
      }
      writeDb(db());
      send(res, 201, withIngredients(row));
      return true;
    }
    const prod = rest.match(/^products\/([^/]+)(?:\/(availability|delete))?$/);
    if (prod) {
      const item = productsOf(business.id).find((p) => p.id === prod[1]);
      if (!item) {
        send(res, 404, { error: "not_found", code: "not_found" });
        return true;
      }
      if (method === "POST" && prod[2] === "availability") {
        const body = await readBody(req);
        item.available = Boolean(body.available);
        item.updated_at = nowIso();
        writeDb(db());
        send(res, 200, withIngredients(item));
        return true;
      }
      if (method === "POST" && prod[2] === "delete") {
        item.deleted_at = nowIso();
        item.available = false;
        item.updated_at = nowIso();
        writeDb(db());
        send(res, 200, { ok: true });
        return true;
      }
      if (method === "PATCH" && !prod[2]) {
        const body = await readBody(req);
        if (body.name != null) {
          const name = String(body.name).trim();
          if (!name) {
            send(res, 400, { error: "invalid", code: "invalid" });
            return true;
          }
          item.name = name;
        }
        if (body.description != null) item.description = String(body.description).trim();
        if (body.prep_time != null) item.prep_time = String(body.prep_time).trim();
        if (body.available != null) item.available = Boolean(body.available);
        if (body.price != null) {
          const price_tetri = parseGelToTetri(body.price);
          if (price_tetri == null) {
            send(res, 400, { error: "invalid", code: "invalid" });
            return true;
          }
          item.price_tetri = price_tetri;
        }
        if (body.category_id) {
          const category = categoriesOf(business.id).find((c) => c.id === body.category_id);
          if (!category) {
            send(res, 400, { error: "invalid", code: "invalid" });
            return true;
          }
          item.category_id = category.id;
        }
        try {
          if (body.image_data) item.image_url = saveImage(body.image_data, [business.id, "products", item.id]);
        } catch (err) {
          send(res, err.code === "too_large" ? 413 : 400, { error: err.code || "invalid", code: err.code || "invalid" });
          return true;
        }
        if (Array.isArray(body.ingredients)) {
          const result = replaceIngredients(item, body.ingredients);
          if (!result.ok) {
            send(res, 400, { error: result.error, code: result.code });
            return true;
          }
        }
        item.updated_at = nowIso();
        writeDb(db());
        send(res, 200, withIngredients(item));
        return true;
      }
    }

    send(res, 404, { error: "not_found", code: "not_found" });
    return true;
  }

  function serveMedia(req, res, urlPath) {
    const rel = decodeURIComponent(urlPath.replace(/^\/media\/?/, "")).replace(/\\/g, "/");
    if (!rel || rel.includes("..")) {
      deny(res, 403, "forbidden");
      return true;
    }
    const abs = path.normalize(path.join(UPLOADS, rel));
    if (!abs.startsWith(path.normalize(UPLOADS))) {
      deny(res, 403, "forbidden");
      return true;
    }
    if (!fs.existsSync(abs)) {
      send(res, 404, "not found");
      return true;
    }
    const ext = path.extname(abs).toLowerCase();
    const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[ext];
    if (!mime) {
      deny(res, 403, "forbidden");
      return true;
    }
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "public, max-age=86400" });
    fs.createReadStream(abs).pipe(res);
    return true;
  }

  function onApproved(business, app) {
    ensureCollections();
    business.description = business.description || "";
    business.short_description = business.short_description || "";
    business.cover_url = business.cover_url || "";
    business.cover_original_url = business.cover_original_url || "";
    business.cover_normalized = Boolean(business.cover_normalized);
    if (!business.cover_crop_mobile) business.cover_crop_mobile = defaultCoverCrop();
    if (!business.cover_crop_desktop) business.cover_crop_desktop = defaultCoverCrop();
    business.facebook = business.facebook || "";
    business.instagram = business.instagram || "";
    if (!db().business_hours.some((h) => h.business_id === business.id)) {
      db().business_hours.push(defaultHours(business.id, nowIso));
    }
    if (app && app.contact_email && !db().owners.some((o) => o.id === app.applicant_user_id)) {
      db().owners.push({
        id: app.applicant_user_id,
        email: String(app.contact_email).toLowerCase(),
        password_hash: "",
        created_at: nowIso(),
      });
    }
  }

  return { handle, serveMedia, publicCatalog, publicDetail, onApproved, isReady, liveFromHours, hoursFor };
}

module.exports = {
  createBusinessApi,
  DAYS,
  parseGelToTetri,
  tetriToGel,
  liveFromHours,
  parseLegacyIngredients,
  normalizeIngredientNames,
  normalizeIngredientRows,
};
