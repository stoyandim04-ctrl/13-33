import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";

import { site } from "@/data/content";
import { store } from "@/lib/inquiry-api";
import { DEPOSIT } from "@/lib/inquiry-shared";
import { RainbowLink } from "@/components/ui/rainbow-button";

const STEPS = [
  { title: "Разказваш", body: "Кратък въпросник или чат с асистента, със свои думи. Снимки, лого и примери са добре дошли." },
  { title: "Получаваш оферта", body: "Основателят ти пише лично в същия чат: крайна цена, срок и капаро. Можеш да запазиш и онлайн среща." },
  { title: "Започваме", body: `Приемаш офертата, плащаш капарото (${DEPOSIT.standard} €, при по-голям проект ${DEPOSIT.large} €) и започваме.` },
];

export function Contact() {
  // Someone who already sent an inquiry gets back to their chat in one tap.
  const [room, setRoom] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRoom(store<string[]>("1333-rooms")?.[0] ?? null);
  }, []);

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="section">
      <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
        <header className="lg:col-span-5">
          <p className="eyebrow mb-5">Започни проект</p>
          <h2 id="kontakt-title" className="font-display text-heading font-[300] tracking-[-0.045em] text-balance">
            Какво искаш да създадем?
          </h2>
          <p className="text-lead text-muted-foreground mt-6 max-w-[32ch] text-pretty">
            Разкажи го в чата. Без регистрация и без ангажимент.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <RainbowLink to="/zapochni">
              Започни проект
              <ArrowRight aria-hidden="true" className="size-4" />
            </RainbowLink>
            {room ? (
              <Link to={`/zapitvane/${room}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-[0.9375rem] transition-colors">
                <MessageCircle aria-hidden="true" className="size-4" /> Към моя чат
              </Link>
            ) : site.contactEmail ? (
              <a href={`mailto:${site.contactEmail}`} className="text-muted-foreground hover:text-foreground text-[0.9375rem] transition-colors">
                {site.contactEmail}
              </a>
            ) : null}
          </div>
        </header>

        <ol className="lg:col-span-6 lg:col-start-7">
          {STEPS.map((s, i) => (
            <li key={s.title} className="hairline grid grid-cols-[3rem_1fr] gap-4 py-7">
              <span className="text-ice font-display text-title tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="font-display text-title block font-[500] tracking-[-0.02em]">{s.title}</span>
                <span className="text-muted-foreground mt-2 block text-pretty">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
