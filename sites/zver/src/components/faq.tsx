import { useState } from "react";
import { FAQ } from "../data/flavours";
import { Eyebrow } from "./bits";

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" data-stage="faq" className="relative z-20 bg-black px-4 py-24 text-bone sm:px-8 md:py-36" aria-labelledby="faq-h">
      <div className="mx-auto max-w-6xl">
        <Eyebrow n="06" className="mb-4 text-[var(--f-hi)]">
          Въпроси
        </Eyebrow>
        <h2 id="faq-h" className="display text-[clamp(2.1rem,8.6vw,8.5rem)] leading-[0.86]">
          Питат ни.
          <br />
          <span className="outline-text [--outline-fill:#0a0a0a] [--outline-ink:#f4f1ea]">Отговаряме.</span>
        </h2>
        <p className="mt-6 max-w-md text-lead font-medium opacity-80">Кратко и честно — особено за кофеина.</p>

        <ul className="mt-12 border-t-[3px] border-bone">
          {FAQ.map((q, i) => {
            const on = open === i;
            return (
              <li key={q.q} className="border-b-[3px] border-bone">
                <button
                  type="button"
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? -1 : i)}
                >
                  <span className="display text-[clamp(1.1rem,2.6vw,2.4rem)] leading-tight transition-colors group-hover:text-[var(--f-hi)]">{q.q}</span>
                  <span className={`display grid h-11 w-11 shrink-0 place-items-center border-[3px] border-bone text-2xl transition-transform duration-300 ${on ? "rotate-45 bg-bone text-black" : ""}`} aria-hidden>
                    +
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 text-lead font-medium opacity-85">{q.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
