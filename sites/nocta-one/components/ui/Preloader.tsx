"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { UI_COPY } from "@/lib/copy";
import { useUI } from "@/lib/store";

const R = 46;
const C = 2 * Math.PI * R;

/**
 * Thin cyan circle that fills while the counter runs 000 → 100. It never
 * finishes before the scene has really drawn its first frames.
 */
export function Preloader() {
  const ready = useUI((s) => s.loaded);
  const lang = useUI((s) => s.lang);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const state = useRef({ v: 0 });

  // creep up to 80 on time alone
  useEffect(() => {
    const t = gsap.to(state.current, {
      v: 80,
      duration: 2.2,
      ease: "power2.out",
      onUpdate: draw,
    });
    return () => void t.kill();
  }, []);

  // then finish once the canvas is live
  useEffect(() => {
    if (!ready) return;
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(state.current, { v: 100, duration: 0.7, ease: "power2.inOut", onUpdate: draw })
      .to(root.current, { opacity: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.15")
      .to(root.current?.querySelector(".pre-inner") ?? {}, { scale: 1.12, filter: "blur(8px)", duration: 0.8, ease: "power2.in" }, "<");
    return () => void tl.kill();
  }, [ready]);

  function draw() {
    const v = state.current.v;
    if (num.current) num.current.textContent = String(Math.round(v)).padStart(3, "0");
    if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - v / 100));
  }

  if (gone) return null;
  return (
    <div ref={root} className="preloader fixed inset-0 z-50 grid place-items-center">
      <div className="pre-inner flex flex-col items-center gap-6">
        <div className="relative grid h-[120px] w-[120px] place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r={R} className="pre-track" />
            <circle ref={ring} cx="50" cy="50" r={R} className="pre-ring" strokeDasharray={C} strokeDashoffset={C} />
          </svg>
          <span ref={num} className="mono pre-num">000</span>
        </div>
        <span className="mono text-ink-35">
          NOCTA ONE · {UI_COPY.loading[lang]}
        </span>
      </div>
    </div>
  );
}
