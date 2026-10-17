"use client";

import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * The film. Every scene is a full-screen stage fixed on top of the previous
 * one; the page itself is only a tall runway for the scroll. One master
 * timeline, measured in viewport units (time 100 = one screen of scroll),
 * decides what each stage shows. A scene owns [offset, offset + vh) of it.
 */

export const SCENES = [
  { id: "dawn", index: "I", title: "Преди изгрев", vh: 300 },
  { id: "harvest", index: "II", title: "Беритба", vh: 400 },
  { id: "distill", index: "III", title: "Дестилация", vh: 300 },
  { id: "bottle", index: "IV", title: "Бутилката", vh: 500 },
  { id: "notes", index: "V", title: "Нотите", vh: 450 },
  { id: "archive", index: "VI", title: "1903", vh: 200 },
  { id: "finale", index: "VII", title: "Финал", vh: 150 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export const OFFSETS: Record<SceneId, number> = (() => {
  let acc = 0;
  const out = {} as Record<SceneId, number>;
  for (const s of SCENES) {
    out[s.id] = acc;
    acc += s.vh;
  }
  return out;
})();

/** Total scroll of the film, in vh. The runway is one screen taller. */
export const TOTAL_VH = SCENES.reduce((n, s) => n + s.vh, 0);

/** Length of the cross-dissolve between two scenes, in vh of scroll. */
export const DISSOLVE = 40;

export function scene(id: SceneId) {
  return SCENES.find((s) => s.id === id)!;
}

export function sceneAt(time: number) {
  let current: (typeof SCENES)[number] = SCENES[0];
  for (const s of SCENES) if (time >= OFFSETS[s.id] - DISSOLVE / 2) current = s;
  return current;
}

/** The three notes repaint the whole site; they hand amber over to 1903. */
export const NOTE_ATMOS = [
  { base: "#1a0a0d", glow: "#c9917a", y: 56 },
  { base: "#0d110b", glow: "#5e6b3c", y: 70 },
  { base: "#170c04", glow: "#d98a3d", y: 44 },
] as const;

/** Atmosphere per scene: base colour, glow colour and glow height. */
type Atmos = { base: string; glow: string; y: number };

export const ATMOS: Record<SceneId, Atmos> = {
  dawn: { base: "#07090c", glow: "#8a9ba8", y: 82 },
  harvest: { base: "#120909", glow: "#c9917a", y: 64 },
  distill: { base: "#110a05", glow: "#b8733f", y: 72 },
  bottle: { base: "#0a0908", glow: "#c9917a", y: 50 },
  notes: NOTE_ATMOS[0],
  archive: { base: "#0f0b08", glow: "#b8733f", y: 38 },
  finale: { base: "#0a0908", glow: "#2a0e12", y: 50 },
};

/** What the atmosphere looks like when a scene hands over to the next. */
export function atmosOut(id: SceneId): Atmos {
  return id === "notes" ? NOTE_ATMOS[2] : ATMOS[id];
}

let master: gsap.core.Timeline | null = null;

export function getMaster() {
  if (!master) {
    master = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    // fixes the duration so placement never depends on what was added
    master.set({}, {}, TOTAL_VH);
  }
  return master;
}

const timeListeners = new Set<(t: number) => void>();

/** Subscribe to the film clock (vh of scroll). */
export function onTime(fn: (t: number) => void) {
  timeListeners.add(fn);
  return () => void timeListeners.delete(fn);
}

/** Seek the film to a scroll position given in pixels. */
export function seek(scrollPx: number, viewportPx: number) {
  const t = Math.min(TOTAL_VH, Math.max(0, (scrollPx / viewportPx) * 100));
  getMaster().time(t, false);
  timeListeners.forEach((fn) => fn(t));
  return t;
}

/**
 * Registers a scene's local timeline in the master. `build` gets the local
 * timeline (0 … vh, in vh of scroll) and `at(p)` to place by progress 0 … 1.
 */
export function useSceneTimeline(
  id: SceneId,
  build: (tl: gsap.core.Timeline, at: (p: number) => number) => void | (() => void),
  deps: unknown[] = [],
) {
  useLayoutEffect(() => {
    const m = getMaster();
    const { vh } = scene(id);
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    const dispose = build(tl, (p) => p * vh);
    tl.set({}, {}, vh);
    m.add(tl, OFFSETS[id]);
    m.time(m.time(), false);
    return () => {
      dispose?.();
      m.remove(tl);
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
