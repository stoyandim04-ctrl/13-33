import { useEffect, useState } from "react";
import { nav, site } from "../data/content";
import { scrollToHash } from "../lib/motion";

export function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const day = document.getElementById("pristigane");
    const onScroll = () => {
      const edge = day ? day.offsetTop + day.offsetHeight - 80 : 80;
      setSolid(window.scrollY > edge);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-700 ${
        solid ? "border-b border-line bg-paper/85 text-ink backdrop-blur-md" : "border-b border-transparent text-cream"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <a href="#pristigane" onClick={(e) => go(e, "#pristigane")} className="flex items-baseline gap-3">
          <span className="font-display text-[1.7rem] font-medium leading-none tracking-[-0.01em]">{site.name}</span>
          <span className="eyebrow hidden text-[0.6rem] opacity-70 sm:inline">{site.tagline} · концепция</span>
        </a>
        <nav aria-label="Основна навигация" className="flex items-center gap-5 text-[0.82rem] font-medium md:gap-9">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => go(e, n.href)}
              className="hidden opacity-80 transition-opacity hover:opacity-100 md:inline"
            >
              {n.label}
            </a>
          ))}
          <a
            href="#zapitvane"
            onClick={(e) => go(e, "#zapitvane")}
            className={`px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] uppercase transition-colors duration-500 ${
              solid ? "bg-accent text-cream hover:bg-ink" : "bg-brass text-night hover:bg-cream"
            }`}
          >
            Запази оглед
          </a>
        </nav>
      </div>
    </header>
  );
}
