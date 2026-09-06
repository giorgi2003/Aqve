/* AQVE simple customer cover renderer.
   IMPORTANT: the customer card must render the already-normalized cover asset.
   Never use cover_original on mobile: cover_original is the raw upload and can
   be portrait/tall, which was the root cause of the stretched restaurant card.
   Runtime x/y/zoom composition is deliberately bypassed here. */

(function () {
  const originalRestaurantImageHTML = restaurantImageHTML;

  restaurantImageHTML = function finalRestaurantImageHTML({ src, alt, eager, variant, extras, restaurant }) {
    const r = restaurant || {};

    // `r.image` is business.cover_url from /api/public/catalog. That is the
    // normalized/exported cover produced by the Business editor. Use it on
    // BOTH desktop and mobile until the API has dedicated flattened
    // cover_desktop_url / cover_mobile_url fields.
    //
    // Do NOT fall back to r.cover_original for mobile. The original upload can
    // have any aspect ratio and was causing the tall/portrait card regression.
    const finalSrc = String(r.image || src || "");
    const name = String(alt || "");
    const load = eager ? "" : 'loading="lazy" decoding="async"';
    const url = finalSrc ? cacheBustCoverUrl(finalSrc, r) : "";
    const photo = url
      ? `<img class="ri-img aqve-final-cover-img" src="${esc(url)}" alt="${esc(name)}" ${load}>`
      : "";

    return `
      <div class="card-media ri restaurant-cover ri-${variant || "card"} aqve-final-cover" data-ri>
        <span class="card-sk"></span>
        <div class="ri-frame">
          ${photo}
          <span class="ri-ph" aria-hidden="true"></span>
          ${extras || ""}
        </div>
      </div>
    `;
  };

  function cacheBustCoverUrl(raw, r) {
    if (!raw) return "";
    const stamp = [
      r && r.cover_crop_desktop && r.cover_crop_desktop.x,
      r && r.cover_crop_desktop && r.cover_crop_desktop.y,
      r && r.cover_crop_desktop && r.cover_crop_desktop.zoom,
      r && r.cover_crop_mobile && r.cover_crop_mobile.x,
      r && r.cover_crop_mobile && r.cover_crop_mobile.y,
      r && r.cover_crop_mobile && r.cover_crop_mobile.zoom,
    ].join("-");
    return raw + (raw.includes("?") ? "&" : "?") + "final=" + encodeURIComponent(stamp || Date.now());
  }

  // Keep old function callable for legacy/non-final markup, but final covers
  // carry no crop attributes so applyRestaurantCover() cannot alter them.
  window.AQVE_originalRestaurantImageHTML = originalRestaurantImageHTML;
})();
