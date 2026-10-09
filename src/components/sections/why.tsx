import { principles } from "@/data/content";

/** A statement on the left that stays put; principles on the right. */
export function Why() {
  return (
    <section id="zashto" aria-labelledby="zashto-title" className="section">
      <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
        <header className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <p className="eyebrow mb-5">Защо 13:33</p>
          <h2 id="zashto-title" className="font-display text-heading font-[500] tracking-[-0.045em] text-balance">
            Подход, а не шаблон.
          </h2>
          <p className="text-lead text-muted-foreground mt-6 max-w-[34ch] text-pretty">
            Впечатляващата визия привлича внимание. Решението трябва да работи и след първото впечатление.
          </p>
        </header>

        <dl className="lg:col-span-6 lg:col-start-7">
          {principles.map((p) => (
            <div key={p.name} className="hairline grid gap-3 py-8 md:grid-cols-[14rem_1fr] md:gap-8 md:py-10">
              <dt className="font-display text-title font-[500] tracking-[-0.025em]">{p.name}</dt>
              <dd className="text-muted-foreground max-w-[44ch] text-pretty md:pt-1.5">{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
