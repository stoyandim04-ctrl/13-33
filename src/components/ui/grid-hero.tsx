import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { useReducedMotion } from "@/hooks/use-media";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen, the way the best studios open: the name, as large as the
// page allows, and one line. On the first visit of a session a short intro
// counts to 100 and lifts away like a curtain; then the name rises letter by
// letter. Nothing else moves.
export function GridHero({ id }: { id?: string }) {
  const { hero } = useContent();
  const mark = React.useRef<HTMLHeadingElement>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [intro, setIntro] = React.useState(() => {
    try {
      return !sessionStorage.getItem("1333-intro");
    } catch {
      return false;
    }
  });

  // The name fills the width of the page, whatever the screen.
  React.useLayoutEffect(() => {
    const el = mark.current;
    const wrap = box.current;
    if (!el || !wrap) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const w = el.getBoundingClientRect().width || 1;
      el.style.fontSize = `${(100 * wrap.clientWidth * 0.97) / w}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!intro) return;
    try {
      sessionStorage.setItem("1333-intro", "1");
    } catch {
      /* private mode */
    }
    if (reduced) {
      setIntro(false);
      return;
    }
    const t = window.setTimeout(() => setIntro(false), 2300);
    return () => window.clearTimeout(t);
  }, [intro, reduced]);

  const delay = intro ? 1.9 : 0.1;
  return (
    <section id={id} aria-labelledby="hero-title" className="relative flex min-h-svh flex-col px-5 pt-28 pb-8 sm:px-8 md:pb-10 lg:px-14">
      {intro ? createPortal(<Intro />, document.body) : null}

      <div className="container-wide flex flex-1 flex-col justify-end">
        <div className="hero-in flex items-end justify-between gap-6" style={{ animationDelay: `${delay}s` }}>
          <p className="max-w-[24ch] text-[clamp(1.25rem,0.9rem+1.4vw,2.25rem)] leading-[1.15] font-[300] tracking-[-0.03em] text-balance">
            {hero.title.accent}
          </p>
          <div className="hidden shrink-0 md:block">
            <RainbowLink to={hero.primary.href} size="lg" data-ping="start-hero">
              {hero.primary.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </RainbowLink>
          </div>
        </div>

        <div ref={box} className="mt-8 md:mt-10">
          <h1
            ref={mark}
            id="hero-title"
            aria-label={hero.title.before}
            className="font-display hero-mark inline-block leading-[0.78] font-[300] tracking-[-0.075em] whitespace-nowrap"
          >
            {Array.from(hero.title.before).map((c, i) => (
              <span key={i} aria-hidden="true" className="hero-char" style={{ animationDelay: `${delay + i * 0.07}s` }}>
                {c}
              </span>
            ))}
          </h1>
        </div>

        <div className="hero-in hairline mt-6 flex items-center justify-between pt-4 text-[0.8125rem]" style={{ animationDelay: `${delay + 0.4}s` }}>
          <span className="text-muted-foreground">{hero.eyebrow}</span>
          <div className="md:hidden">
            <RainbowLink to={hero.primary.href} size="sm" data-ping="start-hero-m">
              {hero.primary.label}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </RainbowLink>
          </div>
          <a href={hero.secondary.href} className="nav-link hidden md:inline-block">
            {hero.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}

/** A curtain that counts to 100, then lifts. */
function Intro() {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now();
    let f = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1500);
      setN(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  }, []);
  return (
    <div aria-hidden="true" className="hero-curtain bg-foreground text-background fixed inset-0 z-[400] flex flex-col justify-between p-5 sm:p-8 lg:p-14">
      <span className="text-[0.8125rem] tracking-[0.2em] uppercase">13:33 — Digital Studio</span>
      <span className="font-display text-[clamp(5rem,3rem+14vw,16rem)] leading-[0.8] font-[200] tracking-[-0.06em] tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
    </div>
  );
}
