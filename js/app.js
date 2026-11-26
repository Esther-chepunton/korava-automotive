/* Korava × Mercedes-Benz — motion
   GSAP + ScrollTrigger, Lenis smooth scroll. Long, soft eases; nothing snaps. */
(() => {
  const SHOTS = [
    { src: "images/craft5.png", w: 447, h: 559, title: "The cabin", text: "AMG performance seats in black leather, lit by a single thread of red." },
    { src: "images/craft4-crop.png", w: 377, h: 484, title: "The helm", text: "Every control a thumb's width away. The road stays where your eyes are." },
    { src: "images/craft8.png", w: 666, h: 375, wide: true, title: "The face", text: "Vertical slats, one star. Recognisable from the far end of a street." },
    { src: "images/craft6.png", w: 408, h: 612, title: "The light", text: "Headlamps that look awake, even when the car is resting in the rain." },
    { src: "images/craft1-crop.png", w: 388, h: 460, title: "The exit", text: "Twin exhausts and taillights that sign off every journey." },
    { src: "images/craft2.png", w: 500, h: 500, title: "The stance", text: "Spokes cut fine enough to show the brakes behind them." },
    { src: "images/craft7.png", w: 375, h: 666, title: "The heart", text: "An engine bay finished as carefully as the cabin." },
    { src: "images/craft3-crop.png", w: 311, h: 242, wide: true, title: "The silhouette", text: "Seen once in the dark. Remembered for a long time." },
  ];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function renderDetails() {
    const stage = $("[data-shots]");
    const caps = $("[data-captions]");
    stage.innerHTML = SHOTS.map(
      (s, i) => `
        <figure class="shot${s.wide ? " shot--wide" : ""}" data-shot="${i}">
          <img src="${s.src}" alt="${s.title}: ${s.text}" width="${s.w}" height="${s.h}" loading="${i < 2 ? "eager" : "lazy"}" decoding="async" />
          <figcaption><h3>${s.title}</h3><p>${s.text}</p></figcaption>
        </figure>`
    ).join("");
    caps.innerHTML = SHOTS.map(
      (s, i) => `<div class="caption${i === 0 ? " is-active" : ""}" data-caption="${i}"><h3>${s.title}</h3><p>${s.text}</p></div>`
    ).join("");
  }

  function formatCount(el, v) {
    const dec = Number(el.dataset.decimals || 0);
    let txt = v.toFixed(dec);
    if (el.dataset.format === "thousands") txt = Math.round(v).toLocaleString("en-US");
    el.textContent = txt;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderDetails();
    if (!(window.gsap && window.ScrollTrigger)) {
      document.body.classList.remove("is-loading");
      $$("[data-count]").forEach((el) => formatCount(el, Number(el.dataset.count)));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    /* smooth scroll */
    let lenis = null;
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const el = $(a.getAttribute("href"));
        if (!el) return;
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY;
        lenis ? lenis.scrollTo(y, { duration: 1.8 }) : window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      })
    );

    /* nav tucks away while scrolling down */
    const nav = $("[data-nav]");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => nav.classList.toggle("is-tucked", self.direction === 1 && self.scroll() > 200),
    });

    ignition();

    const mm = gsap.matchMedia();
    mm.add({ wide: "(min-width: 900px)", narrow: "(max-width: 899px)" }, (ctx) => {
      if (ctx.conditions.wide) {
        heroScroll();
        perfScroll();
        detailsScroll();
      } else {
        flowReveals();
      }
      finale();
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  });

  /* ── 1 · Hero ─────────────────────────────────────────────────────────
     Load: the car rises out of the dark with its lights out.
     Scroll a little: the lamps wake.  Scroll on: the car moves aside for the specs.
     (Template preset "Scroll Reveal · Complex": pin + scrub ≈1.) */
  let ignite = null;

  function buildIgnition(q) {
    const on = [...q("[data-car-on]"), ...q("[data-car-on-ref]")];
    const lamps = q("[data-lamp]");
    const sheen = q("[data-sheen]");
    let sweep = null;
    return gsap
      .timeline({
        paused: true,
        defaults: { ease: "none" },
        onComplete: () => {
          sweep = gsap.fromTo(
            sheen,
            { backgroundPosition: "120% 0" },
            { backgroundPosition: "-20% 0", duration: 3.2, ease: "power2.inOut", repeat: -1, repeatDelay: 5 }
          );
        },
        onReverseComplete: () => sweep?.kill(),
      })
      .to(lamps, { opacity: 0.9, duration: 0.08 })
      .to(lamps, { opacity: 0.15, duration: 0.12 })
      .to(lamps, { opacity: 1, duration: 0.1 })
      .to(q(".lamp i"), { scaleX: 1, duration: 0.9, ease: "expo.out" }, "<")
      .to(on, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, "<")
      .to(lamps, { opacity: 0.75, duration: 1.4, ease: "power2.out" }, ">-0.2")
      .to(q("[data-tail]"), { opacity: 0.85, duration: 1.2, ease: "power2.inOut" }, "<")
      .to(q(".hero__line-rest"), { opacity: 0.35, duration: 0.8 }, "<")
      .to(q("[data-wake-line]"), { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, "<0.1")
      .fromTo(sheen, { backgroundPosition: "120% 0" }, { backgroundPosition: "-20% 0", duration: 2.4, ease: "power2.inOut" }, "<");
  }

  function ignition() {
    const hero = $("[data-hero]");
    const q = gsap.utils.selector(hero);
    document.body.classList.remove("is-loading");

    if (reduce) {
      gsap.set([...q("[data-car-on]"), ...q("[data-car-on-ref]")], { opacity: 1 });
      gsap.set(q("[data-lamp]"), { opacity: 0.7 });
      gsap.set(q("[data-tail]"), { opacity: 0.8 });
      gsap.set(q("[data-wake-line]"), { opacity: 1, y: 0 });
      return;
    }

    gsap.set(q(".lamp i"), { scaleX: 0 });
    ignite = buildIgnition(q);

    // arrival: lights out
    gsap.set(q(".car__body, .car__reflection"), { autoAlpha: 0, y: 30 });
    gsap.set(q("[data-title]"), { yPercent: 110 });
    gsap.set(q("[data-intro]"), { autoAlpha: 0, y: 14 });
    gsap
      .timeline({ delay: 0.3, defaults: { ease: "power3.out" } })
      .to(q(".car__body"), { autoAlpha: 1, y: 0, duration: 2.6, ease: "power2.out" })
      .to(q(".car__reflection"), { autoAlpha: 0.22, y: 0, duration: 2.6, ease: "power2.out" }, "<")
      .to(q("[data-title]"), { yPercent: 0, duration: 1.8, ease: "expo.out" }, "<0.6")
      .to(q("[data-intro]"), { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.15 }, "-=0.8");

    // a little depth under the cursor
    if (matchMedia("(pointer: fine)").matches) {
      const tilt = q("[data-car-tilt]")[0];
      const ry = gsap.quickTo(tilt, "rotationY", { duration: 1.4, ease: "power3" });
      const rx = gsap.quickTo(tilt, "rotationX", { duration: 1.4, ease: "power3" });
      hero.addEventListener("pointermove", (e) => {
        ry((e.clientX / innerWidth - 0.5) * 9);
        rx((e.clientY / innerHeight - 0.5) * -4);
      });
      hero.addEventListener("pointerleave", () => {
        ry(0);
        rx(0);
      });
    }
  }

  const IGNITE_AT = 0.06;

  function heroScroll() {
    const hero = $("[data-hero]");
    const q = gsap.utils.selector(hero);
    const car = q("[data-car]")[0];
    const specs = q("[data-specs]")[0];

    /* Where the car should end up: centred in the free space left of the spec sheet,
       scaled so it never reaches it. Measured, so it holds at any zoom or font size. */
    const pose = () => {
      const W = innerWidth;
      const gutter = Math.max(20, W * 0.045);
      const specsW = specs.offsetWidth || Math.min(W * 0.36, 32 * parseFloat(getComputedStyle(specs).fontSize));
      const specsLeft = W - gutter - specsW;
      const free = specsLeft - gutter * 2; // room for the car, with breathing space either side
      const carW = car.offsetWidth;
      const scale = Math.min(0.8, (free * 0.92) / carW);
      const targetCentre = gutter + free / 2;
      return { x: targetCentre - W / 2, scale };
    };

    /* Two scroll-driven amounts — lean (push-in) and slide (to the side) — turned into a
       transform every frame from live measurements, so the result never depends on when
       a value happened to be read. */
    const m = { lean: 0, slide: 0 };
    const place = () => {
      const p = pose();
      const lean = 1 + 0.04 * m.lean;
      gsap.set(car, { x: p.x * m.slide, scale: lean + (p.scale - lean) * m.slide });
    };

    if (reduce) {
      m.slide = 1;
      place();
      gsap.set(specs, { autoAlpha: 1 });
      window.addEventListener("resize", place);
      return;
    }
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onUpdate: place,
      scrollTrigger: {
        trigger: hero,
        pin: q("[data-hero-pin]")[0],
        start: "top top",
        end: "+=200%",
        scrub: 1,
        anticipatePin: 1,
        onRefresh: place,
      },
    });
    // the lamps are a moment, not a scrub: they play once past a short scroll and reverse on the way back
    if (ignite) {
      ScrollTrigger.create({
        trigger: hero,
        start: () => `top+=${Math.round(innerHeight * 2 * IGNITE_AT)} top`,
        onEnter: () => ignite.timeScale(1).play(),
        onLeaveBack: () => ignite.timeScale(1.6).reverse(),
      });
    }
    // 0 → .35  lights on, the camera leans in and holds
    tl.to(q(".hero__cue > *"), { autoAlpha: 0, duration: 0.08 }, 0)
      .to(m, { lean: 1, duration: 0.35, ease: "power1.inOut" }, 0)
      // .35 → .62  title lifts away; the car glides fully into the left half
      .to(q("[data-hero-type]"), { y: -60, autoAlpha: 0, duration: 0.2 }, 0.35)
      .fromTo(q(".hero__line"), { clipPath: "inset(-20% -10% -20% -10%)" }, { clipPath: "inset(-20% -10% 120% -10%)", duration: 0.15 }, 0.35)
      .to(m, { slide: 1, duration: 0.27 }, 0.35)
      // .64 → 1  only once the car has arrived does the spec sheet come in beside it
      .fromTo(specs, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.18, ease: "power3.out" }, 0.64)
      .from(q(".specs__list > div, .specs__engines li"), { autoAlpha: 0, y: 10, stagger: 0.012, duration: 0.12, ease: "power2.out" }, 0.68)
      .to({}, { duration: 0.14 });
    place();
  }

  /* ── 2 · Performance: one scrubbed timeline, so the car, the counters and the notes
     arrive together. No pin — it plays as the section scrolls up into place
     (template presets "Scroll Reveal · Complex" scrub + "Parallax Scroll"). */
  function perfScroll() {
    const sec = $("[data-perf]");
    const q = gsap.utils.selector(sec);
    const counts = q("[data-count]");
    if (reduce) {
      counts.forEach((el) => formatCount(el, Number(el.dataset.count)));
      return;
    }

    const DRIVE = 1; // everything below shares this span
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: sec, start: "top 90%", end: "top top", scrub: 1 },
    });

    // the car drives up into its bay, easing off the throttle as it arrives
    tl.fromTo(
      q("[data-perf-car]"),
      { y: "62vh", filter: "blur(3px)" },
      { y: 0, filter: "blur(0px)", duration: DRIVE, ease: "power2.out" },
      0
    );

    // road streaks rush past while it moves, then calm
    tl.fromTo(
      q("[data-streaks]"),
      { backgroundPosition: "30% 0px, 68% 0px, 81% 0px", opacity: 0.9 },
      { backgroundPosition: "30% 1800px, 68% 2700px, 81% 2200px", opacity: 0.35, duration: DRIVE, ease: "power2.out" },
      0
    );

    // the heading lands first
    tl.from(q("[data-perf-head]"), { autoAlpha: 0, y: 30, duration: 0.3, stagger: 0.06, ease: "power2.out" }, 0);

    // left: each figure appears and counts with the car's travel
    q("[data-stat]").forEach((stat, i) => {
      const el = stat.querySelector("[data-count]");
      const proxy = { v: 0 };
      // same start, same length, same ease as the car: half-way there means the same for both
      tl.from(stat, { autoAlpha: 0, x: -30, duration: 0.25, ease: "power2.out" }, i * 0.05).to(
        proxy,
        { v: Number(el.dataset.count), duration: DRIVE, ease: "power2.out", onUpdate: () => formatCount(el, proxy.v) },
        0
      );
    });

    // right: the notes arrive line by line on the same clock
    tl.from(q("[data-facts] li"), { autoAlpha: 0, x: 30, duration: 0.3, stagger: 0.1, ease: "power2.out" }, 0.05);

    // after arrival, a gentle parallax drift as the section leaves
    gsap.to(q("[data-perf-car]"), {
      yPercent: -5,
      ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: 0.6 },
    });
  }

  /* ── 3 · Details: one shot at a time, each wiping up over the last ─── */
  function detailsScroll() {
    const sec = $("[data-details]");
    const shots = $$("[data-shot]", sec);
    const imgs = shots.map((s) => s.querySelector("img"));
    const caps = $$("[data-caption]", sec);
    const meter = $("[data-details-meter]", sec);
    let current = 0;
    const setCaption = (i) => {
      if (i === current) return;
      current = i;
      caps.forEach((c, k) => c.classList.toggle("is-active", k === i));
    };

    const WIPE = 1;
    const HOLD = 0.9;
    gsap.set(shots.slice(1), reduce ? { autoAlpha: 0 } : { clipPath: "inset(100% 0% 0% 0%)" });
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    if (!reduce) tl.fromTo(imgs[0], { scale: 1.06 }, { scale: 1, duration: HOLD }, 0);
    else tl.to({}, { duration: HOLD });

    const mids = [];
    shots.forEach((shot, k) => {
      if (k === 0) return;
      const at = tl.duration();
      mids.push(at + WIPE / 2);
      if (reduce) {
        tl.to(shot, { autoAlpha: 1, duration: WIPE }, at).to(shots[k - 1], { autoAlpha: 0, duration: WIPE }, at);
      } else {
        tl.to(shot, { clipPath: "inset(0% 0% 0% 0%)", duration: WIPE, ease: "power2.inOut" }, at)
          .fromTo(imgs[k], { scale: 1.22 }, { scale: 1, duration: WIPE + HOLD, ease: "power2.out" }, at)
          .to(imgs[k - 1], { scale: 0.94, autoAlpha: 0, duration: WIPE * 0.9, ease: "power2.inOut" }, at + WIPE * 0.1);
      }
      tl.to({}, { duration: HOLD });
    });
    const total = tl.duration();
    const thresholds = mids.map((m) => m / total);

    ScrollTrigger.create({
      trigger: sec,
      pin: $("[data-details-pin]", sec),
      start: "top top",
      end: () => `+=${innerHeight * shots.length * 0.75}`,
      scrub: 1,
      animation: tl,
      anticipatePin: 1,
      onUpdate: (self) => {
        let i = 0;
        thresholds.forEach((t, k) => {
          if (self.progress >= t) i = k + 1;
        });
        setCaption(i);
        meter.style.transform = `scaleX(${self.progress})`;
      },
    });
  }

  /* small screens: no pinning, just honest reveals */
  function flowReveals() {
    const q = $$;
    if (ignite) {
      ScrollTrigger.create({
        trigger: "[data-hero]",
        start: "top+=40 top",
        onEnter: () => ignite.timeScale(1).play(),
        onLeaveBack: () => ignite.timeScale(1.6).reverse(),
      });
    }
    if (reduce) {
      q("[data-count]").forEach((el) => formatCount(el, Number(el.dataset.count)));
      return;
    }
    q("[data-count]").forEach((el) => {
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: Number(el.dataset.count),
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => formatCount(el, proxy.v),
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    });
    q(".specs, .perf__head, .perf__car, .perf__facts li, .shot").forEach((el) =>
      gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } })
    );
  }

  /* ── 4 · Finale ────────────────────────────────────────────────────── */
  function finale() {
    const sec = $("[data-finale]");
    const q = gsap.utils.selector(sec);
    if (reduce) return;
    gsap
      .timeline({ scrollTrigger: { trigger: sec, start: "top 62%", once: true }, defaults: { ease: "power3.out" } })
      .from(q("[data-finale-line]"), { yPercent: 110, duration: 1.6, stagger: 0.12, ease: "expo.out" })
      .from(q("[data-finale-car]"), { autoAlpha: 0, y: 70, scale: 0.94, duration: 2.2, ease: "power2.out" }, "<0.2")
      .from(q("[data-finale-glow]"), { autoAlpha: 0, duration: 2.4 }, "<")
      .from(q("[data-finale-foot] > *"), { autoAlpha: 0, y: 16, duration: 1.1, stagger: 0.12 }, "-=1.2");
  }
})();
