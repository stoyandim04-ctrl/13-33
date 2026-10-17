"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import Words from "../ui/Words";
import Plate from "../ui/Plate";
import { useSceneTimeline } from "@/lib/timeline";
import { dissolveWords, revealWords } from "@/lib/reveal";

/**
 * III — Дестилация. Copper, steam, one drop in super slow motion; at 80 % it
 * meets the surface and a ripple bends the frame.
 * (Phase 4: the orbit sequence, the refraction drop and the ripple shader.)
 */
export default function SceneDistill() {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLParagraphElement>(null);
  const b = useRef<HTMLParagraphElement>(null);

  useSceneTimeline("distill", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    tl.fromTo(q("[data-plate]"), { scale: 1.15, rotate: -3 }, { scale: 1, rotate: 3, duration: at(1) }, 0)
      .fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.1) }, at(0.08))
      .fromTo(q("[data-drop]"), { yPercent: -60, scaleY: 1.25 }, { yPercent: 0, scaleY: 1, duration: at(0.68), ease: "power2.in" }, at(0.12))
      .fromTo(q("[data-drop]"), { opacity: 0 }, { opacity: 1, duration: at(0.08) }, at(0.12))
      .to(q("[data-drop]"), { scaleY: 0.4, scaleX: 1.8, opacity: 0, duration: at(0.04), ease: "power2.out" }, at(0.8))
      .fromTo(q("[data-ring]"), { scale: 0.1, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: at(0.18), stagger: at(0.03), ease: "expo.out" }, at(0.8))
      .fromTo(q("[data-quake]"), { scale: 1 }, { scale: 1.035, duration: at(0.03), ease: "power2.out", yoyo: true, repeat: 1 }, at(0.8))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.08) }, at(0.86));
    revealWords(tl, a.current, at(0.2), at(0.14));
    revealWords(tl, b.current, at(0.42), at(0.14));
    dissolveWords(tl, a.current, at(0.86), at(0.08));
    dissolveWords(tl, b.current, at(0.88), at(0.08));
  });

  return (
    <Stage id="distill">
      <div ref={root} className="absolute inset-0">
        <div data-quake className="absolute inset-0">
          <div data-plate className="absolute inset-0">
            <Plate name="distill" className="brightness-[0.6] saturate-[0.9]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.85)_0%,rgba(10,9,8,0.2)_45%,rgba(10,9,8,0.55)_100%)]" />
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute bottom-[-10%] h-[70%] w-[22%] rounded-full bg-petal/[0.05] blur-3xl"
              style={{ left: `${36 + i * 9}%`, animation: `steam ${14 + i * 4}s ease-in-out ${-i * 3}s infinite` }}
            />
          ))}

          <div className="absolute left-1/2 top-[72%] -translate-x-1/2 -translate-y-1/2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                data-ring
                className="absolute left-1/2 top-1/2 block h-[24vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-copper/60 opacity-0"
              />
            ))}
          </div>
          <div className="absolute inset-x-0 top-[12%] flex h-[60%] justify-center">
            <div
              data-drop
              className="mt-auto h-[7vmin] w-[5vmin] rounded-[50%_50%_50%_50%/62%_62%_38%_38%] bg-[radial-gradient(circle_at_35%_30%,rgba(242,230,220,0.95),rgba(201,145,122,0.55)_35%,rgba(184,115,63,0.25)_70%)] opacity-0 shadow-[0_0_40px_rgba(201,145,122,0.45)]"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-start px-5 pt-28 md:px-10 md:pt-36">
          <div data-eyebrow className="mb-8 opacity-0">
            <Eyebrow id="distill">Меден казан · бавен огън</Eyebrow>
          </div>
          <p ref={a} className="display max-w-[12ch] text-[clamp(2.75rem,7vw,7rem)] text-petal">
            <Words text="Тридесет и шест часа огън." />
          </p>
          <p ref={b} className="display mt-2 text-[clamp(2rem,4.6vw,4.5rem)] italic text-copper">
            <Words text="Нито минута по-малко." />
          </p>
        </div>
      </div>
    </Stage>
  );
}
