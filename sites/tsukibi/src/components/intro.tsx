import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const KEY = "tsukibi-intro";

/**
 * Интро при първо отваряне в сесията: луната се изчертава, пламъкът пламва,
 * буквите излизат, после завесата се разделя. onDone пуска анимацията на hero-то.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [skip] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });
  const [gone, setGone] = useState(skip);

  useLayoutEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    document.documentElement.style.overflow = "hidden";
    const el = ref.current!;
    const counter = el.querySelector<HTMLSpanElement>("[data-count]")!;
    const n = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setGone(true);
      },
    });
    tl.to(n, { v: 100, duration: 2.2, ease: "power2.inOut", onUpdate: () => (counter.textContent = String(Math.round(n.v)).padStart(3, "0")) }, 0)
      .fromTo("[data-moon]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 0.1)
      .to("[data-moon-fill]", { opacity: 1, duration: 0.6 }, 1.1)
      .to("[data-moon]", { opacity: 0.2, duration: 0.6 }, 1.1)
      .fromTo("[data-fire]", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(2.5)", transformOrigin: "50% 100%" }, 1.3)
      .fromTo("[data-letter]", { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 }, 1.2)
      .fromTo("[data-sub]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 1.7)
      .add(onDone, 2.45)
      .to("[data-content]", { opacity: 0, scale: 0.94, duration: 0.5, ease: "power2.in" }, 2.4)
      .to("[data-panel='top']", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.6)
      .to("[data-panel='bottom']", { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, 2.6);
    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={ref} className="fixed inset-0 z-[90]" aria-hidden="true">
      <div data-panel="top" className="absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div data-panel="bottom" className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
      <div data-content className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 64 64" className="h-28 w-28 text-bone md:h-36 md:w-36">
            <defs>
              <mask id="intro-mask">
                <rect width="64" height="64" fill="#fff" />
                <circle cx="41" cy="25" r="21" fill="#000" />
              </mask>
            </defs>
            <circle data-moon cx="31" cy="33" r="23" fill="none" stroke="currentColor" strokeWidth="0.6" pathLength={1} strokeDasharray="1" />
            <circle data-moon-fill cx="31" cy="33" r="23" fill="currentColor" mask="url(#intro-mask)" opacity="0" />
            <path data-fire d="M41 50c-6.6 0-10-5.6-7.6-10.8 1.4-3 4-4.2 3.7-8.4 4 2.4 5 5 4.6 7.6 2-1 3-3 3-5.6 3.6 3 4.7 7.6 3.7 11.2-1 3.6-3.6 6-7.4 6z" fill="#ff5b24" />
          </svg>
          <div className="mt-8 flex overflow-hidden font-display text-4xl tracking-[0.45em] text-bone md:text-5xl">
            {"TSUKIBI".split("").map((c, i) => (
              <span key={i} data-letter className="inline-block">{c}</span>
            ))}
          </div>
          <p data-sub className="mt-4 text-[0.65rem] uppercase tracking-[0.5em] text-muted">Луна и огън · 月火</p>
        </div>
        <span data-count className="absolute bottom-8 right-8 font-display text-6xl tabular-nums text-bone/20 md:text-8xl">000</span>
      </div>
    </div>
  );
}
