"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { isTouch } from "@/lib/film";

/**
 * A small dot. Over anything with `data-cursor="…"` it opens into a ring
 * carrying that word.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (isTouch()) return;
    setOn(true);
    document.documentElement.classList.add("has-cursor");
    const xd = gsap.quickTo(dot.current, "x", { duration: 0.15, ease: "power3.out" });
    const yd = gsap.quickTo(dot.current, "y", { duration: 0.15, ease: "power3.out" });
    const xr = gsap.quickTo(ring.current, "x", { duration: 0.6, ease: "expo.out" });
    const yr = gsap.quickTo(ring.current, "y", { duration: 0.6, ease: "expo.out" });
    let current = "";

    const move = (e: PointerEvent) => {
      xd(e.clientX);
      yd(e.clientY);
      xr(e.clientX);
      yr(e.clientY);
      const t = (e.target as Element | null)?.closest?.("[data-cursor]");
      const next = t?.getAttribute("data-cursor") ?? "";
      if (next !== current) {
        current = next;
        setLabel(next);
        gsap.to(ring.current, { scale: next ? 1 : 0, opacity: next ? 1 : 0, duration: 0.9, ease: "expo.out" });
        gsap.to(dot.current, { scale: next ? 0 : 1, duration: 0.5, ease: "expo.out" });
      }
    };
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.4 });
    const enter = () => gsap.to(dot.current, { opacity: 1, duration: 0.4 });

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[95]" style={{ opacity: on ? 1 : 0 }}>
      <div
        ref={dot}
        className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-petal mix-blend-difference"
      />
      <div
        ref={ring}
        className="absolute -left-12 -top-12 flex h-24 w-24 items-center justify-center rounded-full border border-petal/40 backdrop-blur-[2px]"
        style={{ transform: "scale(0)", opacity: 0 }}
      >
        <span className="label text-[0.5625rem] tracking-[0.28em] text-petal">{label}</span>
      </div>
    </div>
  );
}
