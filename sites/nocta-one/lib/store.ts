"use client";

import { useSyncExternalStore } from "react";

/**
 * Two kinds of state live here.
 *
 * `live` is mutable and read every frame (scroll progress, pointer, quality).
 * Nothing re-renders when it changes, the render loop simply reads it.
 *
 * `ui` is the small React state the DOM layer needs (language, which copy is
 * on screen, open panels). It changes rarely and components subscribe to it.
 */

export type Tier = "low" | "mid" | "high";

export const live = {
  /** smoothed progress 0..1 (wraps) */
  progress: 0,
  /** scroll velocity, px per frame, signed */
  velocity: 0,
  /** pointer in -1..1 */
  pointer: { x: 0, y: 0 },
  /** viewport is taller than wide */
  portrait: false,
  reduced: false,
  tier: "high" as Tier,
  /** set by the drag interaction in scene 4 */
  drag: { x: 0, y: 0, active: false },
};

export type Lang = "bg" | "en";

type UI = {
  lang: Lang;
  copy: number;
  scene: number;
  loaded: boolean;
  menu: boolean;
  ask: boolean;
  sound: boolean;
  cursor: "default" | "drag";
};

let ui: UI = {
  lang: "bg",
  copy: 0,
  scene: 0,
  loaded: false,
  menu: false,
  ask: false,
  sound: false,
  cursor: "default",
};

const listeners = new Set<() => void>();

export function setUI(patch: Partial<UI>) {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof UI;
    if (ui[key] !== patch[key]) changed = true;
  }
  if (!changed) return;
  ui = { ...ui, ...patch };
  listeners.forEach((l) => l());
}

export function getUI() {
  return ui;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useUI<T>(select: (s: UI) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(ui),
    () => select(ui),
  );
}

/**
 * Screen-space anchors. The canvas projects 3D points every frame and writes
 * them here; the HUD reads them in its own rAF and moves DOM nodes.
 */
export const anchors: Record<string, { x: number; y: number; visible: boolean }> = {};

/** Jump requests from the menu (target progress). */
export const nav = { request: null as number | null };
