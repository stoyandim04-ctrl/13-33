import { useEffect, useState } from "react";
import { euro, products } from "../data/products";
import { lockScroll } from "../hooks/use-lenis";
import { bySlug, useStore } from "../lib/store";

/* Хедър, лента, количка и футър — „рамката“ около сцените. */

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-[-0.04em] ${className}`}>
      <svg viewBox="0 0 12 24" className="h-[1.05em] w-auto" aria-hidden>
        <path d="M6 0 L7.2 10 L6 24 L4.8 10 Z" fill="currentColor" />
        <path d="M1 9.2 L11 9.2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      VAELO
    </span>
  );
}

export function Header() {
  const { count, setCartOpen } = useStore();
  const [menu, setMenu] = useState(false);
  const [bump, setBump] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 500);
    return () => window.clearTimeout(t);
  }, [count]);

  useEffect(() => {
    if (!menu) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [menu]);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const links = [
    ["#top", "Орбита"],
    ["#wardrobe", "Гардеробът"],
    ["#collection", "Колекцията"],
    ["#atelier", "Ателието"],
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-colors duration-500 ${solid ? "bg-bone/80 backdrop-blur-md" : ""}`}
        style={{ animation: "fade-in 1s var(--ease-out-expo) .4s both" }}
      >
        <div className="mx-auto grid max-w-[1500px] grid-cols-3 items-center px-4 py-4 sm:px-8">
          <button type="button" className="label flex items-center gap-2.5 justify-self-start" onClick={() => setMenu(true)} aria-expanded={menu}>
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden>
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-2/3 bg-current" />
            </span>
            Меню
          </button>
          <a href="#top" className="justify-self-center text-lg" aria-label="VAELO — начало">
            <Logo />
          </a>
          <button type="button" className="label flex items-center gap-2 justify-self-end" onClick={() => setCartOpen(true)}>
            Количка
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] tabular-nums transition-all duration-500 ${count ? "bg-blood text-paper" : "bg-ink/10"} ${bump ? "scale-125" : "scale-100"}`}
            >
              {count}
            </span>
          </button>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-[110] flex bg-ink text-paper" style={{ animation: "fade-in .4s var(--ease-out-expo) both" }} role="dialog" aria-modal="true" aria-label="Меню">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col px-4 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <Logo className="text-lg" />
              <button type="button" className="label link-line" onClick={() => setMenu(false)}>
                Затвори ×
              </button>
            </div>
            <nav className="my-auto flex flex-col gap-1">
              {links.map(([href, l], i) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenu(false)}
                  className="group flex items-baseline gap-5 overflow-hidden text-heading font-medium tracking-[-0.05em]"
                >
                  <span className="label w-8 text-paper/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-4" style={{ animation: `rise .9s var(--ease-out-expo) ${0.05 * i}s both` }}>
                    {l}
                  </span>
                </a>
              ))}
            </nav>
            <p className="label text-paper/40">София · Колекция 001 · Концептуален проект</p>
          </div>
        </div>
      )}
    </>
  );
}

export function Marquee() {
  const words = ["Шито в София", "Колекция 001", "Безтегловност", "Малки серии", "Всеки ъгъл е лице"];
  const row = (
    <div className="flex shrink-0 items-center">
      {words.map((w) => (
        <span key={w} className="label flex items-center gap-8 px-8">
          {w} <span aria-hidden>✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-blood py-3.5 text-paper" aria-hidden>
      <div className="flex w-max" style={{ animation: "marquee 28s linear infinite" }}>
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  );
}

export function Cart() {
  const { cartOpen, setCartOpen, lines, setQty, total, view } = useStore();
  const [note, setNote] = useState(false);

  useEffect(() => {
    if (!cartOpen) {
      setNote(false);
      return;
    }
    const k = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", k);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", k);
      lockScroll(false);
    };
  }, [cartOpen, setCartOpen]);

  return (
    <div className={`fixed inset-0 z-[120] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div className={`absolute inset-0 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-500 ${cartOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside
        role="dialog"
        aria-label="Количка"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper transition-[transform,box-shadow] duration-700 ease-[var(--ease-out-expo)] ${cartOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="label">Количка</p>
          <button type="button" className="label link-line" onClick={() => setCartOpen(false)}>
            Затвори ×
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-title font-medium tracking-tight">Още е празна.</p>
            <p className="text-muted">Избери дреха от орбитата или от гардероба.</p>
            <button type="button" className="btn-ghost mt-2" onClick={() => setCartOpen(false)}>
              Към колекцията
            </button>
          </div>
        ) : (
          <>
            <ul data-lenis-prevent className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((l) => {
                const p = bySlug(l.slug)!;
                return (
                  <li key={l.slug + l.size} className="flex gap-4 py-5">
                    <button
                      type="button"
                      className="h-28 w-22 shrink-0 rounded-xl bg-bone-2 p-2"
                      onClick={() => {
                        setCartOpen(false);
                        view(products.findIndex((x) => x.slug === p.slug));
                      }}
                      aria-label={`Разгледай ${p.name}`}
                    >
                      <img src={`img/p/${p.slug}.webp`} alt="" className="h-full w-full object-contain" />
                    </button>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted">
                            {p.kind} · {l.size}
                          </p>
                        </div>
                        <p className="font-medium tabular-nums">{euro(p.price * l.qty)}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-line">
                          <button type="button" className="grid h-8 w-8 place-items-center" onClick={() => setQty(l.slug, l.size, l.qty - 1)} aria-label="Едно по-малко">
                            −
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                          <button type="button" className="grid h-8 w-8 place-items-center" onClick={() => setQty(l.slug, l.size, l.qty + 1)} aria-label="Още едно">
                            +
                          </button>
                        </div>
                        <button type="button" className="label link-line text-muted" onClick={() => setQty(l.slug, l.size, 0)}>
                          Махни
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="label text-muted">Общо</span>
                <span className="text-title font-medium tabular-nums">{euro(total)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">Доставката се изчислява на следващата стъпка.</p>
              <button type="button" className="btn-primary mt-5 w-full" onClick={() => setNote(true)}>
                Към плащане
              </button>
              {note && (
                <p className="mt-3 text-center text-sm text-blood" role="status">
                  Това е концепция — плащането не е включено и нищо не се поръчва.
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-20 text-paper">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="label text-paper/40">Ателие</p>
          <p className="mt-3 text-paper/80">ул. „Измислена“ 13, София</p>
          <p className="text-paper/80">Пон–Съб · 11:00–19:00</p>
        </div>
        <div>
          <p className="label text-paper/40">Разгледай</p>
          <ul className="mt-3 space-y-1 text-paper/80">
            <li><a className="link-line" href="#top">Орбита</a></li>
            <li><a className="link-line" href="#wardrobe">Гардеробът</a></li>
            <li><a className="link-line" href="#collection">Колекцията</a></li>
          </ul>
        </div>
        <div>
          <p className="label text-paper/40">Бюлетин</p>
          <p className="mt-3 text-paper/80">Пишем само когато има нова серия.</p>
          <form
            className="mt-4 flex border-b border-paper/30 focus-within:border-paper"
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              (f.querySelector("button") as HTMLButtonElement).textContent = "Концепция — не изпращаме нищо";
            }}
          >
            <input type="email" required placeholder="твоят имейл" aria-label="Имейл" className="min-w-0 flex-1 bg-transparent py-3 text-paper outline-none placeholder:text-paper/40" />
            <button type="submit" className="label shrink-0 text-paper/80 hover:text-paper">
              Запиши ме →
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-[1500px] px-4 sm:px-8">
        <p className="select-none text-center text-[clamp(5rem,1rem+24vw,26rem)] font-semibold leading-[0.78] tracking-[-0.07em] text-paper">VAELO</p>
      </div>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-2 border-t border-paper/10 px-4 py-5 text-paper/40 sm:flex-row sm:justify-between sm:px-8">
        <p className="label">Концептуален проект на 13:33 — брандът, дрехите и цените са измислени</p>
        <p className="label">Снимки и завъртания: генерирани с AI</p>
      </div>
    </footer>
  );
}
