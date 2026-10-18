import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { useLang } from "@/lib/i18n";
import { useCoarseDevice, useReducedMotion } from "@/hooks/use-media";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen, and the page's one cinematic moment: a browser window and
// a phone rise out of a tilt and, as the page scrolls, one of our sites runs
// on both screens - the same site at desktop and at phone size, scrubbed
// frame by frame (public/hero, recorded by scripts/record-hero-frames.mjs).
// The hero is pinned for two screens of scroll: the words step aside, the
// devices come up and turn to face the reader, the promise closes the scene.
// Reduced motion: no pin, the devices stand still on their first frame.

const FRAMES = 72;
const SITE = "obsidian";
const frameSrc = (size: "desktop" | "mobile", i: number) => `/hero/${SITE}-${size}/${String(i).padStart(3, "0")}.webp`;

/** Loads a frame sequence a little at a time: the first frame, then every
    eighth, then the rest, so the scrub works early and sharpens as it fills. */
function useFrames(size: "desktop" | "mobile") {
  const frames = React.useRef<(HTMLImageElement | null)[]>(Array(FRAMES).fill(null));
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    const order = [0, ...Array.from({ length: FRAMES }, (_, i) => i).filter((i) => i % 8 === 0 && i), ...Array.from({ length: FRAMES }, (_, i) => i).filter((i) => i % 8)];
    let k = 0;
    const next = () => {
      if (!alive || k >= order.length) return;
      const i = order[k++];
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(size, i);
      img
        .decode()
        .then(() => {
          if (!alive) return;
          frames.current[i] = img;
          if (i === 0) setTick((t) => t + 1);
        })
        .catch(() => {})
        .finally(next);
    };
    // A few at a time.
    for (let n = 0; n < 4; n++) next();
    return () => {
      alive = false;
    };
  }, [size]);
  return frames;
}

/** The nearest loaded frame to `i`. */
function nearest(frames: (HTMLImageElement | null)[], i: number) {
  for (let d = 0; d < FRAMES; d++) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return null;
}

function drawCover(canvas: HTMLCanvasElement | null, img: HTMLImageElement | null) {
  if (!canvas || !img) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (canvas.width - dw) / 2, 0, dw, dh);
}

export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const words = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const closing = React.useRef<HTMLDivElement>(null);
  const hint = React.useRef<HTMLDivElement>(null);
  const desk = React.useRef<HTMLCanvasElement>(null);
  const phone = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const coarse = useCoarseDevice();
  const { hero } = useContent();
  const { tr } = useLang();
  const deskFrames = useFrames("desktop");
  const phoneFrames = useFrames("mobile");

  React.useEffect(() => {
    const el = section.current;
    if (!el) return;
    let frame = 0;
    let lastIndex = -1;
    let px = 0, py = 0;
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const draw = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const run = Math.max(1, r.height - window.innerHeight);
      const p = reduced ? 0 : clamp01(-r.top / run);

      // The words step aside.
      const out = ease(clamp01(p / 0.3));
      if (words.current) {
        words.current.style.opacity = String(1 - out);
        words.current.style.transform = `translate3d(0, ${(-out * 6).toFixed(2)}rem, 0)`;
        words.current.style.visibility = out > 0.99 ? "hidden" : "visible";
      }
      // The devices rise out of a tilt and face the reader; at the end they
      // step back a little to make room for the promise.
      const rise = reduced ? 1 : ease(clamp01(p / 0.42));
      const end = clamp01((p - 0.78) / 0.14);
      const narrow = window.innerWidth < 768;
      if (stage.current) {
        const tilt = (1 - rise) * 28;
        const low = narrow ? 95 : 38;
        stage.current.style.transform =
          `translate3d(0, ${((1 - rise) * low - end * (narrow ? 16 : 12)).toFixed(2)}%, 0) scale(${((0.78 + 0.22 * rise) * (1 - end * 0.14)).toFixed(3)}) ` +
          `rotateX(${(tilt - py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      }
      // The promise closes the scene.
      if (closing.current) {
        closing.current.style.opacity = String(end);
        closing.current.style.transform = `translate3d(0, ${((1 - end) * 1.5).toFixed(2)}rem, 0)`;
      }
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 10));

      // The site runs on both screens with the scroll.
      const i = Math.round(clamp01((p - 0.18) / 0.72) * (FRAMES - 1));
      if (i !== lastIndex || lastIndex < 0) {
        drawCover(desk.current, nearest(deskFrames.current, i));
        drawCover(phone.current, nearest(phoneFrames.current, i));
        if (deskFrames.current[i] && phoneFrames.current[i]) lastIndex = i;
      }
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      lastIndex = lastIndex >= 0 ? lastIndex : -1;
      kick();
    };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", () => {
      lastIndex = -1;
      kick();
    });
    if (!coarse && !reduced) window.addEventListener("pointermove", onMove, { passive: true });
    // Frames arrive over time: redraw a few times while they load.
    const fill = window.setInterval(() => {
      lastIndex = -1;
      kick();
    }, 400);
    const stop = window.setTimeout(() => window.clearInterval(fill), 12000);
    kick();
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(fill);
      window.clearTimeout(stop);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, coarse, deskFrames, phoneFrames]);

  return (
    <section ref={section} id={id} aria-labelledby="hero-title" className={reduced ? "relative" : "relative h-[260svh]"}>
      <div className={reduced ? "relative min-h-svh overflow-hidden" : "sticky top-0 h-svh overflow-hidden"}>
        {/* The words */}
        <div ref={words} className="relative z-20 px-5 pt-28 sm:px-8 md:pt-36 lg:px-14">
          <div className="container-wide">
            <p className="hero-in eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
              {hero.eyebrow}
            </p>
            <div className="mt-5 flex flex-col gap-8 lg:mt-7 lg:flex-row lg:items-end lg:justify-between">
              <h1 id="hero-title" className="font-display text-[clamp(3.25rem,1rem+8vw,9.5rem)] leading-[0.92] font-[300] tracking-[-0.065em]">
                <span className="hero-line">
                  <span style={{ "--i": 1 } as React.CSSProperties}>{hero.title.before}</span>
                </span>
                <span className="hero-line text-muted-foreground">
                  <span style={{ "--i": 2 } as React.CSSProperties}>{hero.title.accent}</span>
                </span>
              </h1>
              <div className="lg:max-w-[22rem] lg:pb-4">
                <p className="hero-in text-muted-foreground text-pretty md:text-[1.0625rem]" style={{ "--i": 3 } as React.CSSProperties}>
                  {hero.description}
                </p>
                <div className="hero-in mt-6 flex flex-wrap items-center gap-x-7 gap-y-4" style={{ "--i": 4 } as React.CSSProperties}>
                  <RainbowLink to={hero.primary.href} size="lg" data-ping="start-hero">
                    {hero.primary.label}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </RainbowLink>
                  <a href={hero.secondary.href} className="nav-link inline-flex items-center gap-2 text-[0.9375rem]">
                    {hero.secondary.label}
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The devices */}
        <div aria-hidden="true" className="hero-devices pointer-events-none absolute inset-x-0 top-[14%] bottom-[14%] z-10 grid place-items-center px-5 sm:px-8 lg:top-[12%] lg:bottom-[16%]">
          <div ref={stage} className="hero-stage relative">
            <div className="hero-desk">
              <div className="hero-desk-bar">
                <span />
                <span />
                <span />
                <em>{tr("obsidian · концепция на 13:33")}</em>
              </div>
              <canvas ref={desk} className="block size-full" />
            </div>
            <div className="hero-phone">
              <canvas ref={phone} className="block size-full" />
              <span className="hero-phone-island" />
            </div>
          </div>
        </div>

        {/* The promise */}
        <div ref={closing} className="pointer-events-none absolute inset-x-0 bottom-[4%] z-20 px-5 text-center opacity-0 sm:px-8">
          <p className="font-display mx-auto max-w-[22ch] text-[clamp(1.75rem,1rem+2.6vw,3.25rem)] leading-[1.05] font-[300] tracking-[-0.045em] text-balance">
            {hero.beat.title}
          </p>
          <p className="text-muted-foreground mx-auto mt-3 max-w-[40ch] text-[0.9375rem] text-pretty md:text-[1.0625rem]">{hero.beat.body}</p>
        </div>

        {reduced ? null : (
          <div ref={hint} aria-hidden="true" className="text-muted-foreground absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
            <span className="hero-scroll-line block" />
          </div>
        )}
      </div>
    </section>
  );
}
