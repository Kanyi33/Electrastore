/* Electra Store — app.js */
(function () {
  "use strict";

  var WA = "254721155530";
  var GTA_RELEASE = new Date("2026-11-19T00:00:00+03:00"); // edit if Rockstar changes the date

  var $ = function (id) { return document.getElementById(id); };
  var products = [], cat = "all", q = "";

  /* ---------- helpers ---------- */
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var nf = new Intl.NumberFormat("en-KE");
  function money(n) { return "KSh " + nf.format(n); }
  function waLink(p) {
    var msg = "Hello, I am interested in the " + p.name + (p.price ? " (" + money(p.price) + ")" : "") + ".";
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }

  /* ---------- products (data lives in products.json) ---------- */
  var grid = $("pg");
  var WA_ICON = '<span class="wai"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#wa"/></svg></span>';

  function card(p, k) {
    var l = waLink(p), name = esc(p.name);
    var media = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + name + '" width="600" height="600" loading="lazy" decoding="async">'
      : '<svg class="i" aria-hidden="true"><use href="#' + esc(p.icon || "pad") + '"/></svg>';
    return '<article class="product-card" style="animation-delay:' + (k * 0.05) + 's">' +
      '<a class="product-card__media" href="' + l + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">' + media + '</a>' +
      '<h3 class="product-card__name"><a href="' + l + '" target="_blank" rel="noopener">' + name + '</a></h3>' +
      '<p class="product-card__price' + (p.price ? "" : " ask") + '">' + (p.price ? money(p.price) : "Message for price") + '</p>' +
      '<a class="product-card__btn" href="' + l + '" target="_blank" rel="noopener" aria-label="Ask about ' + name + ' on WhatsApp">' + WA_ICON + 'WhatsApp Us</a>' +
      '</article>';
  }

  function show() {
    var list = products.filter(function (p) {
      return (cat === "all" || p.category === cat) && (p.name + " " + p.brand).toLowerCase().indexOf(q) > -1;
    });
    grid.innerHTML = list.length
      ? list.map(card).join("")
      : '<p class="pg-msg">No match yet. Message us on WhatsApp and we will help you find it.</p>';
  }

  // Product structured data for search engines (priced items only)
  function injectProductLD() {
    var base = location.origin + location.pathname;
    var items = products.filter(function (p) { return p.price; }).map(function (p) {
      var o = {
        "@type": "Product",
        name: p.name,
        brand: { "@type": "Brand", name: p.brand },
        category: p.category,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "KES",
          itemCondition: "https://schema.org/" + (p.condition === "used" ? "UsedCondition" : "NewCondition"),
          url: base + "#shop"
        }
      };
      if (p.image) o.image = new URL(p.image, base).href;
      return o;
    });
    if (!items.length) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": items });
    document.head.appendChild(s);
  }

  fetch("products.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { products = d; show(); injectProductLD(); })
    .catch(function () {
      grid.innerHTML = '<p class="pg-msg">Products could not be loaded. Message us on WhatsApp and we will help you right away.</p>';
    });

  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".tabs button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      cat = b.dataset.c;
      show();
    });
  });
  var qi = $("q");
  qi.addEventListener("input", function () { q = qi.value.trim().toLowerCase(); show(); });
  qi.addEventListener("keydown", function (e) { if (e.key === "Enter") location.hash = "#shop"; });

  /* ---------- brand marquee: logos are written once in the HTML, cloned here ---------- */
  var track = document.querySelector(".track");
  if (track && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    var originals = Array.prototype.slice.call(track.children);
    for (var c = 0; c < 3; c++) {
      originals.forEach(function (n) {
        var k = n.cloneNode(true);
        k.setAttribute("aria-hidden", "true");
        track.appendChild(k);
      });
    }
  }

  /* ---------- nav, header state, progress bar (one scroll handler) ---------- */
  var hd = $("hd"), nav = $("nav"), bg = $("bg"), pr = $("prog");
  var links = nav.querySelectorAll("a"), ids = ["categories", "why", "shop", "contact"], ticking = false;

  function closeNav() {
    nav.classList.remove("open");
    bg.setAttribute("aria-expanded", "false");
    hd.classList.remove("m");
  }
  bg.addEventListener("click", function () {
    var o = nav.classList.toggle("open");
    bg.setAttribute("aria-expanded", o);
    hd.classList.toggle("m", o);
  });
  links.forEach(function (a) { a.addEventListener("click", closeNav); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  function onScroll() {
    ticking = false;
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    hd.classList.toggle("s", y > 10);
    pr.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    var cur = "";
    ids.forEach(function (id) {
      var el = $(id);
      if (el && el.getBoundingClientRect().top < 140) cur = id;
    });
    links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + cur); });
  }
  addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });

  /* ---------- GTA VI countdown ---------- */
  var cd = $("cd"), pre = $("preorder");
  function p2(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var d = GTA_RELEASE - Date.now();
    if (d <= 0) {
      cd.className = "cd out";
      cd.textContent = "Out now";
      pre.setAttribute("aria-label", "Order on WhatsApp");
      clearInterval(timer);
      return;
    }
    var s = Math.floor(d / 1000);
    $("cd-d").textContent = Math.floor(s / 86400);
    $("cd-h").textContent = p2(Math.floor(s % 86400 / 3600));
    $("cd-m").textContent = p2(Math.floor(s % 3600 / 60));
    $("cd-s").textContent = p2(s % 60);
  }
  var timer = setInterval(tick, 1000);
  tick();
})();
