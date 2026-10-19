"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import gsap from "gsap";
import { getUI, live, nav, setUI, useUI } from "@/lib/store";
import { copyAt, sceneAt } from "@/lib/timeline";

/**
 * Lenis in infinite mode: the page never ends, the scroll position wraps and
 * the timeline wraps with it, so the last frame flows into the first.
 */
export function ScrollController() {
  const locked = useUI((s) => s.menu || !s.loaded);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    live.reduced = reduced;

    const lenis = new Lenis({
      infinite: true,
      syncTouch: true,
      syncTouchLerp: 0.08,
      touchInertiaExponent: 1.6,
      lerp: reduced ? 0.2 : 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });
    (window as unknown as { __lenis: Lenis }).__lenis = lenis;

    const update = () => {
      const limit = lenis.limit || 1;
      const p = (((lenis.scroll % limit) + limit) % limit) / limit;
      live.progress = p;
      live.velocity = lenis.velocity;
      const ui = getUI();
      const copy = copyAt(p);
      const scene = sceneAt(p);
      if (ui.copy !== copy || ui.scene !== scene) setUI({ copy, scene });
    };
    lenis.on("scroll", update);
    update();

    const tick = (time: number) => {
      lenis.raf(time * 1000);
      if (nav.request !== null) {
        lenis.scrollTo(nav.request * lenis.limit, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
        nav.request = null;
      }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onMove = (e: PointerEvent) => {
      live.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }, [locked]);

  // the scroll track: ten screens per loop
  return <div aria-hidden style={{ height: "1000vh" }} />;
}
