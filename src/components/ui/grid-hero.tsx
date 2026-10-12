import * as React from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

import { useContent } from "@/data/content";
import { useReducedMotion } from "@/hooks/use-media";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen, after the founder's reference: a lilac glow from above,
// a perspective grid that drifts underneath, one sentence with two gradient
// phrases and the glowing primary button. The grid and the glow move a little
// with the scroll (parallax) and nothing else does. Reduced motion stills
// everything.
export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const floor = React.useRef<HTMLDivElement>(null);
  const beam = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { hero } = useContent();

  React.useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const el = section.current;
      if (!el) return;
      const y = window.scrollY;
      if (y > el.offsetHeight) return;
      if (floor.current) floor.current.style.translate = `0 ${(y * 0.08).toFixed(1)}px`;
      if (beam.current) beam.current.style.translate = `-50% ${(y * 0.18).toFixed(1)}px`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    draw();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <section
      ref={section}
      id={id}
      aria-label={hero.pill}
      className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-32 text-center sm:px-8 md:pb-40"
    >
      <div aria-hidden="true" className="hero-glow absolute inset-0 -z-20" />
      <div ref={beam} aria-hidden="true" className="hero-beam absolute -z-10" />
      <div ref={floor} aria-hidden="true" className="hero-floor absolute -z-10" />

      <a
        href={hero.secondary.href}
        className="hero-in border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 inline-flex items-center gap-1.5 rounded-full border bg-white/[0.03] px-4 py-2 text-sm transition-colors duration-500"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        {hero.pill}
        <ChevronRight aria-hidden="true" className="size-3.5" />
      </a>

      <h1
        className="hero-in font-display text-display mt-7 max-w-[20ch] font-[300] tracking-[-0.035em] text-balance"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        {hero.title.before} <span className="grad-lilac">{hero.title.lilac}</span>{" "}
        <span className="grad-peach">{hero.title.peach}</span>
      </h1>

      <p
        className="hero-in text-muted-foreground mt-6 max-w-[46ch] text-pretty md:text-lead"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        {hero.description}
      </p>

      <div className="hero-in mt-9 flex flex-wrap items-center justify-center gap-3" style={{ "--i": 3 } as React.CSSProperties}>
        <RainbowLink to={hero.primary.href}>
          {hero.primary.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </RainbowLink>
        <a
          href={hero.secondary.href}
          className="border-foreground/25 hover:border-primary inline-flex h-12 items-center rounded-full border px-6 text-[0.9375rem] font-medium transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_var(--color-primary)]"
        >
          {hero.secondary.label}
        </a>
      </div>

    </section>
  );
}
