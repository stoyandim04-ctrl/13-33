import { useEffect, useRef, useState } from "react";
import { euro, products } from "../data/products";
import { useStore } from "../lib/store";
import { Spinner } from "./spinner";

/*
  Гардеробът — дрехите висят на релса в профил. Посочиш ли една, тя се
  обръща с лице към теб (истински кадри от завъртането, не наклонена снимка),
  а съседните се отдръпват. Клик я отваря във визьора.
  На допир: релсата се плъзга хоризонтално и дрехите са леко обърнати към теб.
*/
export function Rail() {
  const { view } = useStore();
  const [hover, setHover] = useState<number | null>(null);
  const [canHover, setCanHover] = useState(true);
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const upd = () => setCanHover(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    // Кадрите се зареждат, когато релсата наближи екрана.
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    if (ref.current) io.observe(ref.current);
    return () => {
      mq.removeEventListener("change", upd);
      io.disconnect();
    };
  }, []);

  const label = hover !== null ? products[hover] : null;

  return (
    <section ref={ref} id="wardrobe" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="label text-blood">На релсата</p>
          <h2 className="mt-4 text-heading font-medium tracking-[-0.05em]">
            Гардеробът<span className="serif-i text-blood">.</span>
          </h2>
          <p className="mt-5 max-w-md text-lead text-ink-2">Осем дрехи, закачени една до друга. Посочи една — ще се обърне към теб.</p>
        </div>

        <div className="relative mt-16">
          {/* Релсата */}
          <div className="absolute inset-x-0 top-[14px] z-10 flex items-center sm:inset-x-[4%]">
            <span className="h-5 w-2 rounded-sm bg-ink/70" />
            <span className="h-[5px] flex-1 rounded-full bg-gradient-to-b from-[#d8d3ca] via-[#9b958c] to-[#6e6a63] shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />
            <span className="h-5 w-2 rounded-sm bg-ink/70" />
          </div>

          <ul
            className={`relative flex items-start ${canHover ? "justify-center" : "snap-x snap-mandatory gap-2 overflow-x-auto px-[20vw] pb-4"}`}
            onMouseLeave={() => setHover(null)}
          >
            {products.map((p, i) => {
              const on = hover === i;
              const turn = canHover ? (on ? 0 : 0.25) : 0.06;
              return (
                <li
                  key={p.slug}
                  className="relative shrink-0 snap-center transition-[width,margin] duration-700 ease-[var(--ease-out-expo)]"
                  style={{
                    width: canHover ? (on ? "clamp(220px, 22vw, 340px)" : hover === null ? "clamp(78px, 8.4vw, 126px)" : "clamp(64px, 6.6vw, 104px)") : "56vw",
                  }}
                  onMouseEnter={() => canHover && setHover(i)}
                >
                  <button type="button" className="group block w-full outline-none" onClick={() => view(i)} aria-label={`${p.name} — ${p.kind}, ${euro(p.price)}`}>
                    <Hanger />
                    <div
                      className="relative -mt-3 transition-transform duration-700 ease-[var(--ease-out-expo)]"
                      style={{
                        height: "clamp(300px, 34vw, 500px)",
                        transform: on ? "translateY(-4px)" : "translateY(0)",
                        transformOrigin: "50% 0",
                      }}
                    >
                      {near ? (
                        <Spinner product={p} mode="none" turn={turn} align="top" className="pointer-events-none absolute left-1/2 top-0 h-full w-[clamp(220px,22vw,340px)] -translate-x-1/2" />
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex h-16 flex-col items-center justify-start text-center">
            {label ? (
              <div key={label.slug} style={{ animation: "fade-in .4s var(--ease-out-expo) both" }}>
                <p className="text-title font-medium tracking-tight">{label.name}</p>
                <p className="label mt-1 text-muted">
                  {label.kind} · {euro(label.price)} · натисни, за да разгледаш
                </p>
              </div>
            ) : (
              <p className="label text-muted">{canHover ? "Посочи дреха" : "Плъзни релсата · натисни дреха"}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Hanger() {
  return (
    <svg viewBox="0 0 60 40" className="relative z-20 mx-auto block h-10 w-14" aria-hidden>
      <path d="M30 4c-3 0-5 2-5 4.5S27 12 30 13" fill="none" stroke="#5b5650" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 13v6" stroke="#5b5650" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="26.5" y="18" width="7" height="22" rx="2.5" fill="#6b4a33" />
    </svg>
  );
}
