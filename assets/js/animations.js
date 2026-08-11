/* =========================================================================
   MESC — Shared services animation system (v4)
   Reusable, data-attribute driven scroll storytelling for the Services
   sub-pages. Purely presentational: it never adds, edits, reorders or
   removes copy — it only wraps existing nodes so they can be revealed.
   Runs after steps.js so it only enhances what the step engine left alone.
   ========================================================================= */
(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("page-service")) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = (typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined") ? window.gsap : null;
  if (G) G.registerPlugin(ScrollTrigger);
  if (!reduced) document.documentElement.classList.add("js-anim");

  var EASE = "power3.out";           // ≈ cubic-bezier(.65,0,.35,1)
  var DIRS = ["ltr", "rtl", "btt"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function el(t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; }

  /* sticky needs unclipped ancestors */
  function unclip(node) {
    var n = node.parentNode;
    while (n && n !== document.body && n.nodeType === 1) {
      var cs = getComputedStyle(n);
      if (cs.overflow !== "visible" || cs.overflowY !== "visible") n.classList.add("has-steps");
      n = n.parentNode;
    }
  }

  /* --------------------------------------------------- split into lines */
  function splitLines(node) {
    if (!node || node.dataset.split) return [];
    var words = (node.textContent || "").trim().split(/\s+/);
    if (!words.length) return [];
    node.dataset.split = "1";
    node.textContent = "";
    var probes = words.map(function (w, i) {
      var s = document.createElement("span");
      s.style.display = "inline-block";
      s.textContent = w + (i < words.length - 1 ? " " : "");
      node.appendChild(s);
      return s;
    });
    var lines = [], top = null, cur = null;
    probes.forEach(function (s) {
      var t = Math.round(s.offsetTop);
      if (top === null || t !== top) { top = t; cur = []; lines.push(cur); }
      cur.push(s);
    });
    node.textContent = "";
    var wraps = lines.map(function (group) {
      var mask = el("span", "split-line");
      var inner = document.createElement("span");
      group.forEach(function (s) { inner.appendChild(document.createTextNode(s.textContent)); });
      mask.appendChild(inner);
      node.appendChild(mask);
      return inner;
    });
    return wraps;
  }

  /* ------------------------------------------------------- reveal engine */
  function onEnter(target, fn, start) {
    if (G) {
      ScrollTrigger.create({ trigger: target, start: start || "top 82%", once: true, onEnter: fn });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { fn(); io.disconnect(); } });
      }, { rootMargin: "0px 0px -18% 0px" });
      io.observe(target);
    }
  }

  /* ------------------------------------------------ enhance a service row */
  function enhanceRow(row, index, total) {
    if (row.closest(".steps")) return;
    var copy = row.querySelector(".frow-copy") || row.querySelector(".card-body");
    var media = row.querySelector(".frow-media") || row.querySelector(".card-media");
    var img = media ? media.querySelector("img") : null;
    if (!copy) return;

    var dir = DIRS[index % 3];
    if (index % 3 === 2) row.classList.add("svc-shape");
    if (media && (copy.textContent || "").length > 900) row.classList.add("svc-sticky"), unclip(media);

    /* eyebrow: draws a red rule, then reveals the existing step number */
    var numNode = copy.querySelector(".frow-num, .card-idx");
    var label = (numNode ? numNode.textContent.trim() : pad(index + 1)) + " / " + pad(total);
    var eyebrow = el("div", "svc-eyebrow", "<i></i><b>" + label + "</b>");
    copy.insertBefore(eyebrow, copy.firstChild);

    var heading = copy.querySelector("h2,h3,h4,.h2,.h3,.h4");
    var lines = reduced ? [] : splitLines(heading);
    var rest = [];
    copy.querySelectorAll(".prose > *, .link-more, .btn").forEach(function (n) { rest.push(n); });

    if (media) media.setAttribute("data-animation", "reveal"), media.setAttribute("data-dir", dir);
    if (!reduced && media) {
      media.style.clipPath = dir === "rtl" ? "inset(0 100% 0 0)" : dir === "btt" ? "inset(100% 0 0 0)" : "inset(0 0 0 100%)";
    }
    if (!reduced) rest.forEach(function (n) { n.style.opacity = "0"; n.style.transform = "translateY(24px)"; });

    function play() {
      row.classList.add("is-shown");
      if (media && !reduced) {
        if (G) {
          G.to(media, { clipPath: "inset(0 0 0 0)", duration: 1.15, ease: "power4.inOut" });
          if (img) G.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.3, ease: EASE });
        } else {
          media.style.transition = "clip-path 1.15s cubic-bezier(.65,0,.35,1)";
          media.style.clipPath = "inset(0 0 0 0)";
          if (img) img.style.transform = "scale(1)";
        }
      }
      if (G && !reduced) {
        if (lines.length) G.fromTo(lines, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: .95, ease: "power4.out", stagger: .07, delay: .25 });
        G.fromTo(rest, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, ease: EASE, stagger: .1, delay: .35, clearProps: "transform" });
      } else {
        lines.forEach(function (l, i) {
          l.style.transition = "transform .9s cubic-bezier(.65,0,.35,1) " + (.25 + i * .07) + "s";
          l.style.transform = "translateY(0)";
        });
        rest.forEach(function (n, i) {
          n.style.transition = "opacity .8s ease " + (.35 + i * .1) + "s, transform .8s cubic-bezier(.65,0,.35,1) " + (.35 + i * .1) + "s";
          n.style.opacity = "1"; n.style.transform = "none";
        });
      }
    }
    if (reduced) { row.classList.add("is-shown"); play(); } else onEnter(row, play, "top 80%");

    /* parallax drift — transform only, capped at ±22px */
    if (img && G && !reduced) {
      G.fromTo(img, { yPercent: -3.5 }, {
        yPercent: 3.5, ease: "none",
        scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: .4 }
      });
    }
  }

  /* -------------------------------------------------------------- rows */
  var rows = [];
  document.querySelectorAll(".frows").forEach(function (wrap) {
    var group = Array.prototype.slice.call(wrap.querySelectorAll(":scope > .frow"))
      .filter(function (r) { return !r.closest(".steps"); });
    group.forEach(function (r, i) { rows.push({ node: r, i: i, n: group.length }); });
  });
  document.querySelectorAll(".cards").forEach(function (wrap) {
    if (wrap.closest(".steps")) return;
    var group = Array.prototype.slice.call(wrap.querySelectorAll(":scope > .card"));
    if (group.length && !group[0].querySelector(".card-idx")) return;
    group.forEach(function (c, i) { rows.push({ node: c, i: i, n: group.length }); });
  });
  rows.forEach(function (r) { enhanceRow(r.node, r.i, r.n); });

  /* ------------------------------------------------- progress indicator */
  var units = Array.prototype.slice.call(
    document.querySelectorAll(".steps-track .step, .steps--h .h-panel")
  ).concat(rows.map(function (r) { return r.node; }));

  units.sort(function (a, b) {
    return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
  });

  if (units.length >= 2 && !reduced) {
    var rail = el("nav", "svc-progress");
    rail.setAttribute("aria-hidden", "true");
    var items = units.map(function (u, i) {
      var it = el("div", "p-item", '<span class="p-lbl">' + pad(i + 1) + "</span><span class=\"p-dot\"></span>");
      rail.appendChild(it);
      return it;
    });
    body.appendChild(rail);

    var active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      items.forEach(function (it, k) {
        it.classList.toggle("is-active", k === i);
        it.classList.toggle("is-done", k < i);
      });
    }
    function scan() {
      var mid = window.innerHeight * .45, best = -1, bestD = Infinity;
      units.forEach(function (u, i) {
        var r = u.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var d = Math.abs(r.top - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best > -1) setActive(best);
      rail.style.opacity = best > -1 ? "1" : "0";
      ticking = false;
    }
    var ticking = false;
    rail.style.transition = "opacity .4s ease";
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(scan); }
    }, { passive: true });
    scan();
  }

  /* ------------------------------------------------- cursor-tilt media */
  /* Uses GSAP's own transform cache (rotationX/Y, x/y as named props) so
     it composites cleanly with the parallax + reveal tweens already
     running on the same elements, instead of stomping their inline
     transform string with a second, conflicting one. */
  var canHover = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (canHover && !reduced && G) {
    document.querySelectorAll(".frow-media, .card-media").forEach(function (box) {
      var img = box.querySelector("img");
      if (!img) return;
      G.set(box, { transformPerspective: 900, transformStyle: "preserve-3d" });
      box.addEventListener("mousemove", function (e) {
        var r = box.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        G.to(box, { rotationY: px * 8, rotationX: py * -8, duration: .6, ease: "power2.out", overwrite: "auto" });
        G.to(img, { x: px * -14, y: py * -14, scale: 1.06, duration: .6, ease: "power2.out", overwrite: "auto" });
      });
      box.addEventListener("mouseleave", function () {
        G.to(box, { rotationY: 0, rotationX: 0, duration: .8, ease: "power3.out" });
        G.to(img, { x: 0, y: 0, scale: 1, duration: .8, ease: "power3.out" });
      });
    });
  }

  /* --------------------------------------- interactive blueprint grid */
  if (!reduced) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("is-near", e.isIntersecting); });
    }, { threshold: .12 });
    document.querySelectorAll(".section").forEach(function (s) { io2.observe(s); });
  }

  if (G) { ScrollTrigger.refresh(); window.addEventListener("load", function () { ScrollTrigger.refresh(); }); }
})();
