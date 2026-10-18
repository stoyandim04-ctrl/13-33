import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { useCoarseDevice, useReducedMotion } from "@/hooks/use-media";
import { RainbowLink } from "@/components/ui/rainbow-button";
import type { InkScene } from "@/components/ui/ink-scene";

// The first screen, and the page's one sculptural moment. Beside the words a
// drop of ink breathes like liquid (three.js, components/ui/ink-scene.ts).
// The hero is pinned for two screens of scroll: the words step aside, the
// drop drifts to the centre and grows, and the promise takes its place.
// Reduced motion: no pin, the drop stands still.
export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const beats = React.useRef<(HTMLDivElement | null)[]>([]);
  const hint = React.useRef<HTMLDivElement>(null);
  const scene = React.useRef<InkScene | null>(null);
  const reduced = useReducedMotion();
  const coarse = useCoarseDevice();
  const { hero } = useContent();
  const [webgl, setWebgl] = React.useState(true);

  // The sculpture, loaded on demand.
  React.useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let alive = true;
    let s: InkScene | null = null;
    import("@/components/ui/ink-scene")
      .then(({ createInkScene }) => {
        if (!alive) return;
        s = createInkScene(el, { light: coarse, still: reduced });
        scene.current = s;
        el.classList.add("is-ready");
      })
      .catch(() => setWebgl(false));
    const onResize = () => scene.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      s?.dispose();
      scene.current = null;
    };
  }, [coarse, reduced]);

  // Scroll → progress → the clock and the three beats of words.
  React.useEffect(() => {
    const el = section.current;
    if (!el) return;
    let frame = 0;
    const fade = (p: number, a: number, b: number, c: number, d: number) =>
      p < a ? 0 : p < b ? (p - a) / (b - a) : p < c ? 1 : p < d ? 1 - (p - c) / (d - c) : 0;
    const draw = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const run = Math.max(1, r.height - window.innerHeight);
      const p = reduced ? 0 : Math.min(1, Math.max(0, -r.top / run));
      scene.current?.setProgress(p);
      scene.current?.setActive(r.bottom > 0 && r.top < window.innerHeight);
      if (reduced) return;
      const shows = [fade(p, -1, 0, 0.18, 0.4), fade(p, 0.55, 0.78, 2, 3)];
      shows.forEach((o, i) => {
        const b = beats.current[i];
        if (!b) return;
        b.style.opacity = String(o);
        b.style.transform = `translate3d(0, ${((1 - o) * (i === 0 && p > 0.2 ? -1 : 1) * 2.5).toFixed(2)}rem, 0)`;
        b.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 8));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => scene.current?.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (!coarse) window.addEventListener("pointermove", onMove, { passive: true });
    draw();
    const late = window.setTimeout(draw, 600); // once the scene has loaded
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(late);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, coarse]);

  const beat = hero.beat;
  return (
    <section
      ref={section}
      id={id}
      aria-labelledby="hero-title"
      className={reduced ? "relative" : "relative h-[240svh]"}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* The drop: the whole screen on wide screens (it travels from the
            right to the centre), the upper half on phones. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[6%] h-[50%] lg:inset-0 lg:h-full">
          {webgl ? <canvas ref={canvas} className="ink-canvas size-full" /> : <div className="ink-fallback" />}
        </div>

        <div className="container-wide relative h-full px-5 sm:px-8 lg:px-14">
          {/* Beat 1: the promise */}
          <div
            ref={(n) => {
              beats.current[0] = n;
            }}
            className="absolute inset-x-5 bottom-[7%] sm:inset-x-8 lg:inset-x-14 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
          >
            <p className="hero-in eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
              {hero.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="font-display mt-5 text-[clamp(3.25rem,1rem+8vw,9.5rem)] leading-[0.92] font-[300] tracking-[-0.065em] lg:mt-7"
            >
              <span className="hero-line">
                <span style={{ "--i": 1 } as React.CSSProperties}>{hero.title.before}</span>
              </span>
              <span className="hero-line text-muted-foreground">
                <span style={{ "--i": 2 } as React.CSSProperties}>{hero.title.accent}</span>
              </span>
            </h1>
            <p
              className="hero-in text-muted-foreground md:text-lead mt-6 max-w-[34ch] text-pretty lg:mt-9"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {hero.description}
            </p>
            <div className="hero-in mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-10" style={{ "--i": 4 } as React.CSSProperties}>
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

          {reduced ? null : (
            <>
              {/* Beat 2: the promise, under the drop */}
              <div
                ref={(n) => {
                  beats.current[1] = n;
                }}
                className="invisible absolute inset-x-5 bottom-[8%] text-center opacity-0 sm:inset-x-8 lg:inset-x-14 lg:bottom-[9%]"
              >
                <p className="font-display mx-auto max-w-[18ch] text-[clamp(2.25rem,1rem+4.2vw,5.25rem)] leading-[1] font-[300] tracking-[-0.055em] text-balance">
                  {beat.title}
                </p>
                <p className="text-muted-foreground md:text-lead mx-auto mt-5 max-w-[36ch] text-pretty">{beat.body}</p>
              </div>
            </>
          )}
        </div>

        {reduced ? null : (
          <div ref={hint} aria-hidden="true" className="text-muted-foreground absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.6875rem] tracking-[0.22em] uppercase lg:flex">
            <span className="hero-scroll-line" />
          </div>
        )}
      </div>
    </section>
  );
}
