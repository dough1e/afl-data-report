/* @puntedit feed grid — every post as a tile; videos autoplay; click opens the shared lightbox. */
(function () {
  "use strict";

  var grid = document.getElementById("feed-grid");
  var loading = document.getElementById("feed-loading");
  var countEl = document.getElementById("feed-count");
  if (!grid) return;

  var ICON =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<rect x="7.5" y="4" width="12.5" height="12.5" rx="3" fill="#fff" opacity=".5"/>' +
      '<rect x="4" y="7.5" width="12.5" height="12.5" rx="3" fill="#fff"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function isVideo(name) { return /\.mp4$/i.test(name); }

  function coverMarkup(post) {
    var url = post.dir + "/" + post.cover;
    if (isVideo(post.cover)) {
      var poster = post.dir + "/" + post.cover.replace(/\.mp4$/i, "_poster.png");
      return '<video class="ig-vid" src="' + esc(url) + '" poster="' + esc(poster) +
             '" autoplay muted loop playsinline preload="metadata"></video>';
    }
    return '<img src="' + esc(url) + '" alt="' + esc(post.title || "Instagram post") + '" loading="lazy">';
  }

  function buildTile(post) {
    var n = post.slides.length;
    var multi = n > 1;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ig-tile";
    btn.setAttribute("aria-label", "Open post (" + n + (n === 1 ? " image" : " items") + ")");
    btn.innerHTML =
      '<div class="ig-media">' +
        coverMarkup(post) +
        (isVideo(post.cover) ? '<span class="vid-badge" aria-hidden="true">▶</span>' : "") +
        (multi ? '<span class="ig-ic">' + ICON + "</span><span class=\"count-pill\">" + n + "</span>" : "") +
        '<span class="cover-hint"><span class="hint-pill">' + (multi ? "View all " + n + " ›" : "View ›") + "</span></span>" +
      "</div>";
    btn.addEventListener("click", function () { if (window.Lightbox) window.Lightbox.open(post, btn); });
    return btn;
  }

  fetch("feed.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var list = (data && data.carousels) || [];
      if (!list.length) { loading.textContent = "No posts found."; return; }
      grid.innerHTML = "";
      list.forEach(function (p) { grid.appendChild(buildTile(p)); });
      if (countEl) countEl.textContent = list.length + " posts · tap to view";
    })
    .catch(function (err) { loading.textContent = "Could not load the feed (" + err.message + ")."; });
})();
