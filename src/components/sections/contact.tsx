import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";

import { site, useContent } from "@/data/content";
import { store } from "@/lib/inquiry-api";
import { RainbowLink } from "@/components/ui/rainbow-button";

export function Contact() {
  const { contact } = useContent();
  const STEPS = contact.steps;
  // Someone who already sent an inquiry gets back to their page in one tap.
  const [room, setRoom] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRoom(store<string[]>("1333-rooms")?.[0] ?? null);
  }, []);

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="section">
      <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
        <header data-reveal className="lg:col-span-5">
          <p className="eyebrow mb-5">{contact.label}</p>
          <h2 id="kontakt-title" className="font-display text-heading font-[300] tracking-[-0.045em] text-balance">
            {contact.title}
          </h2>
          <p className="text-lead text-muted-foreground mt-6 max-w-[32ch] text-pretty">
            {contact.lead}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <RainbowLink to="/zapochni" data-ping="start-contact">
              {contact.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </RainbowLink>
            {room ? (
              <Link to={`/zapitvane/${room}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-[0.9375rem] transition-colors">
                <MessageCircle aria-hidden="true" className="size-4" /> {contact.myChat}
              </Link>
            ) : site.contactEmail ? (
              <a href={`mailto:${site.contactEmail}`} className="text-muted-foreground hover:text-foreground text-[0.9375rem] transition-colors">
                {site.contactEmail}
              </a>
            ) : null}
          </div>
        </header>

        <ol data-reveal style={{ "--d": 2 } as React.CSSProperties} className="lg:col-span-6 lg:col-start-7">
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
