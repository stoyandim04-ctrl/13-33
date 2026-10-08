import { nav, site } from "@/data/content";

export function SiteFooter() {
  return (
    <footer className="border-border border-t px-5 pt-16 pb-10 sm:px-8 lg:px-14">
      <div className="container-wide">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div>
            <p className="font-display text-[clamp(4rem,12vw,9rem)] leading-[0.85] font-[250] tracking-[-0.035em]">
              13:33
            </p>
            <p className="eyebrow mt-4">Digital Studio · България</p>
          </div>
          <nav aria-label="Навигация във футъра">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={`/${item.href}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
              {site.contactEmail ? (
                <li>
                  <a href={`mailto:${site.contactEmail}`} className="text-foreground hover:text-ice transition-colors">
                    {site.contactEmail}
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
        <div className="hairline text-muted-foreground mt-14 flex flex-col justify-between gap-3 pt-6 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} 13:33 — Digital Studio</p>
          <p>Проектите в портфолиото са означени според статуса си.</p>
        </div>
      </div>
    </footer>
  );
}
