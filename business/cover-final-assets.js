/* AQVE simple cover architecture.
   The editor exports two FINAL 16:9 assets. Customer pages should render these
   files directly; crop metadata is kept only for editor state/backward compatibility.

   Storage compatibility note: until the API gets dedicated cover_mobile_url and
   cover_desktop_url fields, cover_url stores the final desktop asset and
   cover_original_url stores the final mobile asset. */

applyCoverComposition = async function applyCoverCompositionFinal(form, img, desktop, mobile, file) {
  const desktopCrop = copyAqveCrop(desktop);
  const mobileCrop = copyAqveCrop(mobile);

  // Both exports are flattened pixels. No customer-side crop math is required.
  const desktopFinal = exportAqveCover(img, desktopCrop);
  const mobileFinal = exportAqveCover(img, mobileCrop);

  pendingCover = {
    normalized: desktopFinal,
    original: mobileFinal,
    desktop: desktopCrop,
    mobile: mobileCrop,
  };

  const drop = form.querySelector('[data-media-pick="cover"]');
  const dropImg = drop && drop.querySelector(".info-drop-img");
  if (dropImg) dropImg.src = desktopFinal;
  if (drop) drop.classList.add("has-photo");
  const del = form.querySelector('[data-media-clear="cover"]');
  if (del) del.hidden = false;
  const compose = form.querySelector("[data-cover-compose]");
  if (compose) compose.hidden = false;
  paintCoverQuality(form, desktopFinal);

  form.dataset.coverCropDesktop = JSON.stringify(desktopCrop);
  form.dataset.coverCropMobile = JSON.stringify(mobileCrop);

  const saveBox = document.querySelector("[data-studio-save]");
  const wasDirty = saveBox && saveBox.dataset.studioSave === "unsaved";

  try {
    const payload = {
      cover_data: desktopFinal,
      // Temporary compatibility slot: this is now the final MOBILE cover asset.
      cover_original_data: mobileFinal,
      cover_normalized: true,
      cover_crop_desktop: desktopCrop,
      cover_crop_mobile: mobileCrop,
    };
    const saved = await api("/api/business/" + bizId, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (saved && saved.cover_original_url) form.dataset.coverOriginal = saved.cover_original_url;
    pendingCover = null;
    me = await api("/api/business/session").catch(() => me);
  } catch (_) {}

  syncInfoStudio();
  if (!wasDirty && !pendingCover) form.dataset.snap = infoSnap(form);
};
