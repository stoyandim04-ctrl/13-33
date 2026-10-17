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

/** Assets the preloader waits for: the first frame of the film. */
export function preloadList() {
  const m = window.matchMedia("(max-width: 767px)").matches ? "-m" : "";
  return [`/img/dawn${m}.webp`];
}

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

/**
 * Film mode (`?film`): for recording reels. Animations that run on their own
 * (fog, petals, the bottle's easing) follow `window.__filmClock`, which the
 * recorder advances by exactly one frame per screenshot, instead of real time.
 */
declare global {
  interface Window {
    __filmClock?: number;
  }
}

export const filmMode = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("film");

/** A per-component clock: real delta normally, recorder delta in film mode. */
export function filmClock() {
  const film = filmMode();
  let last = film ? (window.__filmClock ?? 0) : 0;
  return (dt: number) => {
    if (!film) return Math.min(dt, 0.05);
    const now = window.__filmClock ?? 0;
    const d = now - last;
    last = now;
    return d;
  };
}
