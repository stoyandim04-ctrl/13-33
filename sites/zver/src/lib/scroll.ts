import { useEffect, useRef, type RefObject } from "react";
import Lenis from "lenis";

let lenis: Lenis | null = null;

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: true });
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

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (on) lenis?.stop();
  else lenis?.start();
}

/**
 * Напредъкът на закачена секция (0 → 1, докато е закачена) — записва се
 * в --p на елемента всеки кадър, без да рисува React наново.
 */
export function useProgress<T extends HTMLElement>(onChange?: (p: number) => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const H = window.innerHeight;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - H)));
        if (Math.abs(p - last) > 0.0005) {
          last = p;
          el.style.setProperty("--p", p.toFixed(4));
          cb.current?.(p);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}
