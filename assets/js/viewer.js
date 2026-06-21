/* Punted It — gallery builder + carousel lightbox. Vanilla JS, no deps. */
(function () {
  "use strict";

  var grid = document.getElementById("grid");
  var loading = document.getElementById("loading");
  var countHead = document.getElementById("count-head");

  var viewer = document.getElementById("viewer");
  var vImg = document.getElementById("vImg");
  var vPrev = document.getElementById("vPrev");
  var vNext = document.getElementById("vNext");
  var vClose = document.getElementById("vClose");
  var vDots = document.getElementById("vDots");
  var vTitle = document.getElementById("vTitle");
  var vCounter = document.getElementById("vCounter");

  var current = null; // { slug, title, slides: [] }
  var index = 0;
  var lastFocus = null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function buildCard(c) {
    var btn = el("button", "cc");
    btn.type = "button";
    btn.setAttribute("aria-label", "Open carousel: " + c.title);
    var n = c.slides.length;
    btn.innerHTML =
      '<div class="cover">' +
        '<span class="badge">' + n + " slides</span>" +
        '<img src="' + esc(c.slug) + "/" + esc(c.cover) + '" alt="' + esc(c.title) + '" loading="lazy">' +
      "</div>" +
      '<div class="cc-body">' +
        (c.tag ? '<span class="tag">' + esc(c.tag) + "</span>" : "") +
        "<h3>" + esc(c.title) + "</h3>" +
        "<p>" + esc(c.blurb || "") + "</p>" +
        '<span class="view">View carousel →</span>' +
      "</div>";
    btn.addEventListener("click", function () { open(c, btn); });
    return btn;
  }

  function render(list) {
    grid.innerHTML = "";
    list.forEach(function (c) { grid.appendChild(buildCard(c)); });
    if (countHead) countHead.textContent = list.length + (list.length === 1 ? " carousel" : " carousels");
  }

  /* ---------- Viewer ---------- */
  function buildDots(n) {
    vDots.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var d = el("span", "v-dot" + (i === 0 ? " active" : ""));
      vDots.appendChild(d);
    }
  }

  function show(i) {
    if (!current) return;
    var n = current.slides.length;
    index = Math.max(0, Math.min(i, n - 1));
    vImg.src = current.slug + "/" + current.slides[index];
    vImg.alt = current.title + " — slide " + (index + 1);
    vCounter.textContent = (index + 1) + " / " + n;
    vPrev.disabled = index === 0;
    vNext.disabled = index === n - 1;
    var dots = vDots.children;
    for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("active", d === index);
    // preload neighbours
    [index - 1, index + 1].forEach(function (k) {
      if (k >= 0 && k < n) { var p = new Image(); p.src = current.slug + "/" + current.slides[k]; }
    });
  }

  function open(c, trigger) {
    current = c;
    lastFocus = trigger || document.activeElement;
    vTitle.textContent = c.title;
    buildDots(c.slides.length);
    show(0);
    viewer.classList.add("open");
    document.body.style.overflow = "hidden";
    vClose.focus();
  }

  function close() {
    viewer.classList.remove("open");
    document.body.style.overflow = "";
    vImg.removeAttribute("src");
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  vPrev.addEventListener("click", function () { show(index - 1); });
  vNext.addEventListener("click", function () { show(index + 1); });
  vClose.addEventListener("click", close);
  viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target.classList.contains("viewer-stage")) close(); });

  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });

  // touch swipe
  var tx = 0, ty = 0;
  viewer.addEventListener("touchstart", function (e) {
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
  }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Load manifest ---------- */
  fetch("carousels.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var list = (data && data.carousels) || [];
      if (!list.length) { loading.textContent = "No carousels found."; return; }
      render(list);
    })
    .catch(function (err) {
      loading.textContent = "Could not load carousels (" + err.message + ").";
    });
})();
