import * as React from "react";
import { Plus } from "lucide-react";

import { services } from "@/data/content";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/sections/section-header";

/** An editorial list, not a card grid: name → the need it answers → what it is. */
export function Services() {
  const [openId, setOpenId] = React.useState<string | null>(services[0].id);

  return (
    <section id="uslugi" aria-labelledby="uslugi-title" className="section">
      <div className="container-wide">
        <SectionHeader
          id="uslugi-title"
          label="Какво създаваме"
          title="Решения според това, от което бизнесът ти има нужда."
          lead="Не продаваме инструменти, а работещ резултат — по-силно представяне, повече запитвания, по-лесни продажби или по-подредени процеси."
        />

        <ul className="mt-16 md:mt-24">
          {services.map((s) => {
            const open = openId === s.id;
            return (
              <li key={s.id} className="hairline last:border-b last:border-border">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`service-${s.id}`}
                    onClick={() => setOpenId(open ? null : s.id)}
                    className="group grid w-full cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 py-7 text-left md:grid-cols-12 md:py-9"
                  >
                    <span className="font-display text-title font-[350] tracking-[-0.01em] transition-colors group-hover:text-ice md:col-span-4">
                      {s.name}
                    </span>
                    <span className="text-muted-foreground col-span-2 row-start-2 max-w-[46ch] md:col-span-7 md:row-start-auto">
                      {s.need}
                    </span>
                    <Plus
                      aria-hidden="true"
                      className={cn(
                        "text-muted-foreground col-start-2 row-start-1 size-5 self-center justify-self-end transition-transform duration-500 ease-[var(--ease-out-expo)] md:col-span-1 md:col-start-12",
                        open && "rotate-45 text-foreground",
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={`service-${s.id}`}
                  role="region"
                  aria-label={s.name}
                  hidden={!open}
                  className="grid gap-6 pb-10 md:grid-cols-12 md:pb-12"
                >
                  <p className="text-lead max-w-[40ch] md:col-span-6 md:col-start-5">{s.body}</p>
                  <ul className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm md:col-span-3 md:col-start-5 md:row-start-2 md:col-end-12">
                    {s.includes.map((x) => (
                      <li key={x} className="before:bg-ice/70 relative pl-3 before:absolute before:top-[0.6em] before:left-0 before:size-1 before:rounded-full">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
