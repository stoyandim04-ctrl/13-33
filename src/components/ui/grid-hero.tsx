import * as React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useContent } from "@/data/content";
import { RainbowLink } from "@/components/ui/rainbow-button";

// The first screen: type only. Two enormous lines rise out of their own
// lines, one short paragraph with the promise and the ink button; a hairline
// at the bottom keeps drawing itself downwards. Nothing else.
export function GridHero({ id }: { id?: string }) {
  const { hero } = useContent();
  return (
    <section id={id} aria-labelledby="hero-title" className="relative flex min-h-svh flex-col px-5 pt-32 pb-10 sm:px-8 md:pt-40 lg:px-14">
      <div className="container-wide flex flex-1 flex-col justify-center">
        <p className="hero-in eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className="font-display text-display mt-6 font-[300] tracking-[-0.065em] text-balance md:mt-8">
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
      </div>
      <div aria-hidden="true" className="text-muted-foreground mt-12 hidden justify-center lg:flex">
        <span className="hero-scroll-line block" />
      </div>
    </section>
  );
}
