import { useEffect } from "react";
import Lenis from "lenis";

let lenis: Lenis | null = null;

/** Плавен скрол за цялата страница; котвите (#wardrobe…) се плъзгат плавно. */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: true });
    let raf = 0;
    const tick = (time: number) => {
      lenis?.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

/** Спира скрола на страницата отдолу, докато е отворен визьор/меню/количка. */
export function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (on) lenis?.stop();
  else lenis?.start();
}
