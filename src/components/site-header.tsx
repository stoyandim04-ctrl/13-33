import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";

import { nav } from "@/data/content";
import { cn } from "@/lib/utils";

/** On the home page anchors stay anchors; elsewhere they lead home first. */
const toHome = (hash: string, onHome: boolean) => (onHome ? hash : `/${hash}`);

export function SiteHeader() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";
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

  return (
    <>
      <a
        href="#main"
        className="bg-foreground text-background fixed top-3 left-3 z-[300] -translate-y-20 rounded-full px-4 py-2 text-sm font-medium focus:translate-y-0"
      >
        Към съдържанието
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[200] transition-[background-color,backdrop-filter,border-color] duration-500",
          solid && !open
            ? "bg-background/70 border-border border-b backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        <div className="container-wide flex h-16 items-center justify-between px-5 sm:px-8 md:h-[4.5rem] lg:px-14">
          <Link to="/" className="flex items-baseline gap-2.5" aria-label="13:33 — Digital Studio, начало">
            <span className="font-display text-[1.375rem] font-[650] tracking-[-0.03em]">13:33</span>
            <span className="text-label text-muted-foreground hidden tracking-[0.22em] uppercase sm:inline">
              Digital Studio
            </span>
          </Link>

          <nav aria-label="Основна навигация" className="hidden md:block">
            <ul className="flex items-center gap-9">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={toHome(item.href, onHome)}
                    className="text-muted-foreground hover:text-foreground text-[0.9375rem] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={toHome("#kontakt", onHome)}
              className="text-foreground hover:text-ice hidden items-center gap-1.5 text-[0.9375rem] font-medium transition-colors md:inline-flex"
            >
              Започни проект
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <button
              ref={menuButton}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Затвори менюто" : "Отвори менюто"}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 grid size-11 place-items-center rounded-full md:hidden"
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
        className="bg-background fixed inset-0 z-[190] flex flex-col px-5 pt-24 pb-10 sm:px-8 md:hidden"
      >
        <nav aria-label="Мобилна навигация">
          <ul>
            {nav.map((item, i) => (
              <li key={item.href} className="hairline">
                <a
                  ref={i === 0 ? firstLink : undefined}
                  href={toHome(item.href, onHome)}
                  onClick={() => setOpen(false)}
                  className="font-display block py-5 text-[2.5rem] leading-none font-[500] tracking-[-0.03em]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={toHome("#kontakt", onHome)}
          onClick={() => setOpen(false)}
          className="bg-primary text-foreground mt-auto inline-flex h-14 items-center justify-center gap-2 rounded-full text-base font-semibold"
        >
          Започни проект
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
    </>
  );
}
