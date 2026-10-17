"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import Words from "../ui/Words";
import { useSceneTimeline } from "@/lib/timeline";
import { useReady } from "@/lib/film";
import { dissolveWords, playWords, revealWords } from "@/lib/reveal";

/**
 * I — Преди изгрев. The field at blue hour; the camera moves forward, the fog
 * thins, the sky warms, and the first ray flashes the frame white.
 * (Phase 3: the Higgsfield sequence and the WebGL fog replace the CSS plates.)
 */
export default function SceneDawn() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const ready = useReady();

  useEffect(() => {
    if (!ready) return;
    const q = gsap.utils.selector(root.current);
    const t = playWords(line.current, 0.5);
    const e = gsap.fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 2, delay: 0.2, ease: "expo.out" });
    const z = gsap.fromTo(q("[data-plate]"), { scale: 1.12 }, { scale: 1, duration: 4.2, ease: "expo.out" });
    return () => {
      t?.kill();
      e.kill();
      z.kill();
    };
  }, [ready]);

  useSceneTimeline("dawn", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    // the dolly: everything drifts toward the lens
    tl.fromTo(q("[data-dolly]"), { scale: 1 }, { scale: 1.35, duration: at(1) }, 0)
      .fromTo(q("[data-ridge]"), { yPercent: 0 }, { yPercent: 6, duration: at(1) }, 0)
      .fromTo(q("[data-warm]"), { opacity: 0 }, { opacity: 1, duration: at(0.75), ease: "power1.inOut" }, at(0.1))
      .fromTo(q("[data-sun]"), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.4, duration: at(0.7), ease: "power2.in" }, at(0.25))
      .fromTo(q("[data-fog]"), { opacity: 0.9 }, { opacity: 0.15, duration: at(0.8), stagger: at(0.06) }, at(0.05))
      .to(q("[data-eyebrow]"), { opacity: 0, y: -10, duration: at(0.12) }, at(0.2));
    dissolveWords(tl, line.current, at(0.3), at(0.14));
    revealWords(tl, sub.current, at(0.48), at(0.12));
    dissolveWords(tl, sub.current, at(0.72), at(0.1));
    // first ray → bloom → white
    tl.fromTo(q("[data-ray]"), { xPercent: -120, opacity: 0 }, { xPercent: 120, opacity: 1, duration: at(0.18), ease: "power2.in" }, at(0.8))
      .fromTo(q("[data-flash]"), { opacity: 0 }, { opacity: 1, duration: at(0.12), ease: "power2.in" }, at(0.88));
  });

  return (
    <Stage id="dawn">
      <div ref={root} className="absolute inset-0">
        <div data-plate className="absolute inset-0">
          <div data-dolly className="absolute inset-0 origin-[50%_70%]">
            {/* sky: cold, then warming */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0f15_0%,#1c2630_42%,#4a5864_62%,#0a0b0d_78%)]" />
            <div
              data-warm
              className="absolute inset-0 bg-[linear-gradient(180deg,#120c0f_0%,#3a2028_38%,#b07a62_60%,#0c0908_78%)] opacity-0"
            />
            <div
              data-sun
              className="absolute left-1/2 top-[61%] h-[40vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(242,230,220,0.85),rgba(201,145,122,0.35)_45%,transparent)] opacity-0 blur-2xl"
            />
            {/* the Balkan ridge */}
            <svg
              data-ridge
              viewBox="0 0 1600 400"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-[48%] h-[22%] w-full"
              aria-hidden
            >
              <path
                d="M0 250 C 90 238, 150 214, 240 196 S 380 150, 470 158 S 600 118, 700 112 S 840 140, 930 132 S 1080 104, 1180 120 S 1330 160, 1420 168 S 1540 196, 1600 204 L1600 400 L0 400 Z"
                fill="#141820"
                opacity="0.55"
                style={{ filter: "blur(1.5px)" }}
              />
              <path
                d="M0 290 C 120 270, 220 252, 330 246 S 520 214, 640 222 S 820 252, 940 240 S 1120 206, 1240 218 S 1440 258, 1600 262 L1600 400 L0 400 Z"
                fill="#0b0d11"
                opacity="0.9"
              />
              <path
                d="M0 330 C 200 312, 380 300, 560 306 S 900 322, 1080 312 S 1400 296, 1600 308 L1600 400 L0 400 Z"
                fill="#070809"
              />
            </svg>
            {/* the field */}
            <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,#08090b,#050505)]" />
            <div className="absolute inset-x-[-10%] bottom-0 h-[30%] opacity-40 [background:repeating-linear-gradient(90deg,transparent_0_3.2%,rgba(42,14,18,0.9)_3.2%_4%)] [mask-image:linear-gradient(180deg,transparent,black)] [transform:perspective(400px)_rotateX(62deg)] origin-bottom" />
            {/* fog */}
            {[66, 72, 80].map((top, i) => (
              <div
                key={top}
                data-fog
                className="absolute left-[-20%] h-[18%] w-[140%] rounded-[50%] bg-[#9aa6ae]/30 blur-3xl"
                style={{ top: `${top}%`, animation: `fog ${38 + i * 9}s ease-in-out ${-i * 7}s infinite alternate` }}
              />
            ))}
          </div>
        </div>

        <div
          data-ray
          className="absolute inset-y-0 left-0 w-[60%] -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(242,230,220,0.6),transparent)] opacity-0 blur-xl"
        />

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-28 md:px-10 md:pb-32">
          <div data-eyebrow className="mb-8 opacity-0">
            <Eyebrow id="dawn">Розовата долина · 05:47</Eyebrow>
          </div>
          <h1
            ref={line}
            className="display max-w-[14ch] text-[clamp(3rem,9.5vw,9.5rem)] text-petal"
          >
            <Words text="Има час, в който розата помни най-много." />
          </h1>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <p ref={sub} className="display max-w-[18ch] text-center text-[clamp(2rem,5vw,4.5rem)] italic text-petal/90">
            <Words text="Петнадесет минути преди слънцето." />
          </p>
        </div>

        <div data-flash className="absolute inset-0 bg-petal opacity-0" />
      </div>
    </Stage>
  );
}
