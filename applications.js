(function (root) {
  const STATUSES = Object.freeze({
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    REJECTED: "rejected",
    NEEDS_INFORMATION: "needs_information",
  });

  const BUSINESS_TYPES = Object.freeze([
    { id: "restaurant", label: "\u10e0\u10d4\u10e1\u10e2\u10dd\u10e0\u10d0\u10dc\u10d8" },
    { id: "cafe", label: "\u10d9\u10d0\u10e4\u10d4" },
    { id: "bakery", label: "\u10e1\u10d0\u10ea\u10ee\u10dd\u10d1\u10d8" },
    { id: "confectionery", label: "\u10e1\u10d0\u10d9\u10dd\u10dc\u10d3\u10d8\u10e2\u10e0\u10dd" },
    { id: "market", label: "\u10db\u10d0\u10e0\u10d9\u10d4\u10e2\u10d8" },
    { id: "flowers", label: "\u10e7\u10d5\u10d0\u10d5\u10d8\u10da\u10d4\u10d1\u10d8" },
    { id: "other", label: "\u10e1\u10ee\u10d5\u10d0" },
  ]);

  const CITIES = Object.freeze([
    { id: "akhaltsikhe", label: "\u10d0\u10ee\u10d0\u10da\u10ea\u10d8\u10ee\u10d4" },
  ]);

  const CONTACT_ROLES = Object.freeze([
    { id: "owner", label: "\u10db\u10e4\u10da\u10dd\u10d1\u10d4\u10da\u10d8" },
    { id: "manager", label: "\u10db\u10d4\u10dc\u10d4\u10ef\u10d4\u10e0\u10d8" },
    { id: "employee", label: "\u10d7\u10d0\u10dc\u10d0\u10db\u10e8\u10e0\u10dd\u10db\u10d4\u10da\u10d8" },
    { id: "other", label: "\u10e1\u10ee\u10d5\u10d0" },
  ]);

  const APPLICANT_KEY = "aqve-applicant-id";
  const STORE_KEY = "aqve-business-applications";
  const LOGO_MAX_BYTES = 2 * 1024 * 1024;
  const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

  function uid() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function memoryStorage() {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    };
  }

  function createApplicationStore(storage) {
    const db = storage || root.localStorage || memoryStorage();

    function getApplicantId() {
      let id = db.getItem(APPLICANT_KEY);
      if (!id) {
        id = uid();
        db.setItem(APPLICANT_KEY, id);
      }
      return id;
    }

    function readAll() {
      try {
        const rows = JSON.parse(db.getItem(STORE_KEY) || "[]");
        return Array.isArray(rows) ? rows : [];
      } catch {
        return [];
      }
    }

    function writeAll(rows) {
      try {
        db.setItem(STORE_KEY, JSON.stringify(rows));
      } catch (error) {
        const err = new Error("network");
        err.code = "network";
        throw err;
      }
    }

    function forbidden() {
      const err = new Error("forbidden");
      err.code = "forbidden";
      return err;
    }

    function labelOf(list, id) {
      return list.find((x) => x.id === id)?.label || "";
    }

    function digits(value) {
      return String(value || "").replace(/\D/g, "");
    }

    function normalizePhone(value) {
      let n = digits(value);
      if (n.startsWith("995")) n = n.slice(3);
      if (n.startsWith("0")) n = n.slice(1);
      return n;
    }

    function isValidGePhone(value) {
      const n = normalizePhone(value);
      return n.length === 9 && n.startsWith("5");
    }

    function formatGePhone(value) {
      const n = normalizePhone(value);
      if (!isValidGePhone(n)) return String(value || "").trim();
      return "+995 " + n.slice(0, 3) + " " + n.slice(3, 5) + " " + n.slice(5, 7) + " " + n.slice(7, 9);
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    }

    function isValidSocial(value) {
      const s = String(value || "").trim();
      if (!s) return true;
      if (s.startsWith("@") && s.length > 1 && !/\s/.test(s)) return true;
      try {
        const u = new URL(s.includes("://") ? s : "https://" + s);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }

    function isValidIdNumber(value) {
      const n = digits(value);
      if (!n) return true;
      return n.length === 9 || n.length === 11;
    }

    function isValidLogoFile(file) {
      if (!file) return { ok: true };
      const typeOk = LOGO_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name || "");
      if (!typeOk) return { ok: false, code: "logo_type" };
      if (file.size > LOGO_MAX_BYTES) return { ok: false, code: "logo_size" };
      return { ok: true };
    }

    function requiredFields(input) {
      return {
        business_name: String(input.business_name || "").trim(),
        business_type: String(input.business_type || "").trim(),
        city: String(input.city || "").trim(),
        address: String(input.address || "").trim(),
        business_phone: formatGePhone(input.business_phone),
        social_url: String(input.social_url || "").trim(),
        logo_url: String(input.logo_url || ""),
        contact_first_name: String(input.contact_first_name || "").trim(),
        contact_last_name: String(input.contact_last_name || "").trim(),
        contact_phone: formatGePhone(input.contact_phone),
        contact_email: String(input.contact_email || "").trim().toLowerCase(),
        contact_role: String(input.contact_role || "").trim(),
        legal_name: String(input.legal_name || "").trim(),
        identification_number: digits(input.identification_number),
        authority: Boolean(input.authority),
        terms: Boolean(input.terms),
      };
    }

    function validate(input) {
      const data = requiredFields(input);
      const errors = {};
      if (!data.business_name) errors.business_name = true;
      if (!BUSINESS_TYPES.some((t) => t.id === data.business_type)) errors.business_type = true;
      if (!CITIES.some((c) => c.id === data.city)) errors.city = true;
      if (!data.address) errors.address = true;
      if (!isValidGePhone(data.business_phone)) errors.business_phone = true;
      if (!isValidSocial(data.social_url)) errors.social_url = true;
      if (!data.contact_first_name) errors.contact_first_name = true;
      if (!data.contact_last_name) errors.contact_last_name = true;
      if (!isValidGePhone(data.contact_phone)) errors.contact_phone = true;
      if (!isValidEmail(data.contact_email)) errors.contact_email = true;
      if (!CONTACT_ROLES.some((r) => r.id === data.contact_role)) errors.contact_role = true;
      if (!isValidIdNumber(data.identification_number)) errors.identification_number = true;
      if (!data.authority) errors.authority = true;
      if (!data.terms) errors.terms = true;
      return { data, errors, ok: Object.keys(errors).length === 0 };
    }

    function ownerView(row) {
      if (!row) return null;
      return { ...row };
    }

    function publicView() {
      return null;
    }

    function createApplication(raw, actorId) {
      const applicant = actorId || getApplicantId();
      const { data, errors, ok } = validate(raw);
      if (!ok) {
        const err = new Error("invalid");
        err.code = "invalid";
        err.errors = errors;
        throw err;
      }
      const row = {
        id: uid(),
        applicant_user_id: applicant,
        business_name: data.business_name,
        business_type: data.business_type,
        city: data.city,
        address: data.address,
        business_phone: data.business_phone,
        social_url: data.social_url,
        logo_url: data.logo_url,
        contact_first_name: data.contact_first_name,
        contact_last_name: data.contact_last_name,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        contact_role: data.contact_role,
        legal_name: data.legal_name,
        identification_number: data.identification_number,
        status: STATUSES.PENDING_REVIEW,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const rows = readAll();
      rows.push(row);
      writeAll(rows);
      return ownerView(row);
    }

    function listMyApplications(actorId) {
      const applicant = actorId || getApplicantId();
      return readAll().filter((row) => row.applicant_user_id === applicant).map(ownerView);
    }

    function getMyApplication(id, actorId) {
      const applicant = actorId || getApplicantId();
      const row = readAll().find((item) => item.id === id);
      if (!row || row.applicant_user_id !== applicant) throw forbidden();
      return ownerView(row);
    }

    function listPublicBusinessesFromApplications() {
      return [];
    }

    function isPubliclyListed() {
      return false;
    }

    async function submitApplication(raw, actorId) {
      if (typeof fetch === "function" && typeof window !== "undefined") {
        const payload = JSON.stringify(raw);
        const urls = ["/api/applications"];
        const host = location.hostname;
        const port = String(location.port || "");
        if (host === "localhost" || host === "127.0.0.1") {
          if (port !== "5501") urls.push(location.protocol + "//" + host + ":5501/api/applications");
          if (port !== "5500") urls.push(location.protocol + "//" + host + ":5500/api/applications");
        }
        let lastErr = null;
        for (const url of urls) {
          try {
            const res = await fetch(url, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: payload,
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body && body.id) return body;
            lastErr = Object.assign(new Error(body.error || "network"), {
              code: body.code || "network",
              errors: body.errors,
            });
            if (lastErr.code === "invalid") throw lastErr;
          } catch (err) {
            if (err && err.code === "invalid") throw err;
            lastErr = err && err.code ? err : Object.assign(new Error("network"), { code: "network" });
          }
        }
        throw lastErr || Object.assign(new Error("network"), { code: "network" });
      }
      await new Promise((resolve) => setTimeout(resolve, 550));
      return createApplication(raw, actorId);
    }

    return {
      getApplicantId,
      createApplication,
      submitApplication,
      listMyApplications,
      getMyApplication,
      listPublicBusinessesFromApplications,
      isPubliclyListed,
      publicView,
      validate,
      requiredFields,
      isValidGePhone,
      isValidEmail,
      isValidSocial,
      isValidIdNumber,
      isValidLogoFile,
      formatGePhone,
      normalizePhone,
      labelOf,
    };
  }

  const api = {
    STATUSES,
    BUSINESS_TYPES,
    CITIES,
    CONTACT_ROLES,
    LOGO_MAX_BYTES,
    LOGO_TYPES,
    createApplicationStore,
    store: createApplicationStore(),
  };

  root.AqveApplications = api;
})(typeof window !== "undefined" ? window : globalThis);
