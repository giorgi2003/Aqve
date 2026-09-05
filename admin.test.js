const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aqve-admin-"));
process.env.AQVE_DATA_DIR = dir;
process.env.AQVE_ADMIN_EMAIL = "admin@test.local";
process.env.AQVE_ADMIN_PASSWORD = "secret1234";
process.env.AQVE_PORT = "0";

const { server } = require("./server.js");

const valid = {
  business_name: "Meskhetis Tone",
  business_type: "bakery",
  city: "akhaltsikhe",
  address: "Rabati 12",
  business_phone: "555123456",
  social_url: "https://instagram.com/aqve",
  contact_first_name: "Nino",
  contact_last_name: "Beridze",
  contact_phone: "555123456",
  contact_email: "nino@example.com",
  contact_role: "owner",
  legal_name: "Tone LLC",
  identification_number: "123456789",
  authority: true,
  terms: true,
};

function request(port, method, url, { body, headers } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path: url, method, headers: { "Content-Type": "application/json", ...(headers || {}) } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

function cookie(res, name) {
  const list = [].concat(res.headers["set-cookie"] || []);
  const hit = list.find((row) => row.startsWith(name + "="));
  return hit ? hit.split(";")[0] : "";
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const denied = await request(port, "GET", "/api/admin/applications");
  assert.strictEqual(denied.status, 401);

  const fakeApprove = await request(port, "POST", "/api/admin/applications/x/approve", { body: {} });
  assert.strictEqual(fakeApprove.status, 401);

  const created = await request(port, "POST", "/api/applications", { body: { ...valid, status: "approved", approved_by: "me" } });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.body.status, "pending_review");
  assert.ok(!created.body.identification_number);
  const applicantCookie = cookie(created, "aqve_uid");
  assert.ok(applicantCookie);
  const appId = created.body.id;

  const publicBiz = await request(port, "GET", "/api/public/businesses");
  assert.strictEqual(publicBiz.status, 200);
  assert.deepStrictEqual(publicBiz.body, []);

  const badLogin = await request(port, "POST", "/api/auth/login", { body: { email: "admin@test.local", password: "nope" } });
  assert.strictEqual(badLogin.status, 401);

  const login = await request(port, "POST", "/api/auth/login", { body: { email: "admin@test.local", password: "secret1234" } });
  assert.strictEqual(login.status, 200);
  const adminCookie = cookie(login, "aqve_admin");
  const auth = { cookie: adminCookie };

  const listed = await request(port, "GET", "/api/admin/applications", { headers: { cookie: adminCookie } });
  assert.strictEqual(listed.status, 200);
  assert.strictEqual(listed.body.length, 1);
  assert.strictEqual(listed.body[0].status, "pending_review");

  const detail = await request(port, "GET", "/api/admin/applications/" + appId, { headers: { cookie: adminCookie } });
  assert.strictEqual(detail.body.identification_number, "123456789");

  const otherUser = await request(port, "GET", "/api/admin/applications/" + appId, { headers: { cookie: applicantCookie } });
  assert.strictEqual(otherUser.status, 401);

  const emptyReject = await request(port, "POST", "/api/admin/applications/" + appId + "/reject", { headers: { cookie: adminCookie }, body: { reason: "" } });
  assert.strictEqual(emptyReject.status, 400);

  const emptyInfo = await request(port, "POST", "/api/admin/applications/" + appId + "/request-information", { headers: { cookie: adminCookie }, body: { message: "" } });
  assert.strictEqual(emptyInfo.status, 400);

  const first = await request(port, "POST", "/api/admin/applications/" + appId + "/approve", { headers: { cookie: adminCookie }, body: {} });
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.body.application.status, "approved");
  assert.strictEqual(first.body.member.role, "owner");
  assert.strictEqual(first.body.member.user_id, created.body.applicant_user_id || detail.body.applicant_user_id);
  const businessId = first.body.business.id;

  const second = await request(port, "POST", "/api/admin/applications/" + appId + "/approve", { headers: { cookie: adminCookie }, body: {} });
  assert.strictEqual(second.status, 200);
  assert.strictEqual(second.body.business.id, businessId);
  assert.ok(second.body.idempotent);

  const overview = await request(port, "GET", "/api/admin/overview", { headers: { cookie: adminCookie } });
  assert.strictEqual(overview.body.counts.approved, 1);
  assert.ok(overview.body.latest[0].approved_by === undefined);

  const stillPublic = await request(port, "GET", "/api/public/businesses");
  assert.deepStrictEqual(stillPublic.body, []);

  const mine = await request(port, "GET", "/api/me/businesses", { headers: { cookie: applicantCookie } });
  assert.strictEqual(mine.body.length, 1);
  assert.strictEqual(mine.body[0].id, businessId);

  const stranger = await request(port, "POST", "/api/applications", { body: valid });
  const strangerCookie = cookie(stranger, "aqve_uid");
  const otherBiz = await request(port, "GET", "/api/me/businesses", { headers: { cookie: strangerCookie } });
  assert.strictEqual(otherBiz.body.length, 0);

  const app2 = await request(port, "POST", "/api/applications", { body: { ...valid, business_name: "Second" }, headers: { cookie: applicantCookie } });
  const rejected = await request(port, "POST", "/api/admin/applications/" + app2.body.id + "/reject", { headers: { cookie: adminCookie }, body: { reason: "incomplete documents" } });
  assert.strictEqual(rejected.body.application.status, "rejected");

  const app3 = await request(port, "POST", "/api/applications", { body: { ...valid, business_name: "Third" } });
  const info = await request(port, "POST", "/api/admin/applications/" + app3.body.id + "/request-information", { headers: { cookie: adminCookie }, body: { message: "Please confirm the address." } });
  assert.strictEqual(info.body.application.status, "needs_information");

  const noDel = await request(port, "POST", "/api/admin/applications/" + app3.body.id + "/delete", { body: {} });
  assert.strictEqual(noDel.status, 401);

  const app3Cookie = cookie(app3, "aqve_uid");
  const blocked = await request(port, "POST", "/api/admin/applications/" + app3.body.id + "/block", { headers: { cookie: adminCookie }, body: {} });
  assert.strictEqual(blocked.body.application.status, "blocked");
  const blockedSubmit = await request(port, "POST", "/api/applications", { body: valid, headers: { cookie: app3Cookie } });
  assert.strictEqual(blockedSubmit.status, 403);

  const deleted = await request(port, "POST", "/api/admin/applications/" + app2.body.id + "/delete", { headers: { cookie: adminCookie }, body: {} });
  assert.strictEqual(deleted.status, 200);
  const gone = await request(port, "GET", "/api/admin/applications/" + app2.body.id, { headers: { cookie: adminCookie } });
  assert.strictEqual(gone.status, 404);

  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("admin tests passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
