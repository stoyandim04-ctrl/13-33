import { Plus } from "lucide-react";

import { faq } from "@/data/content";
import { SectionHeader } from "@/components/sections/section-header";

export function Faq() {
  return (
    <section id="vaprosi" aria-labelledby="vaprosi-title" className="section bg-surface">
      <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="vaprosi-title"
          label="Въпроси"
          title="Често задавани въпроси."
          lead="Ако не намираш отговора тук, питай ни директно във формата."
          className="lg:col-span-5"
        />
        <div className="lg:col-span-7">
          {faq.map((item) => (
            <details key={item.q} className="group hairline last:border-b last:border-border">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-title font-[350] tracking-[-0.01em] transition-colors group-hover:text-ice">
                  {item.q}
                </span>
                <Plus
                  aria-hidden="true"
                  className="text-muted-foreground mt-2 size-5 shrink-0 transition-transform duration-500 group-open:rotate-45"
                />
              </summary>
              <p className="text-muted-foreground max-w-[58ch] pb-8 text-pretty">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
