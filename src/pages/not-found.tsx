import { Link } from "react-router-dom";

import { useLang } from "@/lib/i18n";

export default function NotFound() {
  const { tr } = useLang();
  return (
    <section className="section flex min-h-svh items-center">
      <div className="container-wide">
        <p className="eyebrow mb-5">404</p>
        <h1 className="font-display text-heading font-[300] tracking-[-0.045em]">{tr("Тази страница не съществува.")}</h1>
        <Link to="/" className="text-foreground hover:text-ice mt-8 inline-block border-b border-current pb-0.5 transition-colors">
          {tr("Към началото")}
        </Link>
      </div>
    </section>
  );
}
