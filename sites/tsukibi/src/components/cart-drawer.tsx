import { useEffect, useState } from "react";
import { useCart } from "../lib/cart";
import { formatPrice } from "../data/menu";

export function CartDrawer() {
  const { open, setOpen, lines, total, change, clear } = useCart();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) setSent(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-[65] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Твоята поръчка"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-coal transition-transform duration-700 ease-out-expo ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="eyebrow">Вземи за вкъщи</p>
            <h2 className="mt-1 font-display text-3xl">Твоята поръчка</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-line text-xl hover:border-bone/50" aria-label="Затвори">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="mt-10 text-center text-muted">Още нищо. Избери чиния от менюто.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map(({ dish, qty }) => (
                <li key={dish.slug} className="flex items-center gap-4 py-4">
                  <img src={dish.image} alt="" className="h-16 w-16 shrink-0" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xl">{dish.name}</p>
                    <p className="text-sm text-muted">{formatPrice(dish.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => change(dish.slug, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-bone/50" aria-label={`Една порция по-малко ${dish.name}`}>−</button>
                    <span className="w-5 text-center tabular-nums">{qty}</span>
                    <button type="button" onClick={() => change(dish.slug, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:border-bone/50" aria-label={`Още една порция ${dish.name}`}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Общо</span>
            <span className="font-display text-3xl tabular-nums">{formatPrice(total)}</span>
          </div>
          {sent ? (
            <p className="mt-4 rounded-2xl bg-coal-2 p-4 text-sm leading-relaxed text-muted">
              Това е концептуален сайт — поръчката не се изпраща никъде. В истинския сайт тук идва плащане и час за вземане.
              <button type="button" onClick={() => { clear(); setOpen(false); }} className="mt-2 block text-ember underline-offset-4 hover:underline">
                Изчисти поръчката
              </button>
            </p>
          ) : (
            <button
              type="button"
              disabled={!lines.length}
              onClick={() => setSent(true)}
              className="btn-ember mt-4 w-full justify-center disabled:pointer-events-none disabled:opacity-40"
            >
              <span>Към плащане · вземане след 20 мин</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
