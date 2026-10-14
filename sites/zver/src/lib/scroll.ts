import { useEffect, useRef, type RefObject } from "react";
import Lenis from "lenis";

let lenis: Lenis | null = null;

/*
  Един цикъл за целия сайт. Всяка задача първо чете от DOM (размери, позиции)
  и връща функция, която пише (CSS променливи, WebGL кадър). Всички четения
  минават преди всички записи — иначе всеки запис кара следващото четене да
  преизчислява оформлението и кадрите се накъсват.
*/
type Job = (now: number) => (() => void) | void;
const jobs = new Set<Job>();
let raf = 0;

function loop(now: number) {
  lenis?.raf(now);
  const writes: (() => void)[] = [];
  for (const j of jobs) {
    const w = j(now);
    if (w) writes.push(w);
  }
  for (const w of writes) w();
  raf = requestAnimationFrame(loop);
}

export function addJob(job: Job) {
  jobs.add(job);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    jobs.delete(job);
    if (!jobs.size && !lenis) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: true });
    if (!raf) raf = requestAnimationFrame(loop);
    return () => {
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
 * в --p на елемента, без да рисува React наново. Секция далеч от екрана не
 * се пипа.
 */
export function useProgress<T extends HTMLElement>(onChange?: (p: number) => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    let last = -1;
    return addJob(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const H = window.innerHeight;
      if (r.bottom < -H || r.top > 2 * H) return;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - H)));
      if (Math.abs(p - last) <= 0.0005) return;
      last = p;
      return () => {
        el.style.setProperty("--p", p.toFixed(4));
        cb.current?.(p);
      };
    });
  }, []);
  return ref;
}
