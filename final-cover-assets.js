/* AQVE simple customer cover renderer.
   Desktop and mobile covers are already flattened by the Business editor.
   Never crop/translate/zoom them again on the customer side. */

(function () {
  const originalRestaurantImageHTML = restaurantImageHTML;

  restaurantImageHTML = function finalRestaurantImageHTML({ src, alt, eager, variant, extras, restaurant }) {
    const r = restaurant || {};
    const desktopSrc = String(r.image || src || "");
    const mobileSrc = String(r.cover_original || r.cover_original_url || desktopSrc);
    const chosen = isMobileView() ? mobileSrc : desktopSrc;
    const name = String(alt || "");
    const load = eager ? "" : 'loading="lazy" decoding="async"';
    const url = chosen ? cacheBustCoverUrl(chosen, r) : "";
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

  // Keep old function callable for legacy/non-final markup, but final covers deliberately
  // carry no crop attributes so applyRestaurantCover() cannot alter them.
  window.AQVE_originalRestaurantImageHTML = originalRestaurantImageHTML;
})();
