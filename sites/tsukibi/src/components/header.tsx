import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "./logo";
import { goTo } from "./transition";

export function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

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
            <Link to="/" onClick={(e) => goTo(e, "/")} className="btn-ghost !px-5 !py-2.5">
              ← Начало
            </Link>
          ) : (
            <Link to="/menu" onClick={(e) => goTo(e, "/menu")} className={`${scrolled ? "btn-ember" : "btn-ghost"} !px-5 !py-2.5`}>
              <span>Виж менюто</span>
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
