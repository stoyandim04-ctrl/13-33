import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { projects } from "@/data/projects";
import { useReducedMotion } from "@/hooks/use-media";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen. Behind the promise, a tilted wall of our own sites: three
// columns of real screens sliding past each other without end (two on the
// phone), leaning a little towards the pointer. In front, the promise in two
// lines, one short paragraph and the glowing button; along the bottom, a
// running line of what we make. Only transforms move, everything rests off
// screen, and reduced motion stills it all.
export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const wall = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { hero } = useContent();
  const [onScreen, setOnScreen] = React.useState(true);

  React.useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The wall leans towards the pointer and sinks a little with the scroll.
  React.useEffect(() => {
    if (reduced) return;
    const el = section.current;
    const plane = wall.current;
    if (!el || !plane) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
    const draw = () => {
      frame = 0;
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      const s = Math.min(window.scrollY, el.offsetHeight);
      plane.style.setProperty("--lx", x.toFixed(3));
      plane.style.setProperty("--ly", y.toFixed(3));
      plane.style.setProperty("--sy", `${(s * 0.25).toFixed(1)}px`);
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.002) frame = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      kick();
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    kick();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  // Each column shows every project, in its own order, twice (for the loop).
  const posters = projects.map((p) => p.poster);
  const columns = [0, 2, 4].map((shift) => posters.map((_, i) => posters[(i + shift) % posters.length]));

  return (
    <section
      ref={section}
      id={id}
      aria-labelledby="hero-title"
      className={`relative isolate flex min-h-svh flex-col overflow-hidden${onScreen ? "" : " hero-rest"}`}
    >
      <div aria-hidden="true" className="hero-glow absolute inset-0 -z-30" />

      {/* The wall of work */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div ref={wall} className="hero-wall">
          {columns.map((col, c) => (
            <div key={c} className={`hero-wall-col${c === 1 ? " is-down" : ""}${c === 2 ? " is-slow" : ""}`}>
              {[...col, ...col].map((src, i) => (
                <img key={i} src={src} alt="" loading={i < 3 ? "eager" : "lazy"} decoding="async" draggable={false} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />

      <div className="container-wide flex flex-1 flex-col justify-center px-5 pt-32 pb-16 sm:px-8 md:pt-36 lg:px-14">
        <p
          className="hero-in border-border text-muted-foreground inline-flex w-fit items-center gap-2.5 rounded-full border bg-white/[0.04] px-4 py-2 text-[0.8125rem]"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <span aria-hidden="true" className="hero-dot" />
          {hero.eyebrow}
        </p>

        <h1
          id="hero-title"
          className="hero-in font-display mt-8 max-w-[14ch] text-[clamp(3rem,1.2rem+6.4vw,7.5rem)] leading-[0.98] font-[300] tracking-[-0.05em] text-balance"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="block">{hero.title.before}</span>
          <span className="grad-lilac block pb-[0.08em]">{hero.title.accent}</span>
        </h1>

        <p
          className="hero-in text-muted-foreground md:text-lead mt-7 max-w-[40ch] text-pretty"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          {hero.description}
        </p>

        <div className="hero-in mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ "--i": 3 } as React.CSSProperties}>
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

      {/* What we make, running along the bottom */}
      <div className="hero-in hairline relative overflow-hidden py-5" style={{ "--i": 4 } as React.CSSProperties}>
        <div className="hero-ticker">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined} className="flex shrink-0 items-center">
              {hero.ticker.map((t) => (
                <li key={t} className="font-display flex items-center text-[clamp(1.125rem,0.9rem+0.8vw,1.625rem)] font-[300] tracking-[-0.02em] whitespace-nowrap">
                  <span className="px-6 md:px-9">{t}</span>
                  <span aria-hidden="true" className="text-primary text-[0.7em]">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
