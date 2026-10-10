import { useEffect, useRef, useState } from "react";
import { arrival } from "../data/content";
import { ScrollTrigger, prefersReducedMotion } from "../lib/motion";

/* The signature: a scroll-scrubbed walk from the reflecting pool, through the
   front door and the lobby, out to the courtyard. The film is a sequence of
   stills (public/frames, cut by motion so every step is the same size) drawn
   on a canvas - steadier than seeking a <video> - with a light cross-fade
   between neighbouring frames so slow scrolling never steps. */

interface Manifest {
  count: number;
  /** Frame index where each shot ends: [start, door, lobby, courtyard]. */
  stops: number[];
  /** Phone frames are a centre crop of the film: [left, width] as fractions. */
  crop: [number, number];
}

type Frame = ImageBitmap | HTMLImageElement;
const dims = (f: Frame) => (f instanceof HTMLImageElement ? [f.naturalWidth, f.naturalHeight] : [f.width, f.height]);

/** Scroll progress -> frame position, with holds where the copy needs time. */
const SCHEDULE = [
  { p: 0, s: 0 },
  { p: 0.07, s: 0 },
  { p: 0.3, s: 1 },
  { p: 0.37, s: 1 },
  { p: 0.56, s: 2 },
  { p: 0.66, s: 2 },
  { p: 0.9, s: 3 },
  { p: 1, s: 3 },
];

/** Gentle in/out at the holds without slowing the middle of a shot. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)) * 0.35 + t * 0.65;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const window01 = (p: number, a: number, b: number, fade = 0.025) =>
  Math.min(clamp01((p - a) / fade + 1), clamp01((b - p) / fade + 1));

function stopPosition(p: number, stops: number[]) {
  for (let i = 1; i < SCHEDULE.length; i++) {
    const a = SCHEDULE[i - 1];
    const b = SCHEDULE[i];
    if (p <= b.p) {
      const t = b.p === a.p ? 1 : ease((p - a.p) / (b.p - a.p));
      return stops[a.s] + (stops[b.s] - stops[a.s]) * t;
    }
  }
  return stops[stops.length - 1];
}

const frameUrl = (set: "d" | "m", i: number) => `/frames/${set}/${String(i + 1).padStart(4, "0")}.webp`;

async function fetchFrame(url: string): Promise<Frame> {
  if ("createImageBitmap" in window) {
    // decoded off the main thread, and drawImage never has to decode it again
    const blob = await (await fetch(url)).blob();
    return createImageBitmap(blob);
  }
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export function Arrival() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layers = useRef<(HTMLElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);
  const placeRef = useRef<HTMLSpanElement>(null);
  const hotspotsRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";

    let disposed = false;
    let manifest: Manifest | null = null;
    let frames: (Frame | null)[] = [];
    let set: "d" | "m" = "d";
    let target = 0;
    let shown = 0;
    let raf = 0;
    let last = 0;
    let dirty = true;
    let visible = true;
    let activeIdx = 0;
    const still = prefersReducedMotion();

    const pickSet = () => (window.innerWidth / window.innerHeight < 0.85 ? "m" : "d");

    /** Cover-fit rectangle for the current canvas size (all frames share a size). */
    let rect = { x: 0, y: 0, w: 0, h: 0 };
    const fit = (f: Frame) => {
      const [fw, fh] = dims(f);
      const s = Math.max(canvas.width / fw, canvas.height / fh);
      rect = { x: (canvas.width - fw * s) / 2, y: (canvas.height - fh * s) / 2, w: fw * s, h: fh * s };
    };

    const nearest = (i: number) => {
      // the closest frame already in memory, so scrubbing never shows a hole
      for (let d = 0; d < frames.length; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };

    const placeHotspots = () => {
      const box = hotspotsRef.current;
      if (!box || box.style.visibility === "hidden") return;
      const dpr = canvas.width / canvas.clientWidth;
      const [left, width] = set === "m" && manifest ? manifest.crop : [0, 1];
      box.querySelectorAll<HTMLElement>("[data-x]").forEach((el) => {
        const u = (Number(el.dataset.x) - left) / width;
        el.style.display = u < 0.04 || u > 0.96 ? "none" : "";
        const x = (rect.x + u * rect.w) / dpr;
        const y = (rect.y + Number(el.dataset.y) * rect.h) / dpr;
        el.dataset.flip = String(x > canvas.clientWidth * 0.6);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };

    const draw = () => {
      if (!manifest) return;
      const i = Math.floor(shown);
      const f = shown - i;
      const a = nearest(i);
      if (!a) return;
      if (!rect.w) fit(a);
      ctx.globalAlpha = 1;
      ctx.drawImage(a, rect.x, rect.y, rect.w, rect.h);
      const b = frames[i + 1];
      if (f > 0.02 && b && a === frames[i]) {
        ctx.globalAlpha = f;
        ctx.drawImage(b, rect.x, rect.y, rect.w, rect.h);
        ctx.globalAlpha = 1;
      }
      placeHotspots();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      // mobile toolbars fire resize while scrolling; svh keeps the size, so skip
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingQuality = "high";
      rect = { x: 0, y: 0, w: 0, h: 0 };
      draw(); // redraw at once - a resized canvas is blank until then
    };

    const paintOverlays = (p: number) => {
      arrival.chapters.forEach((c, i) => {
        const el = layers.current[i];
        if (!el) return;
        const o = window01(p, c.from, c.to);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - o) * 18).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
      const idx = arrival.chapters.reduce((acc, c, i) => (p >= c.from - 0.03 ? i : acc), 0);
      if (idx !== activeIdx) {
        activeIdx = idx;
        setActive(idx);
        if (placeRef.current) placeRef.current.textContent = arrival.chapters[idx].place;
      }
      if (railRef.current) railRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
      const hs = hotspotsRef.current;
      if (hs) {
        const o = window01(p, 0.565, 0.655, 0.02);
        hs.style.opacity = o.toFixed(3);
        hs.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
    };

    const tick = (now: number) => {
      raf = visible ? requestAnimationFrame(tick) : 0;
      if (!manifest) return;
      const dt = last ? Math.min((now - last) / 16.67, 4) : 1;
      last = now;
      // frame-rate independent easing toward the scroll position
      const k = still ? 1 : 1 - Math.pow(1 - 0.16, dt);
      const next = shown + (target - shown) * k;
      if (Math.abs(next - shown) > 0.0004 || dirty) {
        shown = Math.abs(target - next) < 0.002 ? target : next;
        dirty = false;
        draw();
      }
    };

    const load = async () => {
      const res = await fetch("/frames/manifest.json");
      const m = (await res.json()) as Manifest;
      if (disposed) return;
      manifest = m;
      set = pickSet();
      frames = new Array(m.count).fill(null);
      const pending = new Set<number>(Array.from({ length: m.count }, (_, i) => i));
      const coarse = new Set<number>([...m.stops, ...Array.from({ length: Math.ceil(m.count / 6) }, (_, i) => i * 6)]);
      // next frame to fetch: a coarse frame near where the viewer is, then the
      // gaps nearest to them - so wherever they scroll, the film is already there
      const pick = () => {
        let best = -1;
        let bestScore = Infinity;
        for (const i of pending) {
          const score = Math.abs(i - target) + (coarse.has(i) ? 0 : 10000);
          if (score < bestScore) {
            bestScore = score;
            best = i;
          }
        }
        if (best >= 0) pending.delete(best);
        return best;
      };
      let done = 0;
      const worker = async () => {
        for (let i = pick(); i >= 0 && !disposed; i = pick()) {
          try {
            frames[i] = await fetchFrame(frameUrl(set, i));
          } catch {
            continue;
          }
          done++;
          if (done % 10 === 0 || done === m.count) setLoaded(done / m.count);
          if (Math.abs(i - shown) < 2) dirty = true;
        }
      };
      dirty = true;
      await Promise.all(Array.from({ length: 6 }, worker));
    };

    resize();
    load();
    raf = requestAnimationFrame(tick);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (manifest) target = stopPosition(self.progress, manifest.stops);
        paintOverlays(self.progress);
      },
      onRefresh: (self) => {
        if (manifest) target = stopPosition(self.progress, manifest.stops);
      },
    });
    paintOverlays(0);

    // no drawing while the film is off screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(section);

    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      trigger.kill();
      io.disconnect();
      window.removeEventListener("resize", resize);
      frames.forEach((f) => f instanceof ImageBitmap && f.close());
    };
  }, []);

  return (
    <section ref={sectionRef} id="pristigane" aria-label="Пристигане във Варовик" className="relative h-[720svh] bg-night">
      <div className="sticky top-0 h-svh overflow-hidden text-cream">
        <img
          src="/media/arrival-poster.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
          aria-hidden="true"
        />
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgb(10 12 24 / 0.55) 0%, transparent 22%, transparent 55%, rgb(10 12 24 / 0.7) 100%), radial-gradient(ellipse at center, transparent 55%, rgb(5 6 14 / 0.45) 100%)",
          }}
          aria-hidden="true"
        />

        {/* hotspots on the lobby frame */}
        <div ref={hotspotsRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
          {arrival.hotspots.map((h) => (
            <div key={h.label} data-x={h.x} data-y={h.y} className="group absolute left-0 top-0">
              <span className="absolute -left-[5px] -top-[5px] size-[10px] rounded-full border border-cream/90 bg-cream/40" />
              <span
                className="absolute top-0 left-0 h-px w-10 origin-left -rotate-[35deg] bg-cream/60 group-data-[flip=true]:left-auto group-data-[flip=true]:right-0 group-data-[flip=true]:origin-right group-data-[flip=true]:rotate-[35deg]"
              />
              <span
                className={`absolute -top-[3.1rem] whitespace-nowrap border border-cream/25 bg-night/70 px-3 py-1.5 text-[0.66rem] font-semibold tracking-[0.18em] uppercase left-8 group-data-[flip=true]:left-auto group-data-[flip=true]:right-8`}
              >
                {h.label}
              </span>
            </div>
          ))}
        </div>

        {/* chapters */}
        <div className="wrap relative grid h-full items-end pb-[max(2.75rem,8svh)]">
          {arrival.chapters.map((c, i) => (
            <div
              key={c.place}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className={`relative col-start-1 row-start-1 will-change-transform ${i === 0 ? "max-w-[56rem] self-center text-center justify-self-center" : "max-w-[34rem]"}`}
              style={{ opacity: i === 0 ? 1 : 0, textShadow: "0 2px 24px rgb(5 6 14 / 0.55)" }}
            >
              {i === 0 && (
                <span
                  className="pointer-events-none absolute -inset-x-[30%] -inset-y-[35%] -z-10"
                  style={{ background: "radial-gradient(closest-side, rgb(8 10 22 / 0.72), transparent)" }}
                  aria-hidden="true"
                />
              )}
              <p className="eyebrow text-cream/75">
                <span className="mr-3 text-brass">{String(i + 1).padStart(2, "0")}</span>
                {c.eyebrow}
              </p>
              {i === 0 ? (
                <h1 className="mt-5 font-display text-display font-light tracking-[-0.02em]">{c.title}</h1>
              ) : (
                <h2 className="mt-4 font-display text-heading font-light text-balance">{c.title}</h2>
              )}
              <p className={`mt-5 text-lead text-cream/80 text-pretty ${i === 0 ? "mx-auto max-w-[32rem]" : "max-w-[28rem]"}`}>{c.lead}</p>
              {i === 0 && (
                <div className="mt-12 flex flex-col items-center gap-3 text-cream/70">
                  <span className="eyebrow">Скролнете, за да влезете</span>
                  <span className="cue block h-12 w-px bg-current" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* right rail: where you are in the walk */}
        <nav aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:right-10 md:block">
          <div className="relative flex h-[46svh] flex-col justify-between pr-5 text-right">
            <span className="absolute right-0 top-0 h-full w-px bg-cream/20" />
            <span ref={railRef} className="absolute right-0 top-0 h-full w-px origin-top bg-brass" style={{ transform: "scaleY(0)" }} />
            {arrival.chapters.map((c, i) => (
              <span
                key={c.place}
                className={`text-[0.66rem] font-semibold tracking-[0.18em] uppercase transition-colors duration-500 ${i === active ? "text-cream" : "text-cream/40"}`}
              >
                {String(i + 1).padStart(2, "0")} · {c.place}
              </span>
            ))}
          </div>
        </nav>

        {/* level tag, like a floor indicator */}
        <div className="pointer-events-none absolute bottom-[max(2.75rem,8svh)] right-6 hidden text-right md:right-10 lg:block" aria-hidden="true">
          <span className="eyebrow block text-cream/60">Партер · ниво 0</span>
          <span ref={placeRef} className="mt-2 block font-display text-[2.6rem] font-light leading-none">
            {arrival.chapters[0].place}
          </span>
        </div>

        {/* first-load bar */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left bg-brass transition-opacity duration-700"
          style={{ transform: `scaleX(${loaded})`, opacity: loaded >= 1 ? 0 : 0.9 }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
