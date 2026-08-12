/* ============================================================
   MESC — interaction & scroll choreography (v2)
   GSAP + ScrollTrigger + Lenis (CDN, loaded per page)
   Vanilla JS only. Progressive enhancement — content works
   without JS (see html.no-js rules in styles.css).
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------------
     Pinned / sticky sections measure their scroll distance once, on load.
     Images that are still loading (esp. loading="lazy" ones lower on the
     page) resize after that measurement and quietly shift where a pin
     releases — the classic cause of a sticky image sitting flush against
     the footer with no runway. Every image load re-triggers a debounced
     refresh so pin/sticky math always matches the real, final layout. */
  if (hasGSAP && window.ScrollTrigger) {
    var refreshTimer = null;
    function scheduleRefresh() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 120);
    }
    document.querySelectorAll("img").forEach(function (img) {
      if (img.complete) return;
      img.addEventListener("load", scheduleRefresh, { once: true });
      img.addEventListener("error", scheduleRefresh, { once: true });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRefresh);
    window.addEventListener("mesc:refresh", scheduleRefresh);
  }

  /* ------------------------------------------------ header + navigation */
  var head = document.querySelector(".masthead");
  function onScroll() {
    if (head) head.classList.toggle("is-stuck", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  document.querySelectorAll(".drawer-group > button").forEach(function (b) {
    b.addEventListener("click", function () { b.parentElement.classList.toggle("open"); });
  });
  document.querySelectorAll(".drawer a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("menu-open");
      if (burger) burger.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.body.classList.remove("menu-open");
  });

  /* active page indicator (nav + dropdowns + drawer) */
  (function () {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.mainnav a, .dropdown a, .drawer a').forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === here) a.classList.add("is-active");
    });
  })();

  /* ------------------------------------------------ page transition wipe */
  var wipe = document.querySelector(".wipe");
  function playWipe(dir, done) {
    if (!wipe || !hasGSAP || reduced) { if (done) done(); return; }
    var cols = wipe.querySelectorAll("i");
    gsap.killTweensOf(cols);
    if (dir === "out") {
      gsap.set(cols, { transformOrigin: "50% 100%" });
      gsap.fromTo(cols, { scaleY: 0 }, {
        scaleY: 1, duration: .5, ease: "power3.inOut", stagger: .045,
        onComplete: done
      });
    } else {
      gsap.set(cols, { transformOrigin: "50% 0%", scaleY: 1 });
      gsap.to(cols, { scaleY: 0, duration: .6, ease: "power3.inOut", stagger: .045 });
    }
  }
  playWipe("in");
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !wipe || reduced) return;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || a.target === "_blank" ||
      /^(mailto:|tel:|https?:\/\/)/i.test(href) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    playWipe("out", function () { window.location.href = href; });
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) playWipe("in"); });

  /* -------------------------------------------------------- smooth scroll */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined" && window.innerWidth > 820) {
    /* Tuned snappier: higher lerp = scroll catches up to input faster,
       shorter duration = less glide/overshoot. This pairs with the
       lighter scrub values below so the two smoothing layers don't
       stack into a laggy, heavy-feeling scroll. */
    lenis = new Lenis({ duration: 0.9, smoothWheel: true, lerp: 0.12 });
    window.lenis = lenis;
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -80 });
      else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* --------------------------------------------- split text into words/lines */
  function splitWords(el) {
    if (el.dataset.split === "done") return el.querySelectorAll(".word > span");
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      var holder = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { holder.appendChild(document.createTextNode(p)); return; }
        var w = document.createElement("span");
        w.className = "word";
        var inner = document.createElement("span");
        inner.textContent = p;
        w.appendChild(inner);
        holder.appendChild(w);
      });
      node.parentNode.replaceChild(holder, node);
    });
    el.dataset.split = "done";
    return el.querySelectorAll(".word > span");
  }

  /* ------------------------------------------------------ magnetic buttons */
  if (!reduced && hasGSAP && window.matchMedia("(hover:hover)").matches) {
    document.querySelectorAll(".btn, .wa-float").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          duration: .5, ease: "power3.out"
        });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.4)" });
      });
    });
    /* subtle card tilt */
    document.querySelectorAll(".card").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        gsap.to(c, {
          rotateY: ((e.clientX - r.left) / r.width - .5) * 4,
          rotateX: -(((e.clientY - r.top) / r.height) - .5) * 4,
          transformPerspective: 900, duration: .5, ease: "power2.out"
        });
      });
      c.addEventListener("mouseleave", function () {
        gsap.to(c, { rotateX: 0, rotateY: 0, duration: .8, ease: "power3.out" });
      });
    });
  }

  if (!hasGSAP || reduced) {
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      el.style.opacity = 1; el.style.transform = "none"; el.style.filter = "none";
    });
    document.querySelectorAll(".story-item, .story-visual figure").forEach(function (el, i) {
      if (i === 0) el.classList.add("is-on");
    });
    return;
  }

  /* ------------------------------------------------------------ hero intro */
  var hero = document.querySelector(".hero");
  if (hero) {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var media = hero.querySelector(".hero-media");
    var mimg = hero.querySelector(".hero-media img");
    if (media) {
      gsap.set(media, { clipPath: "inset(0 0 100% 0)" });
      tl.to(media, { clipPath: "inset(0 0 0% 0)", duration: 1.5 }, 0);
    }
    if (mimg) {
      gsap.set(mimg, { scale: 1.3 });
      tl.to(mimg, { scale: 1.06, duration: 2.4 }, 0);
      /* slow ambient drift + scroll parallax */
      gsap.to(mimg, {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }
    hero.querySelectorAll("[data-hero-text]").forEach(function (el, i) {
      var spans = splitWords(el);
      gsap.set(spans, { yPercent: 118, rotate: 2.5 });
      tl.to(spans, { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.035 }, 0.2 + i * 0.12);
    });
    var extras = hero.querySelectorAll("[data-hero-fade]");
    if (extras.length) {
      gsap.set(extras, { y: 30, opacity: 0, filter: "blur(8px)" });
      tl.to(extras, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.05, stagger: 0.1 }, 0.6);
    }
    var meta = hero.querySelector(".hero-meta");
    if (meta) {
      gsap.set(meta, { clipPath: "inset(0 100% 0 0)" });
      tl.to(meta, { clipPath: "inset(0 0% 0 0)", duration: 1.4 }, 0.9);
    }
    var marks = hero.querySelectorAll(".hero-marks span, .hero-marks .rule");
    if (marks.length) {
      gsap.set(marks, { opacity: 0 });
      tl.to(marks, { opacity: 1, duration: 1, stagger: .08 }, 1.1);
    }
    /* hero copy drifts up slower than scroll */
    var hi = hero.querySelector(".hero-inner");
    if (hi) gsap.to(hi, {
      yPercent: -14, opacity: .25, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* ------------------------------------------------- generic scroll reveals */
  var recipes = {
    fade: { from: { y: 40, opacity: 0 }, to: { y: 0, opacity: 1 } },
    up: { from: { y: 70, opacity: 0 }, to: { y: 0, opacity: 1 } },
    left: { from: { x: -70, opacity: 0 }, to: { x: 0, opacity: 1 } },
    right: { from: { x: 70, opacity: 0 }, to: { x: 0, opacity: 1 } },
    scale: { from: { scale: 0.92, opacity: 0 }, to: { scale: 1, opacity: 1 } },
    blur: { from: { opacity: 0, filter: "blur(16px)", y: 24 }, to: { opacity: 1, filter: "blur(0px)", y: 0 } },
    clip: { from: { clipPath: "inset(0 0 100% 0)", opacity: 1 }, to: { clipPath: "inset(0 0 0% 0)" } },
    mask: { from: { clipPath: "inset(0 100% 0 0)" }, to: { clipPath: "inset(0 0% 0 0)" } }
  };

  document.querySelectorAll("[data-anim]").forEach(function (el) {
    var kind = el.dataset.anim || "up";
    if (kind === "text") {
      var spans = splitWords(el);
      gsap.set(spans, { yPercent: 115 });
      gsap.to(spans, {
        yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.028,
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
      return;
    }
    var r = recipes[kind] || recipes.up;
    gsap.set(el, r.from);
    gsap.to(el, Object.assign({}, r.to, {
      duration: parseFloat(el.dataset.dur || 1.05),
      delay: parseFloat(el.dataset.delay || 0),
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: el.dataset.start || "top 88%" }
    }));
  });

  /* staggered groups */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var kids = group.children;
    gsap.set(kids, { y: 56, opacity: 0 });
    gsap.to(kids, {
      y: 0, opacity: 1, duration: 1.05, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 85%" }
    });
  });

  /* ------------------------------------------------- journey grid & map ---
     City coordinates below are calibrated directly against the real
     South_India.svg artwork (viewBox "0 0 566.25 573.749983"), not an
     arbitrary/assumed coordinate space. They were derived by rendering
     the SVG, isolating the filled state shapes, and mapping each city's
     true latitude/longitude onto that pixel space via the shape's own
     north/south/east/west extremes — so the dots land on the correct
     state and in the correct relative position to one another. */
  var journey = document.querySelector(".journey");
  if (journey && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var container = document.getElementById("svg-map-container");
    if (container) {
      fetch('assets/South_India.svg')
        .then(function (response) { return response.text(); })
        .then(function (svgData) {
          container.innerHTML = svgData;
          var svgEl = container.querySelector("svg");
          if (svgEl) {
            svgEl.classList.add("india-map");

            // Tight crop around the drawn artwork (the source canvas has
            // empty margin above/below/right of the actual map shape).
            svgEl.setAttribute("viewBox", "70 60 410 420");
            svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

            // City coordinates in the SVG's own 566.25 x 573.75 space,
            // calibrated against the true shape of the artwork.
            var cities = {
              "Chennai": { x: 295.9, y: 297.8 },
              "Vellore": { x: 258.1, y: 303.4 },
              "Bengaluru": { x: 207.2, y: 301.6 },
              "North Karnataka": { x: 133.6, y: 178.9 },
              "Kerala": { x: 162.8, y: 399.8 }
            };

            // Per-city label offsets, tuned so labels for the closely
            // clustered Chennai / Vellore / Bengaluru trio don't overlap.
            var labelPos = {
              "Chennai": { dx: 16, dy: 4, anchor: "start" },
              "Vellore": { dx: 0, dy: -16, anchor: "middle" },
              "Bengaluru": { dx: -16, dy: 4, anchor: "end" },
              "North Karnataka": { dx: 16, dy: 4, anchor: "start" },
              "Kerala": { dx: 16, dy: 4, anchor: "start" }
            };

            // Build smooth route path through cities in journey order
            var order = ["Chennai", "Vellore", "Bengaluru", "North Karnataka", "Kerala"];
            var pts = order.map(function (c) { return cities[c]; });
            var pathD = "M " + pts[0].x + "," + pts[0].y;
            for (var i = 1; i < pts.length; i++) {
              var p0 = pts[i - 1], p1 = pts[i];
              // Offset control points slightly to create a natural curve
              var dx = (p1.x - p0.x) * 0.4;
              var dy = (p1.y - p0.y) * 0.4;
              pathD += " C " + (p0.x + dx) + "," + p0.y + " " + (p1.x - dx) + "," + p1.y + " " + p1.x + "," + p1.y;
            }

            // Build the overlay SVG elements
            var overlay = '';
            overlay += '<path id="route-path" class="map-route" d="' + pathD + '" fill="none" stroke="var(--blue-500)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

            order.forEach(function (city) {
              var c = cities[city];
              var lp = labelPos[city] || { dx: 16, dy: 4, anchor: "start" };
              var tx = c.x + lp.dx;
              var ty = c.y + lp.dy;
              overlay += '<g class="city-marker" data-city="' + city + '">';
              overlay += '  <circle cx="' + c.x + '" cy="' + c.y + '" r="7"  class="marker-ring"/>';
              overlay += '  <circle cx="' + c.x + '" cy="' + c.y + '" r="3.5"  class="marker-dot"/>';
              overlay += '  <text x="' + tx + '" y="' + ty + '" class="marker-label" text-anchor="' + lp.anchor + '">' + city + '</text>';
              overlay += '</g>';
            });

            overlay += '<circle id="traveler" class="traveler-dot" cx="' + cities["Chennai"].x + '" cy="' + cities["Chennai"].y + '" r="5"/>';

            svgEl.insertAdjacentHTML('beforeend', overlay);
            initMapJourney(cities);
          }
        });
    }

    function initMapJourney(cities) {
      var routePath = document.getElementById("route-path");
      var traveler = document.getElementById("traveler");
      var markers = document.querySelectorAll(".city-marker");

      // Scrub-driven route animation
      if (routePath && traveler) {
        var routeLength = routePath.getTotalLength();
        gsap.set(routePath, { strokeDasharray: routeLength, strokeDashoffset: routeLength });

        // Reset route to fully hidden at start
        gsap.set(routePath, { strokeDashoffset: routeLength });
        var firstCity = cities ? cities["Chennai"] : null;
        if (firstCity) gsap.set(traveler, { attr: { cx: firstCity.x, cy: firstCity.y } });

        ScrollTrigger.create({
          trigger: ".journey-grid",
          // Start ONLY when the section first enters the bottom of the viewport
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          onUpdate: function (self) {
            var p = self.progress;
            gsap.set(routePath, { strokeDashoffset: routeLength * (1 - p) });
            var pt = routePath.getPointAtLength(routeLength * p);
            gsap.set(traveler, { attr: { cx: pt.x, cy: pt.y } });
          }
        });
      }

      function updateActiveMarker(cityName) {
        markers.forEach(function (m) {
          m.classList.toggle("is-active", m.dataset.city === cityName);
        });
      }

      updateActiveMarker("Chennai");

      document.querySelectorAll(".city-group").forEach(function (group) {
        ScrollTrigger.create({
          trigger: group,
          start: "top 60%",
          end: "bottom 60%",
          onEnter: function () { updateActiveMarker(group.dataset.city); },
          onEnterBack: function () { updateActiveMarker(group.dataset.city); }
        });

        var cards = group.querySelectorAll(".project-card");
        cards.forEach(function (card) {
          var img = card.querySelector(".card-media img");
          var badge = card.querySelector(".badge");
          var loc = card.querySelector(".card-loc");
          var title = card.querySelector(".card-title");

          gsap.set(card, { opacity: 1, y: 0 });
          if (img) gsap.set(img, { clipPath: "inset(0 100% 0 0)" });
          if (badge) gsap.set(badge, { opacity: 0, y: 20 });
          if (loc) gsap.set(loc, { opacity: 0, y: 20 });
          if (title) gsap.set(title, { opacity: 0, y: 20 });

          var tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 85%" } });
          if (img) tl.to(img, { clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power2.inOut" }, 0);
          if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.2);
          if (loc) tl.to(loc, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.25);
          if (title) tl.to(title, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.35);
        });
      });
    }
  }

  /* section eyebrow rule draw-in */
  document.querySelectorAll(".eyebrow").forEach(function (e) {
    gsap.fromTo(e, { opacity: 0, x: -14 }, {
      opacity: 1, x: 0, duration: .9, ease: "expo.out",
      scrollTrigger: { trigger: e, start: "top 92%" }
    });
  });

  /* multi-layer parallax */
  document.querySelectorAll("[data-parallax] img, img[data-parallax]").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -8, scale: 1.14 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: img.closest("[data-parallax]") || img, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  document.querySelectorAll(".grid-lines").forEach(function (g) {
    gsap.fromTo(g, { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: g.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* image mask reveals: coloured panel wipes away, image scales in */
  document.querySelectorAll("[data-reveal-img]").forEach(function (box) {
    gsap.fromTo(box, { clipPath: "inset(0 100% 0 0)" }, {
      clipPath: "inset(0 0% 0 0)", duration: 1.35, ease: "expo.out",
      scrollTrigger: { trigger: box, start: "top 86%" }
    });
    var im = box.querySelector("img");
    if (im) gsap.fromTo(im, { scale: 1.2, filter: "grayscale(1)" }, {
      scale: 1.08, filter: "grayscale(0)", duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: box, start: "top 86%" }
    });
  });

  /* counters */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
      onUpdate: function () {
        el.textContent = (target % 1 ? obj.v.toFixed(1) : Math.round(obj.v)) + suffix;
      }
    });
  });

  /* ---------------------------------------------------- horizontal rails */
  document.querySelectorAll("[data-rail]").forEach(function (wrap) {
    var rail = wrap.querySelector(".rail");
    var bar = wrap.querySelector(".rail-bar i");
    if (!rail) return;
    if (window.innerWidth < 900) {   /* touch: native swipe, no pinning */
      if (bar) {
        rail.addEventListener("scroll", function () {
          var p = rail.scrollLeft / (rail.scrollWidth - rail.clientWidth || 1);
          bar.style.transform = "scaleX(" + (0.05 + p * 0.95) + ")";
        }, { passive: true });
      }
      return;
    }
    var dist = function () { return rail.scrollWidth - window.innerWidth + 40; };
    gsap.to(rail, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: {
        trigger: wrap, start: "center center", end: function () { return "+=" + dist(); },
        pin: true, scrub: 0.3, invalidateOnRefresh: true,
        onUpdate: function (self) { if (bar) gsap.set(bar, { scaleX: 0.05 + self.progress * 0.95 }); }
      }
    });
    /* per-card entry as it enters the viewport horizontally */
    rail.querySelectorAll(".card").forEach(function (c, i) {
      gsap.fromTo(c, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: .8, ease: "expo.out", delay: i * .04,
        scrollTrigger: { trigger: wrap, start: "top 80%" }
      });
    });
  });

  /* ---------------------------------------------- pinned scrub sequence */
  document.querySelectorAll("[data-pinned-seq]").forEach(function (section) {
    var texts = section.querySelectorAll(".seq-text");
    var figs = section.querySelectorAll(".seq-visual figure");
    if (!texts.length || reduced || !hasGSAP) return;

    texts.forEach(function (txt, i) {
      if (i === 0) {
        gsap.set(txt, { opacity: 1, y: 0, scale: 1, zIndex: 2, pointerEvents: "auto" });
      } else {
        gsap.set(txt, { opacity: 0, y: 80, scale: 0.95, zIndex: 1, pointerEvents: "none" });
      }
    });

    figs.forEach(function (fig, i) {
      if (i === 0) {
        gsap.set(fig, { opacity: 1, scale: 1 });
      } else {
        gsap.set(fig, { opacity: 0, scale: 1.05 });
      }
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top -60px",
        /* Shorter runway per slide (was 75%) — less physical scrolling
           effort needed to move between panels. */
        end: function () { return "+=" + (texts.length * 60) + "%"; },
        pin: true,
        /* Lenis already smooths raw input, so the scrub tween itself
           should track that smoothed value closely rather than adding
           its own second of catch-up lag (was scrub: 1). This is the
           main fix for the "heavy / fighting the page" feeling. */
        scrub: 0.3,
        snap: {
          snapTo: 1 / (texts.length - 1),
          duration: { min: 0.15, max: 0.4 },
          directional: true,
          ease: "power1.out"
        },
        invalidateOnRefresh: true
      }
    });

    window.addEventListener("keydown", function (e) {
      if (!tl.scrollTrigger || !tl.scrollTrigger.isActive) return;
      var activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var dir = e.key === "ArrowDown" ? 1 : -1;
        var st = tl.scrollTrigger;
        var step = (st.end - st.start) / (texts.length - 1);

        // Find nearest step index based on progress
        var currentStep = Math.round(st.progress * (texts.length - 1));
        var nextStep = Math.max(0, Math.min(texts.length - 1, currentStep + dir));
        var nextScroll = st.start + nextStep * step;

        if (window.lenis) {
          window.lenis.scrollTo(nextScroll, { duration: 0.8 });
        } else {
          window.scrollTo({ top: nextScroll, behavior: "smooth" });
        }
      }
    });

    tl.to(section, { duration: texts.length - 1 }, 0); // pad timeline

    texts.forEach(function (txt, i) {
      if (i === 0) return;
      var start = i - 0.6;
      var dur = 0.6;

      tl.to(texts[i - 1], { opacity: 0, y: -80, scale: 0.95, zIndex: 1, pointerEvents: "none", duration: dur, ease: "power1.inOut" }, start);
      tl.to(figs[i - 1], { opacity: 0, scale: 1.05, duration: dur, ease: "power1.inOut" }, start);

      tl.to(txt, { opacity: 1, y: 0, scale: 1, zIndex: 2, pointerEvents: "auto", duration: dur, ease: "power1.inOut" }, start);
      tl.to(figs[i], { opacity: 1, scale: 1, duration: dur, ease: "power1.inOut" }, start);
    });
  });

  /* ---------------------------------------------- sticky storytelling */
  document.querySelectorAll("[data-story]").forEach(function (story) {
    var items = story.querySelectorAll(".story-item");
    var figs = story.querySelectorAll(".story-visual figure");
    if (!items.length) return;
    function activate(i) {
      items.forEach(function (it, n) { it.classList.toggle("is-on", n === i); });
      figs.forEach(function (f, n) { f.classList.toggle("is-on", n === i); });
    }
    activate(0);
    items.forEach(function (it, i) {
      ScrollTrigger.create({
        trigger: it, start: "top 62%", end: "bottom 45%",
        onEnter: function () { activate(i); },
        onEnterBack: function () { activate(i); }
      });
      it.addEventListener("mouseenter", function () { activate(i); });
    });
  });

  /* ------------------------------------------------- stacked image deck */
  document.querySelectorAll("[data-stack]").forEach(function (stack) {
    var cards = stack.querySelectorAll(".stack-card");
    cards.forEach(function (c, i) {
      gsap.fromTo(c, { yPercent: 12 * (i + 1), scale: .92, opacity: i ? .4 : 1 }, {
        yPercent: 0, scale: 1, opacity: 1, ease: "none",
        scrollTrigger: { trigger: stack, start: "top 85%", end: "bottom 55%", scrub: .6 }
      });
    });
  });

  /* --------------------------------------------------------- marquees */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    var speed = parseFloat(track.dataset.marquee) || 40;
    var w = track.scrollWidth / 2;
    if (!w) return;
    gsap.to(track, {
      x: -w, duration: speed, ease: "none", repeat: -1,
      modifiers: { x: gsap.utils.unitize(function (x) { return parseFloat(x) % w; }) }
    });
  });

  /* --------------------------------------- quote band + section transitions */
  document.querySelectorAll(".quote-band blockquote").forEach(function (q) {
    gsap.fromTo(q, { y: 50 }, {
      y: -50, ease: "none",
      scrollTrigger: { trigger: q.closest(".quote-band"), start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  document.querySelectorAll(".quote-band").forEach(function (b) {
    gsap.fromTo(b, { clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 0 0)" });
    var rule = b;
    gsap.fromTo(rule, { "--sweep": 0 }, { "--sweep": 1 });
    gsap.fromTo(b.querySelector("blockquote"), { opacity: .2 }, {
      opacity: 1, duration: 1, ease: "power2.out",
      scrollTrigger: { trigger: b, start: "top 80%" }
    });
  });

  /* ------------------------------------------------------- magnetic buttons */
  var canHover = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (canHover && !reduced) {
    document.querySelectorAll(".btn, .nav-cta").forEach(function (btn) {
      var strength = 0.35;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
        var arw = btn.querySelector(".arw");
        if (arw) arw.style.transform = "translate(" + x * 0.6 + "px," + y * 0.6 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
        var arw = btn.querySelector(".arw");
        if (arw) arw.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------- footer entrance */
  (function () {
    var foot = document.querySelector(".site-foot");
    if (!foot) return;
    var groups = foot.querySelectorAll(".foot-grid > *");
    if (!groups.length) return;
    if (reduced) return;
    if (hasGSAP && window.ScrollTrigger) {
      gsap.fromTo(groups, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: .8, ease: "power2.out", stagger: .08,
        scrollTrigger: { trigger: foot, start: "top 92%" }
      });
    }
  })();

  ScrollTrigger.refresh();
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();

/* -------- contact form (front-end only, no backend) -------- */
(function () {
  var form = document.getElementById("mesc-contact-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = (data.get("name") || "").toString().trim();
    var email = (data.get("email") || "").toString().trim();
    var msg = (data.get("message") || "").toString().trim();
    var status = document.getElementById("form-status");
    if (!name || !email || !msg) {
      status.textContent = "Please complete name, email and message.";
      return;
    }
    var body = encodeURIComponent(msg + "\n\n— " + name + " (" + email + ")");
    status.textContent = "Opening your mail client…";
    window.location.href =
      "mailto:info@mesc.in?subject=" + encodeURIComponent("Website enquiry from " + name) + "&body=" + body;
  });
})();