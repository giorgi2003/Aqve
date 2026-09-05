const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aqve-dash-"));
process.env.AQVE_DATA_DIR = dir;
process.env.AQVE_ADMIN_EMAIL = "admin@test.local";
process.env.AQVE_ADMIN_PASSWORD = "secret1234";
process.env.AQVE_PORT = "0";

const { server, getDb } = require("./server.js");
const { parseLegacyIngredients, normalizeIngredientNames, normalizeIngredientRows, parseGelToTetri } = require("./business-api.js");

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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
  const page = await request(port, "GET", "/business/dashboard");
  assert.strictEqual(page.status, 200);
  assert.ok(String(page.body).includes("AQVE Business"));

  const login = await request(port, "POST", "/api/auth/login", { body: { email: "admin@test.local", password: "secret1234" } });
  const adminCookie = cookie(login, "aqve_admin");

  const pendingApp = await request(port, "POST", "/api/applications", { body: valid });
  const pendingCookie = cookie(pendingApp, "aqve_uid");
  const pendingDash = await request(port, "GET", "/api/business/session", { headers: { cookie: pendingCookie } });
  assert.strictEqual(pendingDash.status, 403);
  assert.strictEqual(pendingDash.body.code, "pending_review");

  const rejectedApp = await request(port, "POST", "/api/applications", { body: { ...valid, business_name: "Rejected Cafe", contact_email: "rej@example.com" } });
  const rejectedCookie = cookie(rejectedApp, "aqve_uid");
  await request(port, "POST", "/api/admin/applications/" + rejectedApp.body.id + "/reject", { headers: { cookie: adminCookie }, body: { reason: "incomplete documents" } });
  const rejectedDash = await request(port, "GET", "/api/business/session", { headers: { cookie: rejectedCookie } });
  assert.strictEqual(rejectedDash.status, 403);
  assert.strictEqual(rejectedDash.body.code, "rejected");

  const anon = await request(port, "GET", "/api/business/session");
  assert.strictEqual(anon.status, 401);

  const createdA = await request(port, "POST", "/api/applications", { body: { ...valid, business_name: "Restaurant A", contact_email: "a@example.com" } });
  const ownerA = cookie(createdA, "aqve_uid");
  const approvedA = await request(port, "POST", "/api/admin/applications/" + createdA.body.id + "/approve", { headers: { cookie: adminCookie }, body: {} });
  assert.strictEqual(approvedA.status, 200);
  const bizA = approvedA.body.business.id;

  const createdB = await request(port, "POST", "/api/applications", { body: { ...valid, business_name: "Restaurant B", contact_email: "b@example.com" } });
  const ownerB = cookie(createdB, "aqve_uid");
  const approvedB = await request(port, "POST", "/api/admin/applications/" + createdB.body.id + "/approve", { headers: { cookie: adminCookie }, body: {} });
  const bizB = approvedB.body.business.id;

  const sessionA = await request(port, "GET", "/api/business/session", { headers: { cookie: ownerA } });
  assert.strictEqual(sessionA.status, 200);
  assert.strictEqual(sessionA.body.businesses.length, 1);
  assert.strictEqual(sessionA.body.businesses[0].id, bizA);

  const steal = await request(port, "GET", "/api/business/" + bizB + "/overview", { headers: { cookie: ownerA } });
  assert.strictEqual(steal.status, 403);

  const stealPatch = await request(port, "PATCH", "/api/business/" + bizB, { headers: { cookie: ownerA }, body: { name: "Hacked" } });
  assert.strictEqual(stealPatch.status, 403);

  const stealHours = await request(port, "PUT", "/api/business/" + bizB + "/hours", { headers: { cookie: ownerA }, body: { days: [] } });
  assert.strictEqual(stealHours.status, 403);

  const publicBefore = await request(port, "GET", "/api/public/catalog");
  assert.ok(Array.isArray(publicBefore.body));
  assert.ok(!publicBefore.body.some((r) => r.id === bizA));

  const info = await request(port, "PATCH", "/api/business/" + bizA, {
    headers: { cookie: ownerA },
    body: {
      name: "Restaurant A Public",
      description: "Georgian bakery",
      short_description: "Tone and khinkali",
      phone: "555111222",
      address: "Rabati 20",
      facebook: "https://facebook.com/a",
      instagram: "https://instagram.com/a",
      identification_number: "000000000",
      legal_name: "should not write",
      approved_by: "hacker",
    },
  });
  assert.strictEqual(info.status, 200);
  assert.strictEqual(info.body.name, "Restaurant A Public");
  assert.strictEqual(info.body.phone, "555111222");
  assert.ok(!("identification_number" in info.body));
  assert.ok(!("legal_name" in info.body));
  assert.ok(!("approved_by" in info.body));
  assert.deepStrictEqual(info.body.cover_crop_mobile, { x: 50, y: 50, zoom: 1 });
  assert.deepStrictEqual(info.body.cover_crop_desktop, { x: 50, y: 50, zoom: 1 });
  assert.ok(!("cover_focal_x" in info.body));
  assert.ok(!("cover_focal_y" in info.body));

  const crop = await request(port, "PATCH", "/api/business/" + bizA, {
    headers: { cookie: ownerA },
    body: {
      cover_crop_mobile: { x: 65, y: 35, zoom: 1.4 },
      cover_crop_desktop: { x: 40, y: 20, zoom: 1.2 },
    },
  });
  assert.strictEqual(crop.status, 200);
  assert.deepStrictEqual(crop.body.cover_crop_mobile, { x: 65, y: 35, zoom: 1.4 });
  assert.deepStrictEqual(crop.body.cover_crop_desktop, { x: 40, y: 20, zoom: 1.2 });

  const cropClamp = await request(port, "PATCH", "/api/business/" + bizA, {
    headers: { cookie: ownerA },
    body: {
      cover_crop_mobile: { x: 140, y: -20, zoom: 9 },
      cover_crop_desktop: { x: -5, y: 200, zoom: 0.2 },
    },
  });
  assert.deepStrictEqual(cropClamp.body.cover_crop_mobile, { x: 100, y: 0, zoom: 2.5 });
  assert.deepStrictEqual(cropClamp.body.cover_crop_desktop, { x: 0, y: 100, zoom: 0.35 });

  const coverPair = await request(port, "PATCH", "/api/business/" + bizA, {
    headers: { cookie: ownerA },
    body: {
      cover_original_data: PNG,
      cover_data: PNG,
      cover_normalized: true,
    },
  });
  assert.strictEqual(coverPair.status, 200);
  assert.ok(coverPair.body.cover_url.includes("/cover/cover."));
  assert.ok(coverPair.body.cover_original_url.includes("/cover/original."));
  assert.strictEqual(coverPair.body.cover_normalized, true);
  assert.notStrictEqual(coverPair.body.cover_url, coverPair.body.cover_original_url);

  const stored = JSON.parse(fs.readFileSync(path.join(dir, "aqve.json"), "utf8"));
  const rowA = stored.businesses.find((b) => b.id === bizA);
  assert.strictEqual(rowA.identification_number, "123456789");
  assert.strictEqual(rowA.legal_name, "Tone LLC");

  const cat = await request(port, "POST", "/api/business/" + bizA + "/categories", { headers: { cookie: ownerA }, body: { name: "Burger" } });
  assert.strictEqual(cat.status, 201);
  const cat2 = await request(port, "POST", "/api/business/" + bizA + "/categories", { headers: { cookie: ownerA }, body: { name: "Drinks" } });
  const renamed = await request(port, "PATCH", "/api/business/" + bizA + "/categories/" + cat.body.id, { headers: { cookie: ownerA }, body: { name: "Burgers" } });
  assert.strictEqual(renamed.body.name, "Burgers");
  const reordered = await request(port, "POST", "/api/business/" + bizA + "/categories/reorder", { headers: { cookie: ownerA }, body: { order: [cat2.body.id, cat.body.id] } });
  assert.strictEqual(reordered.body[0].id, cat2.body.id);

  const noImage = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerA },
    body: { name: "Cheeseburger", category_id: cat.body.id, price: "12.50" },
  });
  assert.strictEqual(noImage.status, 400);

  const product = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerA },
    body: {
      name: "Double Cheeseburger",
      category_id: cat.body.id,
      description: "Beef and cheddar",
      price: "12.50",
      image_data: PNG,
      available: true,
      prep_time: "15-20",
    },
  });
  assert.strictEqual(product.status, 201);
  assert.strictEqual(product.body.price_tetri, 1250);
  assert.ok(product.body.image_url.startsWith("/media/businesses/" + bizA + "/products/"));
  assert.ok(!String(product.body.price_tetri).includes("."));

  const media = await request(port, "GET", product.body.image_url);
  assert.strictEqual(media.status, 200);

  const otherProduct = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerB },
    body: { name: "Stolen", category_id: cat.body.id, price: "1", image_data: PNG },
  });
  assert.strictEqual(otherProduct.status, 403);

  const stillHasProducts = await request(port, "DELETE", "/api/business/" + bizA + "/categories/" + cat.body.id, { headers: { cookie: ownerA } });
  assert.strictEqual(stillHasProducts.status, 409);
  assert.strictEqual(stillHasProducts.body.code, "has_products");

  const edited = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + product.body.id, {
    headers: { cookie: ownerA },
    body: { name: "Double Cheeseburger+", price: "13.00" },
  });
  assert.strictEqual(edited.body.name, "Double Cheeseburger+");
  assert.strictEqual(edited.body.price_tetri, 1300);

  const hours = await request(port, "PUT", "/api/business/" + bizA + "/hours", {
    headers: { cookie: ownerA },
    body: {
      days: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, closed: false, open: "00:00", close: "23:59" })),
    },
  });
  assert.strictEqual(hours.status, 200);
  assert.strictEqual(hours.body.days[0].open, "00:00");

  const catalog = await request(port, "GET", "/api/public/catalog");
  const live = catalog.body.find((r) => r.id === bizA);
  assert.ok(live);
  assert.deepStrictEqual(live.cover_crop_mobile, { x: 100, y: 0, zoom: 2.5 });
  assert.deepStrictEqual(live.cover_crop_desktop, { x: 0, y: 100, zoom: 0.35 });
  assert.ok(String(live.cover_original || "").includes("/cover/original."));
  assert.ok(!("focal_x" in live));
  assert.ok(!("focal_y" in live));
  assert.strictEqual(live.live, "open");
  assert.strictEqual(live.menu.Burgers[0].name, "Double Cheeseburger+");
  assert.strictEqual(live.menu.Burgers[0].price, 13);
  assert.ok(Array.isArray(live.menu.Burgers[0].ingredients));
  assert.ok(!("identification_number" in live));

  assert.deepStrictEqual(parseLegacyIngredients("კატლეტი, ყველი, ხახვი, პური"), ["კატლეტი", "ყველი", "ხახვი", "პური"]);
  assert.deepStrictEqual(normalizeIngredientNames(["  cheddar  ", "cheddar", "", "onion"]), ["cheddar", "onion"]);

  const withIngs = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerA },
    body: {
      name: "Veggie Burger",
      category_id: cat.body.id,
      description: "A juicy house burger.",
      price: "8",
      image_data: PNG,
      available: true,
      ingredients: [{ name: "  cheddar  " }, { name: "onion" }, { name: "onion" }, { name: "" }, { name: "bun" }],
    },
  });
  assert.strictEqual(withIngs.status, 201);
  assert.strictEqual(withIngs.body.description, "A juicy house burger.");
  assert.deepStrictEqual(withIngs.body.ingredients.map((i) => i.name), ["cheddar", "onion", "bun"]);
  assert.ok(withIngs.body.ingredients.every((i) => i.id && i.product_id === withIngs.body.id));

  const listed = await request(port, "GET", "/api/business/" + bizA + "/products", { headers: { cookie: ownerA } });
  const veggie = listed.body.find((p) => p.id === withIngs.body.id);
  assert.strictEqual(veggie.description, "A juicy house burger.");
  assert.strictEqual(veggie.ingredients.length, 3);

  const patchedIngs = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + withIngs.body.id, {
    headers: { cookie: ownerA },
    body: { ingredients: [{ name: "cheddar" }, { name: "tomato" }] },
  });
  assert.deepStrictEqual(patchedIngs.body.ingredients.map((i) => i.name), ["cheddar", "tomato"]);
  assert.strictEqual(patchedIngs.body.description, "A juicy house burger.");

  const stolenIng = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + withIngs.body.id, {
    headers: { cookie: ownerB },
    body: { ingredients: [{ name: "hack" }] },
  });
  assert.strictEqual(stolenIng.status, 403);

  assert.strictEqual(parseGelToTetri("2.00"), 200);
  assert.strictEqual(normalizeIngredientRows([{ name: "cheddar", extra_available: true, extra_price: "2.00" }]).rows[0].extra_price_tetri, 200);
  assert.strictEqual(normalizeIngredientRows([{ name: "cheddar", extra_available: true }]).ok, false);
  assert.strictEqual(normalizeIngredientRows([{ name: "cheddar", extra_available: true, extra_price: "-1" }]).ok, false);
  assert.strictEqual(normalizeIngredientRows([{ name: "cheddar", included_by_default: false, extra_available: false }]).ok, false);

  const extrasDish = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerA },
    body: {
      name: "Custom Burger",
      category_id: cat.body.id,
      description: "House burger",
      price: "8.00",
      image_data: PNG,
      available: true,
      ingredients: [
        { name: "onion", included_by_default: true },
        { name: "cheddar", included_by_default: true, extra_available: true, extra_price: "2.00" },
        { name: "bacon", included_by_default: false, extra_available: true, extra_price: "3" },
      ],
    },
  });
  assert.strictEqual(extrasDish.status, 201);
  const cheddar = extrasDish.body.ingredients.find((i) => i.name === "cheddar");
  const bacon = extrasDish.body.ingredients.find((i) => i.name === "bacon");
  const onion = extrasDish.body.ingredients.find((i) => i.name === "onion");
  assert.strictEqual(cheddar.extra_available, true);
  assert.strictEqual(cheddar.extra_price_tetri, 200);
  assert.strictEqual(cheddar.included_by_default, true);
  assert.strictEqual(bacon.included_by_default, false);
  assert.strictEqual(bacon.extra_price_tetri, 300);
  assert.strictEqual(onion.extra_available, false);
  assert.strictEqual(onion.extra_price_tetri, 0);

  const extrasAgain = await request(port, "GET", "/api/business/" + bizA + "/products", { headers: { cookie: ownerA } });
  const persisted = extrasAgain.body.find((p) => p.id === extrasDish.body.id).ingredients.find((i) => i.name === "cheddar");
  assert.strictEqual(persisted.extra_price_tetri, 200);

  const editedExtra = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + extrasDish.body.id, {
    headers: { cookie: ownerA },
    body: {
      ingredients: [
        { name: "onion", included_by_default: true },
        { name: "cheddar", included_by_default: true, extra_available: true, extra_price: "3.00" },
        { name: "bacon", included_by_default: false, extra_available: true, extra_price: "3" },
      ],
    },
  });
  const cheddar2 = editedExtra.body.ingredients.find((i) => i.name === "cheddar");
  const bacon2 = editedExtra.body.ingredients.find((i) => i.name === "bacon");
  assert.strictEqual(cheddar2.extra_price_tetri, 300);

  const keepExtras = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + extrasDish.body.id, {
    headers: { cookie: ownerA },
    body: { description: "Still house burger" },
  });
  assert.strictEqual(keepExtras.body.ingredients.find((i) => i.name === "cheddar").extra_price_tetri, 300);

  const badExtra = await request(port, "PATCH", "/api/business/" + bizA + "/products/" + extrasDish.body.id, {
    headers: { cookie: ownerA },
    body: { ingredients: [{ name: "cheddar", extra_available: true, extra_price: "abc" }] },
  });
  assert.strictEqual(badExtra.status, 400);
  assert.strictEqual(badExtra.body.code, "invalid_extra_price");

  const catalogExtras = await request(port, "GET", "/api/public/catalog");
  const liveExtra = catalogExtras.body.find((r) => r.id === bizA).menu.Burgers.find((p) => p.id === extrasDish.body.id);
  assert.strictEqual(liveExtra.price_tetri, 800);
  assert.strictEqual(liveExtra.ingredients.find((i) => i.name === "cheddar").extra_price_tetri, 300);
  assert.strictEqual(liveExtra.ingredients.find((i) => i.name === "bacon").included_by_default, false);

  const quoteOk = await request(port, "POST", "/api/public/quote", {
    body: {
      lines: [{
        itemId: extrasDish.body.id,
        qty: 1,
        removed: ["onion"],
        extras: [
          { id: cheddar2.id, qty: 2, extra_price_tetri: 1 },
          { id: bacon2.id, qty: 1, extra_price: 0.01 },
        ],
      }],
    },
  });
  assert.strictEqual(quoteOk.status, 200);
  assert.strictEqual(quoteOk.body.items_tetri, 800 + 300 * 2 + 300);
  assert.strictEqual(quoteOk.body.lines[0].unit_base_tetri, 800);
  assert.strictEqual(quoteOk.body.lines[0].extras.find((e) => e.name === "cheddar").extra_price_tetri, 300);
  assert.deepStrictEqual(quoteOk.body.lines[0].removed, ["onion"]);
  assert.deepStrictEqual(quoteOk.body.lines[0].kitchen.extra.map((e) => e.name), ["cheddar", "bacon"]);

  const quoteFake = await request(port, "POST", "/api/public/quote", {
    body: { lines: [{ itemId: extrasDish.body.id, qty: 1, extras: [{ id: "nope", qty: 1 }] }] },
  });
  assert.strictEqual(quoteFake.status, 400);
  assert.strictEqual(quoteFake.body.code, "invalid_extra");

  const quoteNeg = await request(port, "POST", "/api/public/quote", {
    body: { lines: [{ itemId: extrasDish.body.id, qty: 1, extras: [{ id: cheddar2.id, qty: -1 }] }] },
  });
  assert.strictEqual(quoteNeg.status, 400);

  await request(port, "POST", "/api/business/" + bizA + "/products/" + extrasDish.body.id + "/availability", {
    headers: { cookie: ownerA },
    body: { available: false },
  });

  const memory = getDb();
  memory.products.push({
    id: "legacy-burger",
    business_id: bizA,
    category_id: cat.body.id,
    name: "Legacy Burger",
    description: "კატლეტი, ყველი, ხახვი, პური",
    price_tetri: 900,
    image_url: product.body.image_url,
    available: true,
    prep_time: "",
    deleted_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  });
  const afterMigrate = await request(port, "GET", "/api/business/" + bizA + "/products", { headers: { cookie: ownerA } });
  const legacy = afterMigrate.body.find((p) => p.id === "legacy-burger");
  assert.ok(legacy);
  assert.strictEqual(legacy.description, "კატლეტი, ყველი, ხახვი, პური");
  assert.deepStrictEqual(legacy.ingredients.map((i) => i.name), ["კატლეტი", "ყველი", "ხახვი", "პური"]);
  const catalogIngs = await request(port, "GET", "/api/public/catalog");
  const liveIngs = catalogIngs.body.find((r) => r.id === bizA).menu.Burgers.find((p) => p.id === "legacy-burger");
  assert.deepStrictEqual(liveIngs.ingredients.map((i) => i.name), ["კატლეტი", "ყველი", "ხახვი", "პური"]);
  await request(port, "POST", "/api/business/" + bizA + "/products/" + withIngs.body.id + "/availability", {
    headers: { cookie: ownerA },
    body: { available: false },
  });
  await request(port, "POST", "/api/business/" + bizA + "/products/legacy-burger/availability", {
    headers: { cookie: ownerA },
    body: { available: false },
  });

  const disabled = await request(port, "POST", "/api/business/" + bizA + "/products/" + product.body.id + "/availability", {
    headers: { cookie: ownerA },
    body: { available: false },
  });
  assert.strictEqual(disabled.body.available, false);
  const catalogOff = await request(port, "GET", "/api/public/catalog");
  assert.ok(!catalogOff.body.some((r) => r.id === bizA));

  await request(port, "POST", "/api/business/" + bizA + "/products/" + product.body.id + "/availability", {
    headers: { cookie: ownerA },
    body: { available: true },
  });

  const extra = await request(port, "POST", "/api/business/" + bizA + "/products", {
    headers: { cookie: ownerA },
    body: { name: "Cola", category_id: cat2.body.id, price: "3", image_data: PNG, available: true },
  });
  await request(port, "POST", "/api/business/" + bizA + "/products/" + extra.body.id + "/availability", {
    headers: { cookie: ownerA },
    body: { available: false },
  });
  const catalogMixed = await request(port, "GET", "/api/public/catalog");
  const mixed = catalogMixed.body.find((r) => r.id === bizA);
  const cola = Object.values(mixed.menu).flat().find((p) => p.name === "Cola");
  assert.strictEqual(cola.available, false);
  const burger = mixed.menu.Burgers[0];
  assert.strictEqual(burger.available, true);

  const customerEdit = await request(port, "PATCH", "/api/business/" + bizA, { body: { name: "Customer hack" } });
  assert.strictEqual(customerEdit.status, 401);
  const customerProduct = await request(port, "POST", "/api/business/" + bizA + "/products", { body: { name: "x", price: "1" } });
  assert.strictEqual(customerProduct.status, 401);

  const archived = await request(port, "POST", "/api/business/" + bizA + "/products/" + extra.body.id + "/delete", { headers: { cookie: ownerA }, body: {} });
  assert.strictEqual(archived.status, 200);
  const list = await request(port, "GET", "/api/business/" + bizA + "/products", { headers: { cookie: ownerA } });
  assert.ok(!list.body.some((p) => p.id === extra.body.id));
  const db = JSON.parse(fs.readFileSync(path.join(dir, "aqve.json"), "utf8"));
  const soft = db.products.find((p) => p.id === extra.body.id);
  assert.ok(soft.deleted_at);

  const closed = await request(port, "PUT", "/api/business/" + bizA + "/hours", {
    headers: { cookie: ownerA },
    body: { days: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, closed: true, open: "09:00", close: "22:00" })) },
  });
  assert.strictEqual(closed.status, 200);
  const catalogClosed = await request(port, "GET", "/api/public/catalog");
  assert.strictEqual(catalogClosed.body.find((r) => r.id === bizA).live, "closed");

  const overview = await request(port, "GET", "/api/business/" + bizA + "/overview", { headers: { cookie: ownerA } });
  assert.strictEqual(overview.body.checklist.category, true);
  assert.strictEqual(overview.body.checklist.product, true);
  assert.strictEqual(overview.body.checklist.info, true);
  assert.strictEqual(overview.body.checklist.hours, false);

  const ownerApprove = await request(port, "POST", "/api/admin/applications/" + pendingApp.body.id + "/approve", { headers: { cookie: ownerA }, body: {} });
  assert.strictEqual(ownerApprove.status, 401);

  const adminStill = await request(port, "GET", "/api/admin/overview", { headers: { cookie: adminCookie } });
  assert.strictEqual(adminStill.status, 200);

  const pendingStill = await request(port, "GET", "/api/me/applications", { headers: { cookie: pendingCookie } });
  assert.strictEqual(pendingStill.body[0].status, "pending_review");

  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("dashboard tests passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
