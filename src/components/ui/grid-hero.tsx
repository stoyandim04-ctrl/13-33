import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { projects, STATUS_LABEL } from "@/data/projects";
import { useReducedMotion } from "@/hooks/use-media";
import { useLang } from "@/lib/i18n";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen: the promise in two lines (the second in the lilac
// gradient), one short paragraph, the glowing primary button and three facts
// on a hairline. Behind it a slow lilac aura and a perspective grid that
// drifts underneath; both move a little with the scroll. Reduced motion
// stills everything.
export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const floor = React.useRef<HTMLDivElement>(null);
  const aura = React.useRef<HTMLDivElement>(null);
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
      if (aura.current) aura.current.style.translate = `0 ${(y * 0.22).toFixed(1)}px`;
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
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden px-5 pt-28 pb-8 sm:px-8 md:pt-32 md:pb-10 lg:px-14"
    >
      <div aria-hidden="true" className="hero-glow absolute inset-0 -z-30" />
      <div ref={aura} aria-hidden="true" className="hero-aura absolute inset-0 -z-20" />
      <div ref={floor} aria-hidden="true" className="hero-floor absolute -z-10" />

      <div className="container-wide grid flex-1 items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="hero-in eyebrow flex items-center gap-3" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden="true" className="hero-dot" />
            {hero.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="hero-in font-display text-display lg:text-[clamp(3rem,1rem+3.6vw,5.25rem)] mt-7 max-w-[16ch] font-[300] tracking-[-0.045em] text-balance"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <span className="block">{hero.title.before}</span>
            <span className="grad-lilac block">{hero.title.accent}</span>
          </h1>

          <p
            className="hero-in text-muted-foreground md:text-lead mt-8 max-w-[44ch] text-pretty"
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

        <HeroReel className="hero-in hidden lg:col-span-5 lg:block" />
      </div>

      <dl
        className="hero-in container-wide hairline mt-14 grid grid-cols-3 gap-4 pt-6 md:gap-10"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        {hero.facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:gap-4">
            <dt className="font-display text-title font-[300] tracking-[-0.03em] tabular-nums md:text-[2.5rem] md:leading-none">
              {f.value}
            </dt>
            <dd className="text-muted-foreground text-[0.8125rem] leading-snug text-pretty md:max-w-[16ch] md:text-[0.9375rem]">{f.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * The real work, next to the promise: the portfolio's projects one after
 * another, the front one playing its preview, two more stacked behind it.
 * Desktop only; on the phone the wheel right below does this job.
 */
function HeroReel({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { lang, tr } = useLang();
  const [i, setI] = React.useState(0);
  const count = projects.length;

  React.useEffect(() => {
    if (reduced || count < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % count), 5200);
    return () => window.clearInterval(id);
  }, [reduced, count]);

  if (!count) return null;
  const p = projects[i];
  return (
    <a href="#proekti" aria-label={tr("Виж проектите")} className={className} style={{ "--i": 3 } as React.CSSProperties}>
      <div className="hero-reel relative mx-auto w-full max-w-[34rem]">
        {[2, 1].map((depth) => (
          <div
            key={depth}
            aria-hidden="true"
            className="border-border bg-surface absolute inset-0 rounded-[1.25rem] border"
            style={{ transform: `translate3d(${depth * 5}%, ${-depth * 7}%, 0) scale(${1 - depth * 0.07})`, opacity: 0.55 - depth * 0.18 }}
          />
        ))}
        <div className="border-border bg-surface relative aspect-[1.45] overflow-hidden rounded-[1.25rem] border shadow-[0_40px_120px_-40px_rgb(143_123_255/0.55)]">
          {projects.map((q, n) => (
            <img
              key={q.slug}
              src={q.poster}
              alt=""
              loading={n === 0 ? "eager" : "lazy"}
              className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
              style={{ opacity: n === i ? 1 : 0 }}
            />
          ))}
          {!reduced && p.video ? (
            <video key={p.slug} className="hero-reel-video absolute inset-0 size-full object-cover" autoPlay muted loop playsInline poster={p.poster}>
              {p.video.webm ? <source src={p.video.webm} type="video/webm" /> : null}
              {p.video.mp4 ? <source src={p.video.mp4} type="video/mp4" /> : null}
            </video>
          ) : null}
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-4 text-sm">
          <span key={p.slug} className="ww-rise">
            <span className="font-medium">{lang === "en" && p.nameEn ? p.nameEn : p.name}</span>
            <span className="text-muted-foreground"> · {tr(STATUS_LABEL[p.status])}</span>
          </span>
          <span className="text-muted-foreground tabular-nums">
            {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>
    </a>
  );
}
