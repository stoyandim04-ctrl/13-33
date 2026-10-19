"use client";

import { useEffect, useRef } from "react";
import { useUI } from "@/lib/store";

/** Small cyan ring; becomes [ DRAG ] over the product when it can be turned. */
export function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const mode = useUI((s) => s.cursor);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.current?.classList.add("is-on");
    };
    const down = () => el.current?.classList.add("is-down");
    const up = () => el.current?.classList.remove("is-down");
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      if (el.current) el.current.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={el} className={`cursor ${mode === "drag" ? "is-drag" : ""}`} aria-hidden>
      <span className="cursor-ring" />
      <span className="cursor-label mono">[ DRAG ]</span>
    </div>
  );
}
