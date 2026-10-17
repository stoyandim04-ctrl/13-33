"use client";

import { Howl, Howler } from "howler";

/**
 * Sound is off until the visitor asks for it. Beds cross-fade by scene;
 * the files arrive in phase 5 — until then the map stays empty.
 */
const BEDS: Record<string, string> = {};

let enabled = false;
const howls = new Map<string, Howl>();
let currentBed = "";
const listeners = new Set<(on: boolean) => void>();

export function soundOn() {
  return enabled;
}

export function onSound(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export function setSound(on: boolean) {
  enabled = on;
  Howler.mute(!on);
  if (on && currentBed) playBed(currentBed);
  listeners.forEach((fn) => fn(on));
}

function howl(key: string) {
  const src = BEDS[key];
  if (!src) return null;
  let h = howls.get(key);
  if (!h) {
    h = new Howl({ src: [src], loop: true, volume: 0, html5: false });
    howls.set(key, h);
  }
  return h;
}

/** Cross-fades the ambient bed to the given scene over 2.4 s. */
export function playBed(key: string) {
  const prev = currentBed;
  currentBed = key;
  if (!enabled || prev === key) {
    if (enabled && prev === key) howl(key)?.playing() || howl(key)?.play();
    return;
  }
  const out = howl(prev);
  if (out) {
    out.fade(out.volume(), 0, 2400);
    out.once("fade", () => out.volume() === 0 && out.pause());
  }
  const next = howl(key);
  if (next) {
    if (!next.playing()) next.play();
    next.fade(next.volume(), 0.6, 2400);
  }
}
