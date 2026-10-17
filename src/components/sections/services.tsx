import type * as React from "react";

import { useContent } from "@/data/content";
import { SectionHeader } from "@/components/sections/section-header";

/**
 * What we do, as an editorial list: the name large on the left, one sentence
 * and what it includes on the right, a hairline between rows. The row warms
 * on hover. No icons, no cards.
 */
export function Services() {
  const { services } = useContent();
  return (
    <section id="uslugi" aria-labelledby="uslugi-title" className="section">
      <div className="container-wide">
        <SectionHeader id="uslugi-title" label={services.label} title={services.title} lead={services.lead} />

        <ul className="mt-16 md:mt-24">
          {services.items.map((s, i) => (
            <li
              key={s.id}
              data-reveal
              style={{ "--d": i % 3 } as React.CSSProperties}
              className="group hairline grid gap-3 py-8 transition-colors duration-500 last:border-b md:grid-cols-12 md:gap-10 md:py-10 [&:last-child]:border-border"
            >
              <h3 className="font-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-[1.05] font-[300] tracking-[-0.04em] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:col-span-5">
                {s.name}
              </h3>
              <div className="md:col-span-7 md:pt-2">
                <p className="max-w-[46ch] text-[1.0625rem] text-pretty">{s.body}</p>
                <p className="text-muted-foreground mt-3 text-[0.9375rem]">{s.includes.join(" · ")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
