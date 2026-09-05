/* AQVE restaurant media freshness guard.
   Business cover files are overwritten at stable /media/... URLs. Browsers can
   therefore keep showing the previous bitmap after the cover editor saves a
   new composition. Add a version query to media URLs returned by the public
   catalog/detail APIs so Home renders the same freshly saved cover. */
(() => {
  const nativeFetch = window.fetch.bind(window);

  function freshMediaUrl(value, stamp) {
    const raw = String(value || "");
    if (!raw || !raw.includes("/media/")) return raw;
    const join = raw.includes("?") ? "&" : "?";
    return raw + join + "aqve_cover_v=" + encodeURIComponent(stamp);
  }

  function refreshRestaurantMedia(row, stamp) {
    if (!row || typeof row !== "object") return row;
    if (row.image) row.image = freshMediaUrl(row.image, stamp);
    if (row.logo) row.logo = freshMediaUrl(row.logo, stamp);
    if (row.cover_url) row.cover_url = freshMediaUrl(row.cover_url, stamp);
    if (row.logo_url) row.logo_url = freshMediaUrl(row.logo_url, stamp);
    return row;
  }

  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    try {
      const input = args[0];
      const url = typeof input === "string" ? input : input && input.url;
      if (!url || !/\/api\/public\/(catalog|businesses\/)/.test(url)) return response;
      if (!response.ok) return response;

      const copy = response.clone();
      const body = await copy.json();
      const stamp = Date.now();
      if (Array.isArray(body)) body.forEach((row) => refreshRestaurantMedia(row, stamp));
      else refreshRestaurantMedia(body, stamp);

      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      headers.set("cache-control", "no-store");
      return new Response(JSON.stringify(body), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (_) {
      return response;
    }
  };
})();
