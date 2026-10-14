import { useRef, useState } from "react";
import { FLAVOURS, PACKS } from "../data/flavours";
import { money, useStore } from "../lib/store";
import { stageRef } from "../lib/stage-ref";
import { Eyebrow } from "./bits";

export function Shop() {
  const { sel, setSel, add, setCartOpen } = useStore();
  const f = FLAVOURS[sel];
  const [pack, setPack] = useState<number>(12);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const drag = useRef<{ x: number; spin: number } | null>(null);
  const price = PACKS.find((p) => p.size === pack)!.price;

  return (
    <section id="shop" data-stage="shop" className="relative md:h-[150svh]" aria-labelledby="shop-h">
      {/* Зад: името на вкуса и мястото на кенчето. */}
      <div className="relative h-[58svh] overflow-hidden md:sticky md:top-0 md:h-svh">
        <div className="absolute inset-x-0 top-0 h-[58svh] md:top-0 md:right-[min(500px,44vw)] md:h-full">
          <p className="display outline-text pointer-events-none absolute inset-0 z-0 grid place-items-center text-center text-[clamp(4rem,15vw,15rem)] leading-[0.8] select-none" aria-hidden>
            {f.name.split(" ")[0]}
          </p>
          <div data-anchor="shop" className="absolute top-[56%] left-1/2 h-[40svh] w-[26svh] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:h-[72svh] md:w-[40svh]" aria-hidden />
        </div>
      </div>

      {/* Пред: дърпане за завъртане + картата. */}
      <div className="relative z-20 -mt-[58svh] flex flex-col gap-6 px-4 pb-16 sm:px-8 md:sticky md:top-0 md:-mt-[100svh] md:h-svh md:flex-row md:items-center md:gap-10 md:pt-16 md:pb-0">
        <div
          className="relative h-[58svh] cursor-grab touch-pan-y active:cursor-grabbing md:h-full md:flex-1"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, spin: stageRef.current?.shopSpin ?? 0 };
          }}
          onPointerMove={(e) => {
            if (!drag.current || !stageRef.current) return;
            stageRef.current.shopSpin = drag.current.spin + (e.clientX - drag.current.x) * 0.012;
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          role="img"
          aria-label={`Кенче ${f.name}. Дръпни, за да го завъртиш.`}
        >
          <p className="label absolute bottom-2 left-0 md:bottom-8">← Дръпни кенчето →</p>
        </div>

        <div className="slab on-light relative z-20 w-full bg-bone p-5 text-black hover:transform-none hover:shadow-[6px_6px_0_#0a0a0a] sm:p-7 md:w-[min(460px,40vw)]">
          <Eyebrow n="05">Купи · 500 мл · кашон</Eyebrow>
          <h2 id="shop-h" key={f.id} className="display slam-in mt-4 text-title">
            {f.name}
          </h2>
          <p className="mt-1 text-body font-semibold opacity-70">{f.fruit}</p>

          <p className="label mt-6 mb-2">Вкус</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Вкус">
            {FLAVOURS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={i === sel}
                onClick={() => setSel(i)}
                className={`label flex items-center gap-2 border-[3px] border-black px-2 py-2 text-left transition-transform ${i === sel ? "bg-black text-bone" : "hover:-translate-y-0.5"}`}
              >
                <span className="h-3.5 w-3.5 shrink-0 border-2 border-black" style={{ background: x.can, borderColor: i === sel ? "#f4f1ea" : undefined }} />
                <span className="truncate">{x.name}</span>
              </button>
            ))}
          </div>

          <p className="label mt-5 mb-2">Опаковка</p>
          <div className="grid grid-cols-3 border-[3px] border-black" role="radiogroup" aria-label="Опаковка">
            {PACKS.map((p, i) => (
              <button
                key={p.size}
                type="button"
                role="radio"
                aria-checked={p.size === pack}
                onClick={() => setPack(p.size)}
                className={`px-2 py-2.5 text-center ${i ? "border-l-[3px] border-black" : ""} ${p.size === pack ? "bg-black text-bone" : "hover:bg-black/5"}`}
              >
                <span className="display block text-lg leading-none">{p.size}</span>
                <span className="label mt-1 block opacity-70">{money(p.price / p.size)} / бр.</span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="flex items-center border-[3px] border-black">
              <button type="button" className="h-11 w-11 text-xl font-bold" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="По-малко">
                −
              </button>
              <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button type="button" className="h-11 w-11 text-xl font-bold" onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Повече">
                +
              </button>
            </div>
            <p className="display text-title tabular-nums">{money(price * qty)}</p>
          </div>

          <button
            type="button"
            className="btn-main mt-5 w-full justify-center"
            onClick={() => {
              add({ flavour: f.id, pack, qty });
              stageRef.current?.kick(0.6);
              setAdded(true);
              setTimeout(() => setAdded(false), 1600);
              setTimeout(() => setCartOpen(true), 350);
            }}
          >
            {added ? "Вътре е ✓" : `Добави ${pack} × ${f.name}`}
          </button>
          <p className="label mt-4 opacity-60">Концепция на 13:33 — нищо не се продава и не се доставя.</p>
        </div>
      </div>
    </section>
  );
}
