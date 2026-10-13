import { useEffect, useRef, useState } from "react";
import { products } from "../data/products";
import { useStore } from "../lib/store";
import { Spinner } from "./spinner";

/*
  „Всеки ъгъл“ — сцената се закача, а скролът завърта палтото един
  пълен оборот. Около нея се появяват бележки за това, което се вижда
  точно в този момент: лице → профил → гръб → обратно.
*/
const SLUG = "camel-coat";
const NOTES = [
  { at: 0.0, k: "Лице", t: "Двуредно закопчаване и широки ревери — палто, което стои отворено и затворено." },
  { at: 0.25, k: "Профил", t: "Ниско рамо и обем, който пада право надолу, без да те прави по-широк." },
  { at: 0.5, k: "Гръб", t: "Шлиц по средата — крачката остава свободна до коляното." },
  { at: 0.75, k: "Материя", t: "Вълна и кашмир, 80/20. Мек на допир, топъл без тежест." },
];

export function Turn() {
  const { view } = useStore();
  const sec = useRef<HTMLElement>(null);
  const [turn, setTurn] = useState(0);
  const [prog, setProg] = useState(0);
  const idx = products.findIndex((p) => p.slug === SLUG);
  const p = products[idx];

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = sec.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const pr = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
        setProg(pr);
        setTurn(pr * 1.0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phase = ((turn % 1) + 1) % 1;
  const active = NOTES.reduce((best, n, i) => {
    const d = Math.min(Math.abs(phase - n.at), 1 - Math.abs(phase - n.at));
    const bd = Math.min(Math.abs(phase - NOTES[best].at), 1 - Math.abs(phase - NOTES[best].at));
    return d < bd ? i : best;
  }, 0);

  return (
    <section ref={sec} className="relative h-[320vh] bg-ink text-paper">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* Огромното 360° зад дрехата */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="text-display font-semibold tracking-[-0.07em] text-paper/[0.06]"
            style={{ transform: `translateX(${(0.5 - prog) * 30}vw)` }}
          >
            360°
          </span>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/40 blur-[120px]" />

        <div className="relative mx-auto flex w-full max-w-[1500px] items-start justify-between px-4 pt-24 sm:px-8 sm:pt-28">
          <div>
            <p className="label text-paper/50">Всеки ъгъл</p>
            <h2 className="mt-3 max-w-[12ch] text-title font-medium tracking-[-0.03em] sm:text-[clamp(2rem,1rem+2.6vw,3.75rem)]">
              Скролвай — <span className="serif-i text-[#e2a3ad]">тя се върти.</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="label text-paper/50">Ъгъл</p>
            <p className="mt-2 font-medium tabular-nums text-title">{Math.round(phase * 360)}°</p>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <Spinner product={p} mode="none" turn={turn} className="h-[min(62svh,560px)] w-[min(80vw,480px)]" />

          {/* Бележките — ляво/дясно на дрехата */}
          <ul className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto grid max-w-[1500px] grid-cols-2 gap-4 px-4 sm:inset-y-0 sm:flex sm:items-center sm:justify-between sm:px-8">
            {[0, 1].map((side) => (
              <li key={side} className={`flex flex-col gap-6 ${side ? "sm:items-end sm:text-right" : ""}`}>
                {NOTES.filter((_, i) => i % 2 === side).map((n) => {
                  const on = NOTES[active] === n;
                  return (
                    <div
                      key={n.k}
                      className="max-w-[17rem] transition-all duration-700 ease-[var(--ease-out-expo)]"
                      style={{ opacity: on ? 1 : 0.18, transform: `translateY(${on ? 0 : 10}px)` }}
                    >
                      <p className={`label ${on ? "text-[#e2a3ad]" : "text-paper/60"}`}>
                        {String(NOTES.indexOf(n) + 1).padStart(2, "0")} · {n.k}
                      </p>
                      <p className="mt-2 hidden text-body text-paper/80 sm:block">{n.t}</p>
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto flex w-full max-w-[1500px] items-center justify-between gap-6 px-4 pb-8 sm:px-8">
          <div className="h-px flex-1 bg-paper/15">
            <div className="h-px bg-paper" style={{ width: `${prog * 100}%` }} />
          </div>
          <button type="button" className="label link-line text-paper" onClick={() => view(idx)}>
            {p.name} — разгледай →
          </button>
        </div>
      </div>
    </section>
  );
}
