/* Shared lightbox (images + video) + the infographics card grid. Vanilla JS, no deps. */
(function () {
  "use strict";

  var viewer = document.getElementById("viewer");
  var vImg = document.getElementById("vImg");
  var vVid = document.getElementById("vVid");
  var vPrev = document.getElementById("vPrev");
  var vNext = document.getElementById("vNext");
  var vClose = document.getElementById("vClose");
  var vDots = document.getElementById("vDots");
  var vTitle = document.getElementById("vTitle");
  var vCounter = document.getElementById("vCounter");

  var current = null; // { dir, title, slides: [] }
  var index = 0;
  var lastFocus = null;

  function isVideo(name) { return /\.mp4$/i.test(name); }

  function buildDots(n) {
    vDots.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var d = document.createElement("span");
      d.className = "v-dot" + (i === 0 ? " active" : "");
      vDots.appendChild(d);
    }
  }

  function show(i) {
    if (!current) return;
    var n = current.slides.length;
    index = Math.max(0, Math.min(i, n - 1));
    var file = current.slides[index];
    var url = current.dir + "/" + file;
    if (isVideo(file)) {
      vImg.style.display = "none"; vImg.removeAttribute("src");
      vVid.style.display = ""; vVid.src = url;
      var p = vVid.play(); if (p && p.catch) p.catch(function () {});
    } else {
      vVid.pause(); vVid.removeAttribute("src"); vVid.style.display = "none";
      vImg.style.display = ""; vImg.src = url; vImg.alt = current.title + " — " + (index + 1);
    }
    vCounter.textContent = (index + 1) + " / " + n;
    vPrev.disabled = index === 0;
    vNext.disabled = index === n - 1;
    var dots = vDots.children;
    for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("active", d === index);
    // preload neighbouring images only (not videos)
    [index - 1, index + 1].forEach(function (k) {
      if (k >= 0 && k < n && !isVideo(current.slides[k])) {
        var pre = new Image(); pre.src = current.dir + "/" + current.slides[k];
      }
    });
  }

  function open(item, trigger) {
    current = item;
    lastFocus = trigger || document.activeElement;
    vTitle.textContent = item.title || "";
    buildDots(item.slides.length);
    show(0);
    viewer.classList.add("open");
    document.body.style.overflow = "hidden";
    vClose.focus();
  }

  function close() {
    viewer.classList.remove("open");
    document.body.style.overflow = "";
    vVid.pause(); vVid.removeAttribute("src");
    vImg.removeAttribute("src");
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  vPrev.addEventListener("click", function () { show(index - 1); });
  vNext.addEventListener("click", function () { show(index + 1); });
  vClose.addEventListener("click", close);
  viewer.addEventListener("click", function (e) {
    if (e.target === viewer || e.target.classList.contains("viewer-stage")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });
  // touch swipe
  var tx = 0, ty = 0;
  viewer.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // expose for the feed grid
  window.Lightbox = { open: open };

  /* ---------- Infographics card grid (reads carousels.json) ---------- */
  var grid = document.getElementById("grid");
  var loading = document.getElementById("loading");
  var countHead = document.getElementById("count-head");
  if (!grid) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function buildCard(c) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cc";
    btn.setAttribute("aria-label", "Open carousel: " + c.title);
    var n = c.slides.length;
    var icon =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
        '<rect x="7.5" y="4" width="12.5" height="12.5" rx="3" fill="#fff" opacity=".5"/>' +
        '<rect x="4" y="7.5" width="12.5" height="12.5" rx="3" fill="#fff"/></svg>';
    btn.innerHTML =
      '<div class="cover">' +
        '<span class="ig-ic" title="Multiple images">' + icon + "</span>" +
        '<span class="count-pill">1 / ' + n + "</span>" +
        '<img src="' + esc(c.dir) + "/" + esc(c.cover) + '" alt="' + esc(c.title) + '" loading="lazy">' +
        '<span class="cover-hint"><span class="hint-pill">View all ' + n + " ›</span></span>" +
      "</div>" +
      '<div class="cc-body">' +
        (c.tag ? '<span class="tag">' + esc(c.tag) + "</span>" : "") +
        "<h3>" + esc(c.title) + "</h3>" +
        "<p>" + esc(c.blurb || "") + "</p>" +
        '<span class="view">Swipe through all ' + n + " slides →</span>" +
      "</div>";
    btn.addEventListener("click", function () { open(c, btn); });
    return btn;
  }

  fetch("carousels.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var list = (data && data.carousels) || [];
      if (!list.length) { loading.textContent = "No carousels found."; return; }
      grid.innerHTML = "";
      list.forEach(function (c) { grid.appendChild(buildCard(c)); });
      if (countHead) countHead.textContent = list.length + " carousels · tap to view";
    })
    .catch(function (err) { loading.textContent = "Could not load carousels (" + err.message + ")."; });
})();
