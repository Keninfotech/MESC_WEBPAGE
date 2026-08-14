/* =========================================================================
   MESC — Step scrollytelling engine (v3)
   Finds every numbered / sequential content block on the page and upgrades
   it into a scroll-driven story: pinned image stage, layered clip-path
   image transitions, shape morphing, parallax, rolling step counter and a
   progress rail. Purely additive — every paragraph, image and heading of
   the original markup is moved (not copied, not trimmed) into the new
   presentation, and the original layout is restored when the module cannot
   run (no JS, no GSAP, reduced motion).
   ========================================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (!hasGSAP || reduced) return;
  gsap.registerPlugin(ScrollTrigger);

  var MOBILE = "(max-width: 960px)";
  var mq = window.matchMedia(MOBILE);

  /* ------------------------------------------------------------- helpers */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function textLen(node) { return (node.textContent || "").replace(/\s+/g, " ").trim().length; }

  /* ancestors with overflow:hidden break position:sticky — neutralise them */
  function unclip(node) {
    if (node.closest(".shell")) node.classList.add("steps--nested");
    var n = node.parentNode;
    while (n && n !== document.body && n.nodeType === 1) {
      var cs = getComputedStyle(n);
      if (cs.overflow !== "visible" || cs.overflowY !== "visible") n.classList.add("has-steps");
      n = n.parentNode;
    }
  }

  /* Force a consistent seed so all pages use the same animation and layout */
  var seed = 41;

  var SHAPES = [
    "inset(0 0 0 0 round 2px)",
    "inset(0 0 0 0 round 26px)",
    "polygon(0 4%, 100% 0, 100% 96%, 0 100%)",
    "inset(0 0 0 0 round 50% 50% 8% 8%)",
    "polygon(6% 0, 100% 0, 94% 100%, 0 100%)"
  ];
  var VARIANTS = ["wipe", "iris", "slide", "morph", "layer"];

  /* --------------------------------------------------- collect candidates */
  var blocks = [];

  document.querySelectorAll(".frows").forEach(function (wrap) {
    var rows = wrap.querySelectorAll(":scope > .frow");
    if (rows.length < 2) return;
    var steps = [];
    rows.forEach(function (row) {
      var copy = row.querySelector(".frow-copy");
      var img = row.querySelector(".frow-media img");
      if (!copy) return;
      steps.push({
        img: img,
        num: copy.querySelector(".frow-num"),
        title: copy.querySelector("h2,h3,h4,.h3,.h4"),
        copy: copy
      });
    });
    if (steps.length >= 2) blocks.push({ host: wrap, steps: steps });
  });

  document.querySelectorAll(".cards").forEach(function (wrap) {
    var cards = wrap.querySelectorAll(":scope > .card");
    if (cards.length < 2) return;
    if (wrap.querySelector("a")) return;                 // link grids stay grids
    var ok = true, steps = [];
    cards.forEach(function (card) {
      var idx = card.querySelector(".card-idx");
      var body = card.querySelector(".card-body");
      if (!idx || !body || textLen(body) < 180) { ok = false; return; }
      steps.push({
        img: card.querySelector(".card-media img"),
        num: idx,
        title: body.querySelector("h2,h3,h4,.h3,.h4"),
        copy: body
      });
    });
    if (ok && steps.length >= 2) blocks.push({ host: wrap, steps: steps });
  });

  if (!blocks.length) return;

  /* ------------------------------------------------------------- builders */
  function buildVertical(block, order) {
    var steps = block.steps;
    var variant = VARIANTS[(order + seed) % VARIANTS.length];
    var shapeA = SHAPES[(order + seed) % SHAPES.length];
    var shapeB = SHAPES[(order + seed + 2) % SHAPES.length];
    var flip = (order + seed) % 2 === 1;

    var sec = el("div", "steps steps--" + variant + (flip ? " steps--right" : ""));
    var shell = el("div", "steps-shell");
    sec.appendChild(shell);

    var head = el("div", "steps-head");
    head.appendChild(el("div", "steps-kicker", "<i></i><span>Sequence</span>"));
    head.appendChild(el("div", "steps-count", "01 — " + pad(steps.length)));
    shell.appendChild(head);

    var grid = el("div", "steps-grid");
    shell.appendChild(grid);

    /* stage */
    var stage = el("div", "steps-stage");
    var frame = el("div", "steps-frame");
    frame.style.clipPath = shapeA;
    var layers = [];
    steps.forEach(function (st, i) {
      var layer = el("div", "steps-layer" + (i === 0 ? " is-active" : ""));
      if (st.img) layer.appendChild(st.img);
      frame.appendChild(layer);
      layers.push(layer);
    });
    var wipe = el("div", "steps-wipe", "<i></i><i></i><i></i><i></i><i></i>");
    frame.appendChild(wipe);
    frame.appendChild(el("div", "steps-marks",
      '<span class="m-rule h"></span><span class="m-rule v"></span>' +
      '<span class="m-corner tl"></span><span class="m-corner br"></span>' +
      '<span class="m-tick"><b>MESC</b> / STEP <b class="m-n">01</b> / 12.84&deg;N 77.67&deg;E</span>'));
    stage.appendChild(frame);

    var meta = el("div", "steps-meta");
    var roller = el("div", "steps-roller");
    var rollA = el("span", null, "01");
    roller.appendChild(rollA);
    meta.appendChild(roller);
    var bar = el("div", "bar", "<i></i>");
    meta.appendChild(bar);
    meta.appendChild(el("div", "of", "OF " + pad(steps.length)));
    stage.appendChild(meta);
    grid.appendChild(stage);

    /* track */
    var track = el("div", "steps-track");
    var stepEls = [];
    steps.forEach(function (st, i) {
      var art = el("article", "step");
      art.appendChild(el("div", "step-rail", "<i></i><b></b>"));
      if (st.img) {
        var inline = el("div", "step-inline");
        var m = st.img.cloneNode(true);
        m.setAttribute("aria-hidden", "true");
        inline.appendChild(m);
        art.appendChild(inline);
      }
      var num = el("span", "step-num", (st.num ? st.num.textContent.trim() : pad(i + 1)) + " / " + pad(steps.length));
      if (st.num && st.num.parentNode) st.num.parentNode.removeChild(st.num);
      art.appendChild(num);
      if (st.title) {
        var t = el("h3", "step-title", st.title.innerHTML);
        st.title.parentNode.removeChild(st.title);
        art.appendChild(t);
      }
      /* move every remaining node of the original copy — content stays whole */
      while (st.copy.firstChild) art.appendChild(st.copy.firstChild);
      track.appendChild(art);
      stepEls.push(art);
    });
    grid.appendChild(track);

    block.host.parentNode.replaceChild(sec, block.host);
    unclip(sec);

    /* ---------------------------------------------------------- motion */
    var current = 0, busy = false, queued = -1;
    layers.forEach(function (l, i) { gsap.set(l, { autoAlpha: i === 0 ? 1 : 0 }); });
    gsap.set(layers[0].querySelector("img"), { scale: 1, filter: "grayscale(0)" });
    stepEls[0].classList.add("is-active");
    var tickN = frame.querySelector(".m-n");

    function transition(to) {
      if (to === current) { queued = -1; return; }
      if (busy) { queued = to; return; }
      var from = current; current = to; busy = true;
      var inL = layers[to], outL = layers[from];
      var inImg = inL.querySelector("img"), outImg = outL.querySelector("img");
      var dir = to > from ? 1 : -1;
      var tl = gsap.timeline({ onComplete: function () { 
        busy = false; 
        if (queued !== -1) { 
          var q = queued; queued = -1; 
          transition(q); 
        } 
      } });

      gsap.set(inL, { autoAlpha: 1, zIndex: 3 });
      gsap.set(outL, { zIndex: 2 });
      inL.classList.add("is-active");
      outL.classList.remove("is-active");

      if (variant === "wipe") {
        var cols = wipe.querySelectorAll("i");
        tl.set(cols, { transformOrigin: dir > 0 ? "50% 100%" : "50% 0%" })
          .set(inL, { clipPath: "inset(0 0 0 0)" })
          .to(cols, { scaleY: 1, duration: .34, ease: "power3.in", stagger: .045 })
          .fromTo(inImg, { scale: 1.14, filter: "grayscale(.6)" }, { scale: 1, filter: "grayscale(0)", duration: 1.1, ease: "power3.out" }, "-=.05")
          .set(cols, { transformOrigin: dir > 0 ? "50% 0%" : "50% 100%" })
          .to(cols, { scaleY: 0, duration: .42, ease: "power3.out", stagger: .045 }, "-=.95")
          .set(outL, { autoAlpha: 0 }, "-=.9");
      } else if (variant === "iris") {
        tl.fromTo(inL, { clipPath: "circle(0% at 50% 55%)" }, { clipPath: "circle(120% at 50% 55%)", duration: 1.05, ease: "power4.inOut" })
          .fromTo(inImg, { scale: 1.16, rotate: dir * .6, filter: "grayscale(.7)" }, { scale: 1, rotate: 0, filter: "grayscale(0)", duration: 1.25, ease: "power3.out" }, 0)
          .to(outImg, { scale: 1.08, duration: 1, ease: "power2.out" }, 0)
          .set(outL, { autoAlpha: 0 });
      } else if (variant === "slide") {
        tl.fromTo(inL, { clipPath: dir > 0 ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0% 0)", duration: .95, ease: "expo.inOut" })
          .fromTo(inImg, { yPercent: dir * 6, scale: 1.1, filter: "grayscale(.65)" }, { yPercent: 0, scale: 1, filter: "grayscale(0)", duration: 1.2, ease: "power3.out" }, 0)
          .to(outImg, { yPercent: -dir * 5, duration: 1, ease: "power2.inOut" }, 0)
          .set(outL, { autoAlpha: 0 });
      } else if (variant === "morph") {
        tl.to(frame, { clipPath: to % 2 ? shapeB : shapeA, duration: 1.1, ease: "power3.inOut" }, 0)
          .fromTo(inL, { clipPath: "inset(12% 12% 12% 12%)", scale: 1.04 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1, ease: "power4.inOut" }, 0)
          .fromTo(inImg, { scale: 1.12, filter: "grayscale(.6)" }, { scale: 1, filter: "grayscale(0)", duration: 1.3, ease: "power3.out" }, 0)
          .set(outL, { autoAlpha: 0 }, .55);
      } else { /* layer */
        tl.fromTo(inL, { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" },
          { clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)", duration: 1, ease: "power4.inOut" })
          .fromTo(inImg, { scale: 1.15, yPercent: 4, filter: "grayscale(.7)" }, { scale: 1, yPercent: 0, filter: "grayscale(0)", duration: 1.3, ease: "power3.out" }, 0)
          .to(outL, { scale: .96, rotate: -.5, autoAlpha: 0, duration: .9, ease: "power2.inOut" }, 0)
          .set(outL, { scale: 1, rotate: 0 });
      }

      /* rolling step number */
      var next = el("span", null, pad(to + 1));
      roller.appendChild(next);
      gsap.fromTo(next, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: "power3.out" });
      var prev = rollA;
      gsap.to(prev, {
        yPercent: -110, opacity: 0, duration: .5, ease: "power3.in",
        onComplete: function () { if (prev.parentNode) prev.parentNode.removeChild(prev); }
      });
      rollA = next;
      if (tickN) tickN.textContent = pad(to + 1);

      gsap.to(bar.querySelector("i"), { scaleX: (to + 1) / steps.length, duration: .7, ease: "power3.out" });
      stepEls.forEach(function (n, i) { n.classList.toggle("is-active", i === to); });

      /* blueprint marks re-draw on every change */
      gsap.fromTo(frame.querySelector(".m-rule.h"), { scaleX: 0 }, { scaleX: 1, duration: .9, ease: "power3.out" });
      gsap.fromTo(frame.querySelector(".m-rule.v"), { scaleY: 0 }, { scaleY: 1, duration: .9, ease: "power3.out", delay: .1 });
    }

    stepEls.forEach(function (n, i) {
      ScrollTrigger.create({
        trigger: n, start: "top 50%", end: "bottom 50%",
        onToggle: function (self) {
          if (self.isActive) transition(i);
        }
      });

      /* masked reveal for the step head + comfortable fade for the prose */
      var head2 = n.querySelectorAll(".step-num, .step-title");
      gsap.from(head2, {
        yPercent: 110, opacity: 0, duration: .9, ease: "power4.out", stagger: .08,
        scrollTrigger: { trigger: n, start: "top 82%" }
      });
      gsap.from(n.querySelectorAll(".prose > *"), {
        y: 18, opacity: 0, filter: "blur(6px)", duration: .8, ease: "power2.out", stagger: .06,
        scrollTrigger: { trigger: n, start: "top 80%" }
      });
      var inline = n.querySelector(".step-inline");
      if (inline) {
        gsap.fromTo(inline, { clipPath: "inset(0 0 100% 0)" }, {
          clipPath: "inset(0 0 0% 0)", duration: 1, ease: "power4.out",
          scrollTrigger: { trigger: inline, start: "top 88%" }
        });
        gsap.fromTo(inline.querySelector("img"), { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: inline, start: "top bottom", end: "bottom top", scrub: true }
        });
      }
    });

    /* parallax inside the anchored frame + scroll-linked section tint */
    layers.forEach(function (l) {
      gsap.fromTo(l.querySelector("img"), { yPercent: -7 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    gsap.fromTo(frame, { y: 26 }, {
      y: -26, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.fromTo(sec, { backgroundColor: "#ffffff" }, {
      backgroundColor: "#eaf1fb", ease: "none",
      scrollTrigger: { trigger: sec, start: "top center", end: "center center", scrub: true }
    });
    gsap.to(sec, {
      backgroundColor: "#ffffff", ease: "none",
      scrollTrigger: { trigger: sec, start: "center center", end: "bottom center", scrub: true }
    });
    gsap.from(head.children, {
      y: 22, opacity: 0, duration: .8, ease: "power3.out", stagger: .1,
      scrollTrigger: { trigger: sec, start: "top 78%" }
    });
  }

  /* horizontal narrative — only for long, short-copy sequences on desktop */
  function buildHorizontal(block, order) {
    var steps = block.steps;
    var sec = el("div", "steps steps--h");
    var shell = el("div", "steps-shell");
    sec.appendChild(shell);
    var head = el("div", "steps-head");
    head.appendChild(el("div", "steps-kicker", "<i></i><span>Sequence</span>"));
    head.appendChild(el("div", "steps-count", "01 — " + pad(steps.length)));
    shell.appendChild(head);

    var pin = el("div", "steps-pin");
    var rail = el("div", "steps-hrail");
    pin.appendChild(rail);
    shell.appendChild(pin);
    var hbar = el("div", "steps-hbar", "<i></i>");
    shell.appendChild(hbar);

    steps.forEach(function (st, i) {
      var p = el("article", "h-panel step");
      if (st.img) {
        var media = el("div", "h-media");
        media.appendChild(st.img);
        p.appendChild(media);
      }
      var copy = el("div", "h-copy");
      copy.appendChild(el("span", "step-num", (st.num ? st.num.textContent.trim() : pad(i + 1)) + " / " + pad(steps.length)));
      if (st.num && st.num.parentNode) st.num.parentNode.removeChild(st.num);
      if (st.title) {
        var t = el("h3", "step-title", st.title.innerHTML);
        st.title.parentNode.removeChild(st.title);
        copy.appendChild(t);
      }
      while (st.copy.firstChild) copy.appendChild(st.copy.firstChild);
      p.appendChild(copy);
      rail.appendChild(p);
    });

    block.host.parentNode.replaceChild(sec, block.host);
    unclip(sec);

    var panels = rail.querySelectorAll(".h-panel");
    function distance() { return Math.max(0, rail.scrollWidth - pin.offsetWidth); }
    var st = ScrollTrigger.create({
      trigger: pin, start: "center center", end: function () { return "+=" + (distance() + window.innerHeight * .6); },
      pin: true, scrub: .6, invalidateOnRefresh: true,
      onUpdate: function (self) {
        gsap.set(rail, { x: -distance() * self.progress });
        gsap.set(hbar.querySelector("i"), { scaleX: self.progress });
        var idx = Math.round(self.progress * (panels.length - 1));
        panels.forEach(function (p, i) { p.classList.toggle("is-active", i === idx); });
      }
    });
    panels.forEach(function (p, i) {
      var img = p.querySelector("img");
      if (!img) return;
      gsap.fromTo(img, { scale: 1.14, filter: "grayscale(.6)" }, {
        scale: 1, filter: "grayscale(0)", duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: pin, start: "top 70%" }, delay: i * .07
      });
      gsap.fromTo(p.querySelector(".h-media"), { clipPath: "inset(0 100% 0 0)" }, {
        clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: pin, start: "top 72%" }, delay: i * .07
      });
    });
    return st;
  }

  /* ----------------------------------------------------------- bootstrap */
  var order = 0;
  blocks.forEach(function (b) {
    var avg = 0;
    b.steps.forEach(function (s) { avg += textLen(s.copy); });
    avg = avg / b.steps.length;
    var horizontal = !mq.matches && b.steps.length >= 5 && avg < 620;
    if (horizontal) buildHorizontal(b, order); else buildVertical(b, order);
    order++;
  });

  ScrollTrigger.refresh();
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* keep layout honest across orientation / breakpoint changes */
  var last = mq.matches;
  window.addEventListener("resize", function () {
    if (mq.matches !== last) { last = mq.matches; ScrollTrigger.refresh(); }
  });
})();
