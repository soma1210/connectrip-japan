/*
 * OUR VALUE · Cinematic Scroll Prototype V1.0
 *
 * Wide screens (≥768 px, motion allowed): the stage is pinned with CSS `position: sticky`
 * and the scroll position inside the section drives a continuous deck position `p`
 * (0 = card 01 in front … 5 = card 06 in front). Each frame places every card from its
 * distance to the front (d = i - p):
 *   d < 0   leaving: lifts up out of the frame with a slight clockwise tilt
 *   0..1    next in line: waits just below and behind, rises and grows into place
 *   1..2    further back: a thin edge of the stack, fading out
 * Phones and reduced motion: a plain list, each card rising once as it scrolls in.
 * No library; transform / opacity only.
 */
(function () {
  "use strict";

  var section = document.querySelector("[data-ov]");
  if (!section) return;

  var track = section.querySelector("[data-ov-track]");
  var stage = section.querySelector("[data-ov-stage]");
  var cards = Array.prototype.slice.call(section.querySelectorAll("[data-ov-card]"));
  var shades = cards.map(function (c) {
    return c.querySelector("[data-ov-shade]");
  });
  var reel = section.querySelector("[data-ov-reel]");
  var bar = section.querySelector("[data-ov-bar]");

  var N = cards.length;
  var STEPS = N - 1;
  var START_HOLD = 0.3; // card 01 rests a moment after the pin starts
  var END_HOLD = 0.9; // card 06 stays readable before the pin releases
  var UNITS = START_HOLD + STEPS + END_HOLD;
  var DWELL = 0.12; // share of each step (each end) where the card rests in place
  var SMOOTH = 0.085; // seconds; scrub smoothing (like a short GSAP scrub)

  section.style.setProperty("--units", String(UNITS));
  section.setAttribute("data-armed", "");

  var pinnedQuery = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
  var pinned = false;
  var target = 0;
  var current = 0;
  var rafId = 0;
  var lastTime = 0;
  var trackTop = 0;
  var range = 1;
  var cardH = 0;
  var exitDist = 0;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function easeInOut(t) {
    return 0.5 - 0.5 * Math.cos(Math.PI * t);
  }

  /* ---------- Entrance (both modes) ---------- */
  var introObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        section.classList.add("is-in");
        introObserver.disconnect();
        // After the deck entrance, drop the card transition so scrolling never lags behind it.
        window.setTimeout(function () {
          section.classList.add("is-settled");
        }, 1700);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -30% 0px" }
  );
  introObserver.observe(section);

  // List mode: each card rises once when it scrolls in.
  var cardObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        cardObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  /* ---------- Pinned deck ---------- */
  function measure() {
    var rect = track.getBoundingClientRect();
    trackTop = rect.top + window.scrollY;
    range = Math.max(1, track.offsetHeight - stage.offsetHeight);
    cardH = cards[0].offsetHeight; // layout size; transforms do not change it
    // Far enough that a leaving card (with its tilt) has fully cleared the top of the stage.
    exitDist = stage.offsetHeight / 2 + cardH * 0.62 + 40;
  }

  function readTarget() {
    var u = clamp((window.scrollY - trackTop) / range, 0, 1) * UNITS - START_HOLD;
    if (u <= 0) return 0;
    if (u >= STEPS) return STEPS;
    var k = Math.floor(u);
    var f = clamp((u - k - DWELL) / (1 - DWELL * 2), 0, 1);
    return k + easeInOut(f);
  }

  function render(p) {
    var peek = cardH * 0.075;
    for (var i = 0; i < N; i++) {
      var d = i - p;
      var y = 0;
      var s = 1;
      var r = 0;
      var shade = 0;
      var visible = true;
      if (d < 0) {
        // Leaving: up and out, a little tilt as it goes.
        var t = Math.min(-d, 1);
        y = -t * exitDist;
        r = t * 4.5;
        visible = -d < 1;
      } else if (d <= 1) {
        // Next in line: rises from just below and behind.
        y = d * peek;
        s = 1 - d * 0.06;
        shade = d * 0.45;
      } else {
        // Further back: only an edge of the stack shows, then nothing.
        var b = Math.min(d - 1, 1);
        y = peek + b * peek * 0.75;
        s = 0.94 - b * 0.045;
        shade = 0.45 + b * 0.3;
        visible = d < 2.6;
      }
      var el = cards[i];
      el.style.transform =
        "translate3d(0," + y.toFixed(2) + "px,0) rotate(" + r.toFixed(3) + "deg) scale(" + s.toFixed(4) + ")";
      el.style.visibility = visible ? "" : "hidden";
      shades[i].style.opacity = shade.toFixed(3);
    }
    if (reel) reel.style.transform = "translate3d(0," + (-(p / N) * 100).toFixed(3) + "%,0)";
    if (bar) bar.style.transform = "scaleX(" + ((p + 1) / N).toFixed(4) + ")";
    section.setAttribute("data-active", String(Math.round(p) + 1));
  }

  function tick(now) {
    var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = now;
    var diff = target - current;
    if (Math.abs(diff) < 0.0005) {
      current = target;
      render(current);
      rafId = 0;
      lastTime = 0;
      return;
    }
    current += diff * (1 - Math.exp(-dt / SMOOTH));
    render(current);
    rafId = window.requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!pinned) return;
    target = readTarget();
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  }

  function onResize() {
    if (!pinned) return;
    measure();
    target = readTarget();
    current = target;
    render(current);
  }

  function setMode() {
    pinned = pinnedQuery.matches;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    lastTime = 0;
    if (pinned) {
      cardObserver.disconnect();
      cards.forEach(function (c, i) {
        c.style.zIndex = String(N - i); // card 01 in front, the rest stacked behind in order
        c.classList.add("is-in");
        var img = c.querySelector("img");
        if (img) img.loading = "eager"; // the whole stack is on screen; avoid a late decode mid-scroll
      });
      measure();
      target = readTarget();
      current = target; // start where the page is (reload / back), no catch-up animation
      render(current);
    } else {
      cards.forEach(function (c, i) {
        c.style.transform = "";
        c.style.visibility = "";
        c.style.zIndex = "";
        shades[i].style.opacity = "";
        if (!c.classList.contains("is-in")) cardObserver.observe(c);
      });
      section.removeAttribute("data-active");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  if (pinnedQuery.addEventListener) pinnedQuery.addEventListener("change", setMode);
  // Fonts change the stage height on load; re-measure once they are in.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  window.addEventListener("load", onResize);

  setMode();
})();
