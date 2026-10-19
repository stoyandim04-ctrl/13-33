"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { getUI, live, nav, setUI, useUI } from "@/lib/store";
import { copyAt, sceneAt } from "@/lib/timeline";

/**
 * Virtual scroll. The page itself never scrolls (no native scrollbar to jump
 * when the loop wraps, no fight with iframes or mobile toolbars): wheel,
 * touch and keys move a target, the shown progress glides after it, and both
 * wrap around 1 so the end flows into the hero.
 */

/** one loop = this many screen heights of scrolling */
const LOOP_SCREENS = 14;
/** keys move about one scene */
const KEY_STEP = 0.05;

export function ScrollController() {
  const locked = useUI((s) => s.menu || !s.loaded);
  const lockRef = useRef(locked);
  lockRef.current = locked;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    live.reduced = reduced;

    const s = { target: 0, current: 0, momentum: 0 };
    let tween: gsap.core.Tween | null = null;
    const loopPx = () => window.innerHeight * LOOP_SCREENS;
    const push = (dp: number) => {
      if (lockRef.current) return;
      tween?.kill();
      tween = null;
      s.target += dp;
    };

    /* wheel: normalise lines/pages to px, and cap a single event so a
       trackpad fling or a free-spinning wheel can't skip a whole scene */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      let d = e.deltaY || e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      d = Math.max(-140, Math.min(140, d));
      push(d / loopPx());
    };

    /* touch: follow the finger, then keep some inertia */
    let ty = 0;
    let tt = 0;
    let tv = 0;
    const onTouchStart = (e: TouchEvent) => {
      ty = e.touches[0].clientY;
      tt = performance.now();
      tv = 0;
      s.momentum = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dy = (ty - y) * 1.6;
      const dt = Math.max(1, now - tt);
      tv = tv * 0.6 + (dy / dt) * 0.4;
      ty = y;
      tt = now;
      push(dy / loopPx());
    };
    const onTouchEnd = () => {
      if (lockRef.current) return;
      // px/ms → progress per frame, capped
      s.momentum = Math.max(-0.012, Math.min(0.012, (tv * 16) / loopPx()));
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key;
      if (k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey)) push(KEY_STEP);
      else if (k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) push(-KEY_STEP);
      else return;
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      live.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(64, now - last) / 16.667;
      last = now;

      if (nav.request !== null) {
        // the closest copy of the requested point, forward or back
        const base = Math.floor(s.current);
        let to = base + nav.request;
        if (to - s.current > 0.5) to -= 1;
        if (s.current - to > 0.5) to += 1;
        tween?.kill();
        s.momentum = 0;
        tween = gsap.to(s, { target: to, duration: reduced ? 0.8 : 2.2, ease: "power3.inOut" });
        nav.request = null;
      }

      if (Math.abs(s.momentum) > 1e-6) {
        s.target += s.momentum * dt;
        s.momentum *= Math.pow(0.93, dt);
      }
      const prev = s.current;
      const k = 1 - Math.pow(1 - (reduced ? 0.25 : 0.085), dt);
      s.current += (s.target - s.current) * k;
      if (Math.abs(s.target - s.current) < 1e-6) s.current = s.target;

      const p = ((s.current % 1) + 1) % 1;
      live.progress = p;
      live.velocity = ((s.current - prev) * loopPx()) / dt;

      const ui = getUI();
      const copy = copyAt(p);
      const scene = sceneAt(p);
      if (ui.copy !== copy || ui.scene !== scene) setUI({ copy, scene });
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // for the recording scripts: jump straight to a progress
    (window as unknown as { __nocta: unknown }).__nocta = {
      get: () => live.progress,
      seek(p: number) {
        tween?.kill();
        s.momentum = 0;
        s.target = s.current = p;
      },
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      tween?.kill();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
