import { process } from "@/data/content";
import { SectionHeader } from "@/components/sections/section-header";

/** A real sequence, so it is numbered: four words on one line. */
export function Process() {
  return (
    <section id="proces" aria-labelledby="proces-title" className="section bg-surface">
      <div className="container-wide">
        <SectionHeader id="proces-title" label="Процес" title="От идея до реализация." />

        <ol className="hairline mt-14 grid grid-cols-2 gap-x-6 gap-y-10 pt-10 md:mt-20 lg:grid-cols-4">
          {process.map((step, i) => (
            <li key={step.name}>
              <span className="text-ice font-display block text-sm font-[500] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-3 text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-none font-[300] tracking-[-0.03em]">
                {step.name}
              </h3>
              <p className="text-muted-foreground mt-3 max-w-[24ch] text-[0.9375rem] text-pretty">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
