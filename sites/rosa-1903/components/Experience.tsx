"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ATMOS, DISSOLVE, OFFSETS, SCENES, TOTAL_VH, atmosOut, getMaster, seek } from "@/lib/timeline";
import { prefersReducedMotion } from "@/lib/film";
import Preloader from "./Preloader";
import Hud from "./Hud";
import Film from "./ui/Film";
import Cursor from "./ui/Cursor";
import SceneDawn from "./scenes/SceneDawn";
import SceneHarvest from "./scenes/SceneHarvest";
import SceneDistill from "./scenes/SceneDistill";
import SceneBottle from "./scenes/SceneBottle";
import SceneNotes from "./scenes/SceneNotes";
import SceneArchive from "./scenes/SceneArchive";
import SceneFinale from "./scenes/SceneFinale";

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const runway = useRef<HTMLDivElement>(null);
  const atmos = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);

  // one screen = innerHeight, refreshed only when the width changes
  useLayoutEffect(() => {
    let w = 0;
    const set = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      document.documentElement.style.setProperty("--u", `${window.innerHeight / 100}px`);
      ScrollTrigger.refresh();
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // the atmosphere and the cross-dissolves between stages
  useLayoutEffect(() => {
    const m = getMaster();
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    const a = atmos.current!;
    gsap.set(a, { "--base": ATMOS.dawn.base, "--glow": ATMOS.dawn.glow, "--gy": `${ATMOS.dawn.y}%` });
    SCENES.forEach((s, i) => {
      const stage = document.getElementById(`stage-${s.id}`);
      const at = OFFSETS[s.id];
      if (i === 0) {
        gsap.set(stage, { autoAlpha: 1 });
      } else {
        tl.fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: DISSOLVE, ease: "power1.inOut" }, at - DISSOLVE / 2);
        const prev = document.getElementById(`stage-${SCENES[i - 1].id}`);
        tl.set(prev, { autoAlpha: 0 }, at + DISSOLVE / 2);
        const from = atmosOut(SCENES[i - 1].id);
        const to = ATMOS[s.id];
        tl.fromTo(
          a,
          { "--base": from.base, "--glow": from.glow, "--gy": `${from.y}%` },
          { "--base": to.base, "--glow": to.glow, "--gy": `${to.y}%`, duration: DISSOLVE * 2, ease: "power1.inOut", immediateRender: false },
          at - DISSOLVE,
        );
      }
    });
    tl.set({}, {}, TOTAL_VH);
    m.add(tl, 0);
    return () => {
      m.remove(tl);
      tl.kill();
    };
  }, []);

  // smooth scroll + the single trigger that drives the master timeline
  useEffect(() => {
    const reduced = prefersReducedMotion();
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const l = reduced
      ? null
      : new Lenis({ duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 0.8, touchMultiplier: 1.2 });
    lenis.current = l;
    const raf = (time: number) => l?.raf(time * 1000);
    if (l) {
      l.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      l.stop();
    } else {
      document.documentElement.style.overflow = "hidden";
    }

    const st = ScrollTrigger.create({
      trigger: runway.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => seek(self.scroll(), window.innerHeight),
      onRefresh: (self) => seek(self.scroll(), window.innerHeight),
    });
    seek(0, window.innerHeight);

    const goto = (e: Event) => {
      const vh = (e as CustomEvent<number>).detail;
      const y = (vh / 100) * window.innerHeight;
      if (l) l.scrollTo(y, { duration: 2.4, easing: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2) });
      else window.scrollTo(0, y);
    };
    window.addEventListener("rosa:goto", goto);

    return () => {
      window.removeEventListener("rosa:goto", goto);
      st.kill();
      gsap.ticker.remove(raf);
      l?.destroy();
      document.documentElement.style.overflow = "";
    };
  }, []);

  const open = useCallback(() => {
    if (lenis.current) lenis.current.start();
    else document.documentElement.style.overflow = "";
  }, []);

  return (
    <>
      <Preloader onOpen={open} />

      <div
        ref={atmos}
        data-atmos
        aria-hidden
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 140% 70% at 50% var(--gy), color-mix(in oklab, var(--glow) 22%, transparent), transparent 70%), var(--base)",
        }}
      />

      <main>
        <SceneDawn />
        <SceneHarvest />
        <SceneDistill />
        <SceneBottle />
        <SceneNotes />
        <SceneArchive />
        <SceneFinale />
      </main>

      {/* the runway: the only thing that actually scrolls */}
      <div ref={runway} aria-hidden style={{ height: `calc(${TOTAL_VH + 100} * var(--u))` }} />

      <Hud />
      <Film />
      <Cursor />
    </>
  );
}
