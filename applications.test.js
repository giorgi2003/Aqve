const assert = require("assert");
require("./applications.js");

const { AqveApplications } = globalThis;
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

const valid = {
  business_name: "Meskhetis Tone",
  business_type: "bakery",
  city: "akhaltsikhe",
  address: "Rabati 12",
  business_phone: "555123456",
  social_url: "https://instagram.com/aqve",
  logo_url: "",
  contact_first_name: "Nino",
  contact_last_name: "Beridze",
  contact_phone: "+995 555 12 34 56",
  contact_email: "nino@example.com",
  contact_role: "owner",
  legal_name: "Tone LLC",
  identification_number: "123456789",
  authority: true,
  terms: true,
};

function store() {
  return AqveApplications.createApplicationStore(memory());
}

const s = store();
const created = s.createApplication({ ...valid, status: "approved", applicant_user_id: "attacker", role: "business_owner" }, "user-a");

assert.strictEqual(created.status, "pending_review");
assert.strictEqual(created.applicant_user_id, "user-a");
assert.ok(!created.role);
assert.strictEqual(s.listPublicBusinessesFromApplications().length, 0);
assert.strictEqual(s.isPubliclyListed(created), false);
assert.strictEqual(s.publicView(created), null);
assert.strictEqual(s.listMyApplications("user-a").length, 1);
assert.strictEqual(s.listMyApplications("user-b").length, 0);

assert.throws(() => s.getMyApplication(created.id, "user-b"), (err) => err.code === "forbidden");
assert.strictEqual(s.getMyApplication(created.id, "user-a").identification_number, "123456789");

const publicShape = s.listPublicBusinessesFromApplications();
assert.ok(!JSON.stringify(publicShape).includes("123456789"));
assert.ok(!JSON.stringify(publicShape).includes(created.contact_email));

assert.throws(() => s.createApplication({ ...valid, business_name: "" }, "user-a"), (err) => err.code === "invalid");
assert.ok(s.isValidGePhone("555123456"));
assert.ok(s.isValidGePhone("+995 555 12 34 56"));
assert.ok(!s.isValidGePhone("12345"));
assert.ok(s.isValidEmail("a@b.ge"));
assert.ok(!s.isValidEmail("nope"));

console.log("applications tests passed");
