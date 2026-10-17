import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { projects, STATUS_LABEL } from "@/data/projects";
import { useReducedMotion } from "@/hooks/use-media";
import { useLang } from "@/lib/i18n";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen, quiet and large: two enormous words rising out of their
// lines, one short paragraph and the ink button; under them a wide frame where
// our sites play one after another. Nothing else moves. Off screen the frame
// rests; reduced motion keeps the posters still.
export function GridHero({ id }: { id?: string }) {
  const section = React.useRef<HTMLElement>(null);
  const { hero } = useContent();
  const [onScreen, setOnScreen] = React.useState(true);

  React.useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={section} id={id} aria-labelledby="hero-title" className="relative px-5 pt-32 pb-8 sm:px-8 md:pt-40 lg:px-14">
      <div className="container-wide">
        <p className="hero-in eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
          {hero.eyebrow}
        </p>

        <h1
          id="hero-title"
          className="font-display text-display mt-6 font-[300] tracking-[-0.065em] md:mt-8"
        >
          <span className="hero-line">
            <span style={{ "--i": 1 } as React.CSSProperties}>{hero.title.before}</span>
          </span>
          <span className="hero-line text-muted-foreground">
            <span style={{ "--i": 2 } as React.CSSProperties}>{hero.title.accent}</span>
          </span>
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <p
            className="hero-in text-lead text-muted-foreground max-w-[34ch] text-pretty md:col-span-6 lg:col-span-5"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {hero.description}
          </p>
          <div
            className="hero-in flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-6 md:justify-end lg:col-span-7"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            <a href={hero.secondary.href} className="nav-link inline-flex items-center gap-2 text-[0.9375rem]">
              {hero.secondary.label}
              <ArrowDown aria-hidden="true" className="size-3.5" />
            </a>
            <RainbowLink to={hero.primary.href} size="lg" data-ping="start-hero">
              {hero.primary.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </RainbowLink>
          </div>
        </div>

        <HeroFrame playing={onScreen} />
      </div>
    </section>
  );
}

/** Our sites, one after another, each from its first frame (the top of the site). */
function HeroFrame({ playing }: { playing: boolean }) {
  const reduced = useReducedMotion();
  const { lang, tr } = useLang();
  const [i, setI] = React.useState(0);
  const count = projects.length;

  React.useEffect(() => {
    if (reduced || !playing || count < 2) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % count), 9500);
    return () => window.clearTimeout(id);
  }, [reduced, playing, count, i]);

  if (!count) return null;
  const p = projects[i];
  return (
    <a href="#proekti" aria-label={tr("Виж проектите")} className="group mt-14 block md:mt-20">
      <div className="hero-frame bg-surface relative aspect-[4/3] overflow-hidden md:aspect-[16/8]">
        {projects.map((q, n) => (
          <img
            key={q.slug}
            src={q.poster}
            alt=""
            loading={n === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 size-full object-cover object-top transition-[opacity,scale] duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.015]"
            style={{ opacity: n === i ? 1 : 0 }}
          />
        ))}
        {!reduced && playing && p.video ? (
          <video
            key={p.slug}
            ref={(v) => {
              // iOS starts inline video by itself only with the muted attribute.
              if (v) v.setAttribute("muted", "");
            }}
            className="absolute inset-0 size-full object-cover object-top transition-[scale] duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.015]"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            poster={p.poster}
            onEnded={() => setI((n) => (n + 1) % count)}
          >
            {p.video.mp4 ? <source src={p.video.mp4} type="video/mp4" /> : null}
            {p.video.webm ? <source src={p.video.webm} type="video/webm" /> : null}
          </video>
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-6 text-sm">
        <span key={p.slug} className="ww-rise">
          <span className="font-medium">{lang === "en" && p.nameEn ? p.nameEn : p.name}</span>
          <span className="text-muted-foreground"> — {lang === "en" && p.categoryEn ? p.categoryEn : p.category}</span>
          <span className="text-muted-foreground hidden sm:inline"> · {tr(STATUS_LABEL[p.status])}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>
    </a>
  );
}
