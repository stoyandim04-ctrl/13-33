import { useEffect, useRef, useState } from "react";
import { SEQ, type Tier } from "./seq";
import { chapters, hero, orderCta } from "./content";
import { Words } from "./words";

/*
  The signature moment: a pinned, scroll-scrubbed film (rotate → open →
  pour → spread) drawn on a canvas.

  Smoothness: scroll position is damped in time (not per frame), and the
  two frames around the fractional position are cross-faded, so 12 fps
  source frames scrub without visible steps in either direction.

  Loading: a coarse skeleton first (every 8th frame), then whatever is
  nearest to where the user is, so scrubbing works before everything has
  arrived; the nearest loaded frame always stands in. Three tiers of
  frames exist (desktop / phone / light), picked by screen and device.
*/

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 over [from, to] with soft edges. */
const window01 = (from: number, to: number, v: number, edge = 0.05) =>
  smooth(from, from + edge, v) * (1 - smooth(to - edge, to, v));

/*
  Scroll → frame, with short holds: on the hero, after the lid opens, after
  the pour, and on the finished toast — so each chapter can be read.
*/
const TIMELINE: [number, number][] = [
  [0, 0],
  [0.06, 0],
  [0.32, 1 / 3],
  [0.38, 1 / 3],
  [0.62, 2 / 3],
  [0.68, 2 / 3],
  [0.88, 1],
  [1, 1],
];
function frameAt(p: number, count: number) {
  const last = Math.max(count - 1, 0);
  for (let k = 1; k < TIMELINE.length; k++) {
    const [p1, f1] = TIMELINE[k];
    if (p <= p1) {
      const [p0, f0] = TIMELINE[k - 1];
      const t = p1 === p0 ? 1 : (p - p0) / (p1 - p0);
      return (f0 + (f1 - f0) * t) * last;
    }
  }
  return last;
}

/** Which frame set this device gets. */
function pickTier(): Tier {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const portraitPhone = innerWidth < 820 && innerHeight > innerWidth;
  const slowNet = !!nav.connection?.saveData || /(^|[^4-9])[23]g$/.test(nav.connection?.effectiveType ?? "");
  const weak = (nav.deviceMemory ?? 8) <= 3 || (navigator.hardwareConcurrency ?? 8) <= 3;
  if (portraitPhone) return slowNet || weak ? "s" : "m";
  return slowNet ? "m" : "d";
}

function framePath(tier: Tier, i: number) {
  return `/seq/${tier}/${String(i + 1).padStart(4, "0")}.webp`;
}

/** Coarse-to-fine order: 0, every 32nd, every 16th … every frame. */
function loadOrder(n: number) {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [32, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (n && !seen.has(n - 1)) order.push(n - 1);
  return order;
}

export function Film({ onReady }: { onReady: (progress: number) => void }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = section.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const tier = pickTier();
    const count = SEQ[tier].count;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    const requested = new Uint8Array(count);
    let loaded = 0;
    let disposed = false;
    let dirty = true;

    // Poster first so the hero is never empty.
    const poster = new Image();
    poster.src = "/media/hero.webp";
    poster.decode().then(() => (dirty = true)).catch(() => {});

    const order = loadOrder(count);
    const skeleton = order.filter((i) => i % 8 === 0).length;
    let cursor = 0;
    let inflight = 0;
    const PARALLEL = tier === "d" ? 6 : 4;
    const WINDOW = tier === "s" ? 12 : 24;
    let current = 0;

    /** Next frame to fetch: skeleton first, then nearest to the user. */
    const pick = (): number => {
      while (cursor < skeleton && requested[order[cursor]]) cursor++;
      if (cursor < skeleton) return order[cursor++];
      const c = Math.round(current);
      for (let d = 0; d <= WINDOW; d++) {
        if (c - d >= 0 && !requested[c - d]) return c - d;
        if (c + d < count && !requested[c + d]) return c + d;
      }
      while (cursor < order.length && requested[order[cursor]]) cursor++;
      return cursor < order.length ? order[cursor++] : -1;
    };
    const pump = () => {
      while (!disposed && inflight < PARALLEL) {
        const i = pick();
        if (i < 0) return;
        requested[i] = 1;
        inflight++;
        const img = new Image();
        img.decoding = "async";
        img.src = framePath(tier, i);
        const done = () => {
          inflight--;
          loaded++;
          if (loaded <= skeleton) onReady(loaded / skeleton);
          dirty = true;
          pump();
        };
        img
          .decode()
          .then(() => {
            frames[i] = img;
            done();
          })
          .catch(() => {
            // Decode can fail on memory pressure; keep going with neighbours.
            done();
          });
      }
    };
    if (count) pump();
    else onReady(1);

    const nearest = (i: number) => {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };

    let w = 0;
    let h = 0;
    const resize = () => {
      const cap = tier === "d" ? 2 : tier === "m" ? 1.5 : 1;
      const dpr = Math.min(devicePixelRatio || 1, cap);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = "high";
      dirty = true;
    };

    // Where to keep the subject when a wide frame is cropped to a tall screen.
    const focal = (p: number) => {
      if (tier !== "d") return 0.5;
      const keys: [number, number][] = [
        [0, 0.7],
        [0.33, 0.6],
        [0.66, 0.62],
        [1, 0.45],
      ];
      for (let k = 1; k < keys.length; k++) {
        if (p <= keys[k][0]) {
          const [p0, f0] = keys[k - 1];
          const [p1, f1] = keys[k];
          return f0 + (f1 - f0) * smooth(p0, p1, p);
        }
      }
      return 0.45;
    };

    const draw = (img: HTMLImageElement, p: number, zoom: number, alpha = 1) => {
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = w / h;
      let dw: number;
      let dh: number;
      if (cr > ir) {
        dw = w * zoom;
        dh = dw / ir;
      } else {
        dh = h * zoom;
        dw = dh * ir;
      }
      const fx = focal(p);
      const dx = clamp(w / 2 - dw * fx, w - dw, 0);
      const dy = (h - dh) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let lastActive = -1;
    let lastT = performance.now();
    let lastDrawnAt = -1;
    let lastDrawnA: HTMLImageElement | null = null;
    let lastDrawnB: HTMLImageElement | null = null;
    // Damping speed (1/s): higher = tighter to the finger/wheel.
    const K = tier === "d" ? 11 : 14;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      const total = r.height - innerHeight;
      const p = clamp(-r.top / total);
      const target = frameAt(p, count);
      if (reduced) current = target;
      else {
        current += (target - current) * (1 - Math.exp(-dt * K));
        if (Math.abs(target - current) < 0.002) current = target;
      }

      const i0 = Math.floor(current);
      const i1 = Math.min(count - 1, i0 + 1);
      const t = current - i0;
      const A = (count && nearest(i0)) || (poster.complete && poster.naturalWidth ? poster : null);
      const B = count && t > 0.01 ? nearest(i1) : null;
      // Slow push-in over the whole film keeps even still frames alive.
      const zoom = 1.04 - 0.04 * p;
      if (A && (dirty || Math.abs(current - lastDrawnAt) > 0.004 || A !== lastDrawnA || B !== lastDrawnB)) {
        draw(A, p, zoom);
        if (B && B !== A) draw(B, p, zoom, t);
        lastDrawnAt = current;
        lastDrawnA = A;
        lastDrawnB = B;
        dirty = false;
      }
      if (inflight < PARALLEL) pump();

      // Overlays.
      const heroO = 1 - smooth(0.0, 0.07, p);
      if (heroRef.current) {
        heroRef.current.style.opacity = String(heroO);
        heroRef.current.style.transform = `translate3d(0, ${(-p * 260).toFixed(1)}px, 0)`;
        heroRef.current.style.filter = `blur(${((1 - heroO) * 10).toFixed(1)}px)`;
        heroRef.current.style.pointerEvents = heroO > 0.5 ? "auto" : "none";
      }
      let act = -1;
      chapters.forEach((c, i) => {
        const node = chapterRefs.current[i];
        if (!node) return;
        const o = window01(c.from, c.to, p, 0.06);
        if (o > 0.5) act = i;
        const y = (1 - o) * (p < (c.from + c.to) / 2 ? 40 : -40);
        node.style.opacity = o.toFixed(3);
        node.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        node.style.filter = `blur(${((1 - o) * 12).toFixed(1)}px)`;
      });
      if (act !== lastActive) {
        lastActive = act;
        setActive(act);
      }
      if (railRef.current) railRef.current.style.setProperty("--p", p.toFixed(4));
      if (barsRef.current) {
        const b = smooth(0.03, 0.1, p) * (1 - smooth(0.95, 1, p));
        barsRef.current.style.setProperty("--bars", b.toFixed(3));
      }
    };

    resize();
    // iOS toolbars resize the stage while scrolling; follow without thrash.
    let rt = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = window.setTimeout(resize, 120);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(cv);
    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      ro.disconnect();
    };
  }, [onReady]);

  return (
    <section ref={section} className="film" aria-label="Black Clove — филм">
      <div className="film-stage">
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" aria-hidden="true" />
        <div ref={barsRef} className="letterbox" aria-hidden="true">
          <span />
          <span />
        </div>

        <div ref={heroRef} className="hero-copy">
          <p className="eyebrow pill">{hero.eyebrow}</p>
          <h1>
            <span className="line">
              <Words text={hero.title[0]} />
            </span>
            <span className="line accent">
              <Words text={hero.title[1]} from={hero.title[0].split(" ").length} />
            </span>
          </h1>
          <p className="hero-lead">{hero.lead}</p>
          <div className="hero-actions">
            <a className="button gold" href={orderCta.href}>
              {orderCta.label} <span aria-hidden="true">→</span>
            </a>
            <a className="button ghost" href={hero.secondary.href}>
              {hero.secondary.label}
            </a>
          </div>
          <ul className="hero-points" aria-label="Накратко">
            {hero.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a className="scroll-cue" href="#process">
            <span className="scroll-cue-line" aria-hidden="true" />
            {hero.cue}
          </a>
        </div>

        {chapters.map((c, i) => (
          <div
            key={c.title}
            ref={(n) => {
              chapterRefs.current[i] = n;
            }}
            className={`chapter chapter-${c.align}${active === i ? " is-on" : ""}`}
            aria-hidden={active !== i}
          >
            <p className="chapter-num">
              <span>{c.n}</span>
              <i aria-hidden="true" />
            </p>
            <h2>
              <Words text={c.title} />
            </h2>
            <p>{c.text}</p>
            <ul className="chapter-facts">
              {c.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}

        <div ref={railRef} className="rail" aria-hidden="true">
          <span className="rail-fill" />
          {chapters.map((c, i) => (
            <span key={c.title} className={`rail-tick${active === i ? " is-on" : ""}`} style={{ top: `${((c.from + c.to) / 2) * 100}%` }}>
              {c.title}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
