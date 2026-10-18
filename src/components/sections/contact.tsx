import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { site, useContent } from "@/data/content";
import { store } from "@/lib/inquiry-api";
import { RainbowLink } from "@/components/ui/rainbow-button";

/** One line, as large as the page, and the way in. */
export function Contact() {
  const { contact } = useContent();
  // Someone who already sent an inquiry gets back to their page in one tap.
  const [room, setRoom] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRoom(store<string[]>("1333-rooms")?.[0] ?? null);
  }, []);

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="section">
      <div className="container-wide">
        <p data-reveal className="eyebrow">{contact.label}</p>
        <h2
          id="kontakt-title"
          data-reveal
          className="font-display mt-6 text-[clamp(3.5rem,1rem+11vw,12rem)] leading-[0.9] font-[300] tracking-[-0.065em]"
        >
          {contact.title}
        </h2>
        <div data-reveal style={{ "--d": 2 } as React.CSSProperties} className="hairline mt-12 flex flex-wrap items-center justify-between gap-6 pt-8">
          <div className="text-muted-foreground flex flex-wrap gap-x-8 gap-y-2 text-[0.9375rem]">
            {site.contactEmail ? (
              <a href={`mailto:${site.contactEmail}`} className="nav-link">
                {site.contactEmail}
              </a>
            ) : null}
            {room ? (
              <Link to={`/zapitvane/${room}`} className="nav-link">
                {contact.myChat}
              </Link>
            ) : null}
          </div>
          <RainbowLink to="/zapochni" size="lg" data-ping="start-contact">
            {contact.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </RainbowLink>
        </div>
      </div>
    </section>
  );
}
