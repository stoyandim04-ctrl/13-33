"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { markReady, preload, preloadList, prefersReducedMotion } from "@/lib/film";

const MIN_SECONDS = 2.6;

/** Black screen, a copper line filling with the real load, 0000 → 1903, then the curtain. */
export default function Preloader({ onOpen }: { onOpen: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const reduced = prefersReducedMotion();
    let target = 0;
    let shown = 0;
    let loaded = false;
    let finished = false;
    const start = performance.now();

    preload(preloadList(), (p) => (target = p)).then(() => (loaded = true));

    gsap.set(q("[data-slit]"), { yPercent: -50, scaleX: 144 / window.innerWidth });
    gsap.fromTo(q("[data-in]"), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" });

    const tick = () => {
      const cap = Math.min(1, (performance.now() - start) / 1000 / MIN_SECONDS);
      shown += (Math.min(target, cap) - shown) * 0.08;
      if (loaded && cap >= 1 && target - shown < 0.004) shown = 1;
      fill.current!.style.transform = `scaleX(${shown})`;
      count.current!.textContent = String(Math.round(shown * 1903)).padStart(4, "0");
      if (shown === 1 && !finished) {
        finished = true;
        gsap.ticker.remove(tick);
        open();
      }
    };
    gsap.ticker.add(tick);

    let tl: gsap.core.Timeline | undefined;
    function open() {
      tl = gsap.timeline({ onComplete: () => setGone(true) });
      if (reduced) {
        tl.call(() => {
          markReady();
          onOpen();
        }).to(el, { opacity: 0, duration: 0.8, ease: "power2.out" });
        return;
      }
      tl.to(q("[data-count]"), { opacity: 0, filter: "blur(10px)", y: -8, duration: 0.8, ease: "power2.in" }, 0.15)
        .to(q("[data-label]"), { opacity: 0, duration: 0.6 }, 0.15)
        .set(q("[data-slit]"), { opacity: 1 }, 0.55)
        .set(q("[data-track]"), { opacity: 0 }, 0.55)
        .to(q("[data-slit]"), { scaleX: 1, duration: 1.4, ease: "expo.inOut" }, 0.55)
        .to(q("[data-slit]"), { boxShadow: "0 0 24px 2px rgba(242,230,220,0.55), 0 0 90px 10px rgba(201,145,122,0.35)", duration: 0.9 }, 1.1)
        .call(() => {
          markReady();
          onOpen();
        }, [], 1.6)
        .to(q("[data-top]"), { yPercent: -100, duration: 1.8, ease: "power4.inOut" }, 1.6)
        .to(q("[data-bottom]"), { yPercent: 100, duration: 1.8, ease: "power4.inOut" }, 1.6)
        .to(q("[data-slit]"), { opacity: 0, scaleY: 6, filter: "blur(6px)", duration: 1.2, ease: "power2.out" }, 1.9);
    }

    return () => {
      gsap.ticker.remove(tick);
      tl?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100]" aria-busy="true" aria-label="Зареждане">
      <div data-top className="absolute inset-x-0 top-0 h-1/2 bg-obsidian" />
      <div data-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-obsidian" />

      <div
        data-slit
        className="absolute left-0 top-1/2 h-px w-full bg-petal opacity-0"
      />

      <div data-in className="absolute inset-0 flex flex-col items-center justify-center">
        <span data-label className="label mb-10 text-petal/40">
          Розовата долина
        </span>
        <div data-track className="relative h-px w-36 overflow-hidden bg-petal/10">
          <div ref={fill} className="absolute inset-0 origin-left bg-copper" style={{ transform: "scaleX(0)" }} />
        </div>
        <span data-count className="numeral mt-8 text-[3.25rem] text-petal/80 tabular-nums">
          <span ref={count}>0000</span>
        </span>
      </div>
    </div>
  );
}
