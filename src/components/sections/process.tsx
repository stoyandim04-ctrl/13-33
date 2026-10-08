import { process } from "@/data/content";
import { SectionHeader } from "@/components/sections/section-header";

/** A real sequence, so it is numbered. */
export function Process() {
  return (
    <section id="proces" aria-labelledby="proces-title" className="section bg-surface">
      <div className="container-wide">
        <SectionHeader
          id="proces-title"
          label="Процес"
          title="От идея до реализация."
          lead="Пет етапа с ясен обхват и работеща версия за преглед. Винаги знаеш къде сме."
        />

        <ol className="mt-16 grid gap-0 md:mt-24 lg:grid-cols-5 lg:gap-8">
          {process.map((step, i) => (
            <li key={step.name} className="relative grid grid-cols-[4rem_1fr] gap-x-4 pb-12 lg:block lg:pb-0">
              {/* Rail: vertical on phones, horizontal on desktop. */}
              {i < process.length - 1 ? (
                <span aria-hidden="true" className="bg-border absolute top-16 bottom-3 left-[0.85rem] w-px lg:top-[1.75rem] lg:right-[-1.5rem] lg:bottom-auto lg:left-16 lg:h-px lg:w-auto" />
              ) : null}
              <span className="font-display text-ice block text-[3.5rem] leading-none font-[200] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="lg:mt-8">
                <h3 className="font-display text-title font-[350] tracking-[-0.01em]">{step.name}</h3>
                <p className="text-muted-foreground mt-3 max-w-[38ch] text-pretty">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
