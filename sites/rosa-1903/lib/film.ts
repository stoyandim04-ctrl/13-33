"use client";

import { useEffect, useState } from "react";

/** Fired once the preloader's curtain has opened. */
const READY = "rosa:ready";
let ready = false;

export function markReady() {
  ready = true;
  window.dispatchEvent(new Event(READY));
}

export function useReady() {
  const [r, setR] = useState(ready);
  useEffect(() => {
    if (ready) return setR(true);
    const on = () => setR(true);
    window.addEventListener(READY, on);
    return () => window.removeEventListener(READY, on);
  }, []);
  return r;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isTouch() {
  return typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/** Assets the preloader waits for. Posters are added scene by scene. */
export const PRELOAD: string[] = [];

export function preload(urls: string[], onProgress: (p: number) => void) {
  const fonts = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
  const total = urls.length + 1;
  let done = 0;
  const tick = () => onProgress(++done / total);
  const jobs = [
    fonts.then(tick, tick),
    ...urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => {
            tick();
            resolve();
          };
          img.src = src;
        }),
    ),
  ];
  return Promise.all(jobs);
}
