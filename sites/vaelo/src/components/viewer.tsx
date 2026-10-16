import { useEffect, useRef, useState } from "react";
import { euro, products, SIZES, type Size } from "../data/products";
import { lockScroll } from "../hooks/use-lenis";
import { useStore } from "../lib/store";
import { Spinner, type SpinnerHandle } from "./spinner";

/*
  Визьорът — цял екран, дрехата в средата се върти след курсора.
  Лице / Профил / Гръб го довъртат; ← → сменят дрехата; Esc затваря.
*/
export function Viewer() {
  const { viewing, view, add, setCartOpen } = useStore();
  const [size, setSize] = useState<Size | null>(null);
  const [warn, setWarn] = useState(false);
  const [added, setAdded] = useState(false);
  const [turn, setTurn] = useState(0);
  const spin = useRef<SpinnerHandle>(null);
  const open = viewing !== null;
  const i = viewing ?? 0;
  const p = products[i];

  useEffect(() => {
    setSize(null);
    setWarn(false);
    setAdded(false);
  }, [viewing]);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") view(null);
      if (e.key === "ArrowRight") view((i + 1) % products.length);
      if (e.key === "ArrowLeft") view((i - 1 + products.length) % products.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, i, view]);

  if (!open) return null;

  const face = turn < 0.125 || turn > 0.875 ? 0 : turn < 0.375 || turn > 0.625 ? 1 : 2;

  const onAdd = () => {
    if (!size) {
      setWarn(true);
      return;
    }
    add(p.slug, size);
    setAdded(true);
    window.setTimeout(() => {
      view(null);
      setCartOpen(true);
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${p.name} — ${p.kind}`}
      data-lenis-prevent
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-paper"
      style={{ animation: "fade-in .5s var(--ease-out-expo) both" }}
    >
      <div className="grain pointer-events-none fixed inset-0" />
      <div className="relative mx-auto grid min-h-full max-w-[1500px] grid-rows-[auto_1fr_auto] px-4 sm:px-8">
        <div className="flex items-center justify-between py-5">
          <span className="label text-muted">
            {String(i + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
          </span>
          <span className="label hidden text-muted sm:block">Колекция 001 · Безтегловност</span>
          <button type="button" className="label link-line flex items-center gap-2" onClick={() => view(null)}>
            Затвори <span aria-hidden className="text-base leading-none">×</span>
          </button>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,1.25fr)_1fr]">
          {/* Лява колона: името */}
          <div key={p.slug + "-t"} className="order-2 lg:order-1" style={{ animation: "fade-in .8s var(--ease-out-expo) both" }}>
            <p className="label text-blood">{p.kind}</p>
            <h2 className="mt-3 text-heading font-medium tracking-[-0.05em]">{p.name}</h2>
            <p className="mt-4 max-w-sm text-lead text-ink-2">{p.note}</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-4 w-4 rounded-full border border-line" style={{ background: p.swatch }} />
              <span className="label text-muted">{p.color}</span>
            </div>
          </div>

          {/* Средата: дрехата */}
          <div className="order-1 flex flex-col items-center lg:order-2">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-x-[12%] bottom-[2%] h-[6%] rounded-[50%] bg-ink/15 blur-2xl" />
              <Spinner
                key={p.slug}
                ref={spin}
                product={p}
                onTurn={setTurn}
                className="mx-auto aspect-[4/5] h-auto max-h-[68svh] w-full"
              />
            </div>
            <div className="mt-2 flex items-center gap-1 rounded-full border border-line bg-paper/70 p-1 backdrop-blur">
              {(["Лице", "Профил", "Гръб"] as const).map((l, k) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => spin.current?.goTo([0, 0.25, 0.5][k])}
                  className={`label rounded-full px-4 py-2 transition-colors duration-300 ${face === k ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="label mt-3 text-faint">{p.spin ? "Мести курсора или плъзни — дрехата се обръща след теб" : "Мести курсора над дрехата"}</p>
          </div>

          {/* Дясна колона: покупката */}
          <div key={p.slug + "-b"} className="order-3 flex flex-col gap-6 pb-10 lg:pb-0" style={{ animation: "fade-in .8s var(--ease-out-expo) .1s both" }}>
            <p className="text-title font-medium">{euro(p.price)}</p>
            <div>
              <div className="flex items-center justify-between">
                <span className="label text-muted">Размер</span>
                {warn && !size && <span className="label text-blood">Избери размер</span>}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`h-11 rounded-full border text-sm font-medium transition-all duration-300 ${
                      size === s ? "border-ink bg-ink text-paper" : warn ? "border-blood/50 hover:border-ink" : "border-line hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="btn-primary w-full" onClick={onAdd}>
              {added ? "Добавено ✓" : "Добави в количката"}
            </button>
            <dl className="divide-y divide-line border-y border-line text-body">
              <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
                <dt className="label pt-1 text-muted">Материя</dt>
                <dd>{p.fabric}</dd>
              </div>
              <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-3">
                <dt className="label pt-1 text-muted">Кройка</dt>
                <dd>{p.fit}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line py-5">
          <button type="button" className="label link-line" onClick={() => view((i - 1 + products.length) % products.length)}>
            ← {products[(i - 1 + products.length) % products.length].name}
          </button>
          <div className="hidden gap-2 sm:flex">
            {products.map((pr, k) => (
              <button
                key={pr.slug}
                type="button"
                aria-label={pr.name}
                onClick={() => view(k)}
                className={`h-14 w-11 rounded-md border transition-all duration-300 ${k === i ? "border-ink bg-bone" : "border-transparent opacity-50 hover:opacity-100"}`}
              >
                <img src={`img/p/${pr.slug}.webp`} alt="" className="h-full w-full object-contain p-1" />
              </button>
            ))}
          </div>
          <button type="button" className="label link-line" onClick={() => view((i + 1) % products.length)}>
            {products[(i + 1) % products.length].name} →
          </button>
        </div>
      </div>
    </div>
  );
}
