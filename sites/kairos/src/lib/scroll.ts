import { useEffect } from "react";
import Lenis from "lenis";

/*
  Един цикъл за целия сайт: Lenis (мекият скрол) и кадърът на сцената.
  ?rec — кадър по кадър от записващ скрипт (window.__step(now)).
*/
let lenis: Lenis | null = null;
type Job = (now: number) => void;
const jobs = new Set<Job>();
let raf = 0;
const REC = typeof location !== "undefined" && new URLSearchParams(location.search).has("rec");

function step(now: number) {
  lenis?.raf(now);
  for (const j of jobs) j(now);
}
function loop(now: number) {
  step(now);
  raf = requestAnimationFrame(loop);
}
if (REC) (window as unknown as { __step: (now: number) => void }).__step = step;

export function addJob(job: Job) {
  jobs.add(job);
  if (!raf && !REC) raf = requestAnimationFrame(loop);
  return () => {
    jobs.delete(job);
  };
}

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Бавен, тежък скрол — като камера на кран.
    lenis = new Lenis({ duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 3), wheelMultiplier: 0.8 });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

export function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (on) lenis?.stop();
  else lenis?.start();
}

export function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (lenis) lenis.scrollTo(p * max, { duration: 3 });
  else window.scrollTo({ top: p * max, behavior: "smooth" });
}
