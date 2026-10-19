"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SCENE_COPY } from "@/lib/copy";
import { live, useUI } from "@/lib/store";

/**
 * The headline of the current scene. Words rise out of a mask and come into
 * focus; on change the old ones lift away blurred before the new ones enter.
 */
export function SceneCopy() {
  const target = useUI((s) => (s.loaded ? s.copy : -1));
  const lang = useUI((s) => s.lang);
  const [shown, setShown] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const busy = useRef<gsap.core.Timeline | null>(null);

  // leave
  useEffect(() => {
    if (target === shown) return;
    const el = root.current;
    busy.current?.kill();
    if (!el || shown === -1) {
      setShown(target);
      return;
    }
    const words = el.querySelectorAll("[data-w]");
    const subs = el.querySelectorAll("[data-sub]");
    busy.current = gsap
      .timeline({ onComplete: () => setShown(target) })
      .to(words, {
        yPercent: -60,
        opacity: 0,
        filter: "blur(10px)",
        duration: live.reduced ? 0.25 : 0.45,
        ease: "power3.in",
        stagger: 0.025,
      })
      .to(subs, { opacity: 0, y: -8, duration: 0.3, ease: "power2.in" }, 0);
  }, [target, shown]);

  // enter
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || shown === -1) return;
    const words = el.querySelectorAll("[data-w]");
    const subs = el.querySelectorAll("[data-sub]");
    const reduced = live.reduced;
    busy.current = gsap
      .timeline()
      .fromTo(
        words,
        { yPercent: reduced ? 0 : 110, opacity: 0, filter: "blur(14px)" },
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: reduced ? 0.4 : 1.1, ease: "expo.out", stagger: 0.06 },
      )
      .fromTo(
        subs,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 },
        0.35,
      );
  }, [shown]);

  const copy = shown >= 0 ? SCENE_COPY[shown] : null;

  return (
    <div
      ref={root}
      className="pointer-events-none fixed z-10 left-[var(--gutter)] top-[13vh] w-[min(92vw,640px)] md:top-1/2 md:-translate-y-[58%] md:w-[42vw]"
    >
      {copy && (
        <>
          <h1 className="headline" key={`h${shown}`}>
            {copy.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line.split(" ").map((w, j) => (
                  <span key={j} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
                    <span data-w className="inline-block will-change-transform">
                      {w}
                      {j < line.split(" ").length - 1 ? " " : ""}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="sub mt-6 md:mt-8" key={`s${shown}${lang}`}>
            {copy.sub[lang].split("\n").map((line, i) => (
              <span key={i} data-sub className="block">
                {line}
              </span>
            ))}
          </p>
        </>
      )}
    </div>
  );
}
