"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SCENES, TOTAL_VH, onTime, sceneAt } from "@/lib/timeline";
import { useReady } from "@/lib/film";
import SoundToggle from "./ui/SoundToggle";

/** Wordmark, sound, the current chapter and a hairline of progress. */
export default function Hud() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const ready = useReady();
  const [chapter, setChapter] = useState<(typeof SCENES)[number]>(SCENES[0]);

  useEffect(() => {
    let last = "";
    let hinted = false;
    return onTime((t) => {
      bar.current!.style.transform = `scaleY(${t / TOTAL_VH})`;
      const s = sceneAt(t);
      if (s.id !== last) {
        last = s.id;
        setChapter(s);
      }
      const show = t < 12;
      if (show !== hinted) {
        hinted = show;
        gsap.to(hint.current, { opacity: show ? 1 : 0, duration: 1.2, ease: "power2.out" });
      }
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    gsap.fromTo(
      root.current!.querySelectorAll("[data-hud]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 1.6, ease: "expo.out", stagger: 0.12, delay: 1.4 },
    );
  }, [ready]);

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[80]">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5 md:px-10 md:pt-8">
        <a
          data-hud
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("rosa:goto", { detail: 0 }));
          }}
          data-cursor="Начало"
          className="pointer-events-auto font-serif text-[1.05rem] tracking-[0.18em] text-petal opacity-0"
        >
          РОЗА <span className="italic text-rosegold">1903</span>
        </a>
        <div data-hud className="pointer-events-auto opacity-0">
          <SoundToggle />
        </div>
      </div>

      <div
        data-hud
        className="label absolute bottom-5 left-5 flex items-baseline gap-3 text-petal/50 opacity-0 md:bottom-8 md:left-10"
        style={{ visibility: chapter.id === "finale" ? "hidden" : undefined }}
      >
        <span className="font-serif text-[0.9rem] italic tracking-normal normal-case text-rosegold">
          {chapter.index}
        </span>
        <span key={chapter.id} className="animate-[chapter_1.4s_var(--ease-expo)_both]">
          {chapter.title}
        </span>
      </div>

      <div
        ref={hint}
        className="label absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-petal/45 opacity-0 md:bottom-8"
      >
        <span>Скролвай бавно</span>
        <span className="relative block h-10 w-px overflow-hidden bg-petal/10">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[drip_2.4s_var(--ease-silk)_infinite] bg-rosegold" />
        </span>
      </div>

      <div data-hud className="absolute bottom-8 right-10 top-24 hidden w-px bg-petal/10 opacity-0 md:block">
        <div ref={bar} className="h-full w-full origin-top bg-rosegold/70" style={{ transform: "scaleY(0)" }} />
      </div>
    </div>
  );
}
