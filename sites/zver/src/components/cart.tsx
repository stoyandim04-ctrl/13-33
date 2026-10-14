import { useEffect, useState } from "react";
import { FLAVOURS } from "../data/flavours";
import { lockScroll } from "../lib/scroll";
import { money, priceOf, useStore } from "../lib/store";

export function Cart() {
  const { cart, remove, cartOpen, setCartOpen, total } = useStore();
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    lockScroll(cartOpen);
    if (!cartOpen) setCheckout(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    if (cartOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  return (
    <div className={`fixed inset-0 z-[80] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Количка"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md on-light flex-col border-l-[3px] border-black bg-bone text-black transition-transform duration-500 ease-[var(--ease-out-expo)] ${cartOpen ? "" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b-[3px] border-black p-5">
          <p className="display text-title">Количка</p>
          <button type="button" className="slab label bg-bone px-3 py-2" onClick={() => setCartOpen(false)}>
            Затвори ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {cart.length === 0 && <li className="p-5 text-lead font-medium opacity-70">Празна е. Звярът чака.</li>}
          {cart.map((l, n) => {
            const f = FLAVOURS.find((x) => x.id === l.flavour) ?? FLAVOURS[0];
            return (
              <li key={`${l.flavour}-${l.pack}`} className="flex items-center gap-4 border-b-[3px] border-black p-5">
                <span className="h-14 w-8 shrink-0 border-[3px] border-black" style={{ background: f.can }} />
                <div className="flex-1">
                  <p className="display leading-none">{f.name}</p>
                  <p className="label mt-1 opacity-70">
                    {l.qty} × кашон {l.pack}
                  </p>
                </div>
                <p className="font-bold tabular-nums">{money(priceOf(l.pack) * l.qty)}</p>
                <button type="button" className="label underline" onClick={() => remove(n)} aria-label={`Махни ${f.name}`}>
                  Махни
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t-[3px] border-black p-5">
          <div className="flex items-end justify-between">
            <span className="label">Общо</span>
            <span className="display text-title tabular-nums">{money(total)}</span>
          </div>
          {checkout ? (
            <p className="mt-4 border-[3px] border-black bg-black p-4 text-body font-semibold text-bone" role="status">
              Тук плащането би отворило Stripe. ЗВЯР е концепция на 13:33 — нищо не се таксува и нищо не се изпраща.
            </p>
          ) : (
            <button type="button" disabled={!cart.length} className="btn-main mt-4 w-full justify-center disabled:opacity-40" onClick={() => setCheckout(true)}>
              Към плащане
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
