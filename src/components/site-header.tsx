import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";

import { useContent } from "@/data/content";
import { useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RainbowLink } from "@/components/ui/rainbow-button";

/** On the home page anchors stay anchors; elsewhere they lead home first. */
const toHome = (hash: string, onHome: boolean) => (onHome ? hash : `/${hash}`);

export function SiteHeader() {
  const { pathname } = useLocation();
  const { nav } = useContent();
  const { lang, setLang, tr } = useLang();
  const onHome = pathname === "/";
  const onStart = pathname === "/zapochni";
  const [open, setOpen] = React.useState(false);
  const [solid, setSolid] = React.useState(false);
  const menuButton = React.useRef<HTMLButtonElement>(null);
  const firstLink = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change, Escape; lock page scroll while the sheet is open.
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switcher = (className?: string) => (
    <div className={cn("flex items-center gap-1 text-[0.8125rem] font-medium", className)} role="group" aria-label={tr("Смени езика")}>
      {(["bg", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase tracking-[0.12em] transition-colors",
            lang === l ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <a
        href="#main"
        className="bg-foreground text-background fixed top-3 left-3 z-[300] -translate-y-20 rounded-full px-4 py-2 text-sm font-medium focus:translate-y-0"
      >
        {tr("Към съдържанието")}
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[200] transition-[background-color,backdrop-filter,border-color] duration-500",
          solid && !open
            ? "bg-background/90 border-border border-b"
            : "border-b border-transparent",
        )}
      >
        <div className="container-wide flex h-16 items-center justify-between px-5 sm:px-8 md:h-[4.5rem] lg:px-14">
          <Link to="/" className="flex items-baseline gap-2.5" aria-label={tr("13:33 — Digital Studio, начало")}>
            <span className="font-display text-[1.375rem] font-[650] tracking-[-0.03em]">13:33</span>
            <span className="text-label text-muted-foreground hidden tracking-[0.22em] uppercase sm:inline">
              Digital Studio
            </span>
          </Link>

          <nav aria-label={tr("Основна навигация")} className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={toHome(item.href, onHome)} className="nav-link text-[0.9375rem]">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {switcher("hidden lg:flex")}
            {/* On the phone the other language is one tap away, always visible. */}
            <button
              type="button"
              onClick={() => setLang(lang === "bg" ? "en" : "bg")}
              aria-label={lang === "bg" ? "Switch to English" : "Превключи на български"}
              className="text-muted-foreground hover:text-foreground border-border grid h-9 min-w-9 place-items-center rounded-full border px-2 text-[0.75rem] font-semibold tracking-[0.1em] uppercase transition-colors lg:hidden"
            >
              {lang === "bg" ? "en" : "bg"}
            </button>
            {onStart ? null : (
              <RainbowLink to="/zapochni" size="sm" data-ping="start-header">
                {tr("Започни проект")}
                <ArrowRight aria-hidden="true" className="hidden size-3.5 sm:block" />
              </RainbowLink>
            )}
            <button
              ref={menuButton}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? tr("Затвори менюто") : tr("Отвори менюто")}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 grid size-11 place-items-center rounded-full lg:hidden"
            >
              {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="bg-background fixed inset-0 z-[190] flex flex-col px-5 pt-24 pb-10 sm:px-8 lg:hidden"
      >
        <nav aria-label={tr("Мобилна навигация")}>
          <ul>
            {nav.map((item, i) => (
              <li key={item.href} className="hairline">
                <a
                  ref={i === 0 ? firstLink : undefined}
                  href={toHome(item.href, onHome)}
                  onClick={() => setOpen(false)}
                  className="font-display block py-5 text-[2.5rem] leading-none font-[300] tracking-[-0.03em]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-5">
          {switcher("justify-center")}
          <RainbowLink to="/zapochni" size="lg" className="w-full [&>span]:w-full [&>span]:justify-center" onClick={() => setOpen(false)} data-ping="start-menu">
            {tr("Започни проект")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </RainbowLink>
        </div>
      </div>
    </>
  );
}
