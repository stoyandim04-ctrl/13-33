import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "./logo";
import { useCart } from "../lib/cart";
import { goTo } from "./transition";

export function Header() {
  const { count, setOpen, pulse } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!pulse) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [pulse]);

  const onMenu = pathname === "/menu";
  const link = "relative text-[0.8rem] font-medium tracking-[0.14em] uppercase text-bone/70 transition-colors hover:text-bone";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,padding] duration-500 ${
        scrolled || onMenu ? "bg-ink/70 py-3 backdrop-blur-xl" : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 md:px-10">
        <Link to="/" onClick={(e) => goTo(e, "/")} aria-label="Цукиби — начало">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Основна навигация">
          <NavLink to="/menu" onClick={(e) => goTo(e, "/menu")} className={({ isActive }) => `${link} ${isActive ? "!text-bone" : ""}`}>
            Меню
          </NavLink>
          <a href="/#ogan" onClick={(e) => goTo(e, "/#ogan")} className={link}>Огънят</a>
          <a href="/#omakase" onClick={(e) => goTo(e, "/#omakase")} className={link}>Омакасе</a>
          <a href="/#poseti" onClick={(e) => goTo(e, "/#poseti")} className={link}>Посети ни</a>
        </nav>

        <div className="flex items-center gap-3">
          {onMenu ? (
            <button
              type="button"
              data-cart-button
              onClick={() => setOpen(true)}
              className={`inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition-transform duration-300 hover:border-bone/50 ${bump ? "scale-110" : ""}`}
            >
              Поръчка
              <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs ${count ? "bg-ember text-ink" : "bg-coal-2 text-muted"}`}>
                {count}
              </span>
            </button>
          ) : (
            <Link to="/menu" onClick={(e) => goTo(e, "/menu")} className="btn-ember !px-5 !py-2.5">
              <span>Меню</span>
            </Link>
          )}
          <a href="/#poseti" onClick={(e) => goTo(e, "/#poseti")} className="btn-ghost hidden !px-5 !py-2.5 md:inline-flex">
            Резервирай
          </a>
        </div>
      </div>
    </header>
  );
}
