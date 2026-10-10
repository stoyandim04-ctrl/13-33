import { useState } from "react";
import { residences, site } from "../data/content";
import { SectionHead } from "./section-head";

const field =
  "mt-3 w-full border-0 border-b border-line bg-transparent py-3 text-lead outline-none transition-colors placeholder:text-mute/60 focus:border-accent";

export function Inquiry() {
  const [sent, setSent] = useState(false);

  return (
    <section id="zapitvane" aria-labelledby="zapitvane-h" className="section bg-paper">
      <div className="wrap grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
        <SectionHead
          id="zapitvane-h"
          eyebrow="Запитване"
          title="Искате да го видите отблизо?"
          lead="Оставете име и телефон — така би изглеждала връзката с купувача на истински проект."
        />

        <div data-reveal>
          {sent ? (
            <div role="status" className="border-t border-line pt-8">
              <p className="font-display text-title font-light">Благодарим.</p>
              <p className="mt-4 max-w-[30rem] text-body text-mute">
                Това е демонстрация — нищо не беше изпратено. {site.conceptNote}
              </p>
              <button onClick={() => setSent(false)} className="mt-8 border-b border-current pb-0.5 text-[0.9rem] font-medium hover:text-accent">
                Обратно към формата
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="grid gap-10"
            >
              <div className="grid gap-10 md:grid-cols-2">
                <label className="block">
                  <span className="eyebrow text-mute">Име</span>
                  <input required name="name" autoComplete="name" className={field} />
                </label>
                <label className="block">
                  <span className="eyebrow text-mute">Телефон</span>
                  <input required name="phone" type="tel" autoComplete="tel" className={field} />
                </label>
              </div>
              <fieldset>
                <legend className="eyebrow text-mute">Интересува ме</legend>
                <div className="mt-4 flex flex-wrap gap-3">
                  {residences.map((r, i) => (
                    <label key={r.id} className="cursor-pointer">
                      <input type="radio" name="type" value={r.id} defaultChecked={i === 1} className="peer sr-only" />
                      <span className="block border border-line px-5 py-2.5 text-[0.9rem] transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                        {r.name}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <button
                  type="submit"
                  className="bg-accent px-9 py-4 text-[0.82rem] font-semibold tracking-[0.16em] text-cream uppercase transition-colors duration-500 hover:bg-ink"
                >
                  Изпрати запитване
                </button>
                <p className="text-[0.8rem] text-mute">Демо форма — не изпраща данни.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
