import type * as React from "react";

import { useContent } from "@/data/content";

/**
 * What we do: the names only, very large, one per line between hairlines.
 * On hover a line slides a little and the others quiet down.
 */
export function Services() {
  const { services } = useContent();
  return (
    <section id="uslugi" aria-labelledby="uslugi-title" className="section">
      <div className="container-wide">
        <div data-reveal className="flex items-baseline justify-between">
          <h2 id="uslugi-title" className="eyebrow">{services.label}</h2>
          <span className="eyebrow tabular-nums">{String(services.items.length).padStart(2, "0")}</span>
        </div>
        <ul className="svc-list mt-8 md:mt-12">
          {services.items.map((s, i) => (
            <li key={s.id} data-reveal style={{ "--d": i % 4 } as React.CSSProperties} className="hairline last:border-b">
              <span className="svc-name font-display block py-4 text-[clamp(2.25rem,1rem+5.5vw,7rem)] leading-[1] font-[300] tracking-[-0.055em] md:py-5">
                {s.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
