"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import Words from "../ui/Words";
import BottleLine from "../ui/BottleLine";
import { useSceneTimeline } from "@/lib/timeline";
import { dissolveWords, revealWords } from "@/lib/reveal";

const PARTS = [
  { name: "Капачка", note: "Фасетиран кристал, тежък в ръката.", y: -34, side: "right" },
  { name: "Тапа", note: "Шлифовано стъкло. Затваря без пружина.", y: -16, side: "left" },
  { name: "Течност", note: "Масло от сорт Rosa damascena.", y: 2, side: "right" },
  { name: "Флакон", note: "Ръчно шлифован кристал.", y: 18, side: "left" },
  { name: "Етикет", note: "Памучна хартия, номерирана на ръка.", y: 32, side: "right" },
] as const;

/**
 * IV — Бутилката. Rim light out of darkness (0–20 %), exploded view with
 * annotations (20–60 %), the click back together (60–80 %), a slow turn with a
 * line of light across the glass (80–100 %).
 * (Phase 4: the physical-material 3D bottle replaces the drawn line.)
 */
export default function SceneBottle() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);

  useSceneTimeline("bottle", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    tl.fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.06) }, at(0.04))
      .fromTo(q("[data-bottle] [data-draw]"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: at(0.14), stagger: at(0.015), ease: "power2.inOut" }, at(0.02))
      .fromTo(q("[data-bottle]"), { opacity: 0.2, scale: 0.92 }, { opacity: 1, scale: 1, duration: at(0.18), ease: "power2.out" }, 0);
    revealWords(tl, head.current, at(0.06), at(0.08));
    dissolveWords(tl, head.current, at(0.18), at(0.05));
    // exploded view
    tl.to(q("[data-bottle]"), { scale: 0.82, opacity: 0.35, duration: at(0.1), ease: "power2.inOut" }, at(0.2));
    q("[data-part]").forEach((el, i) => {
      tl.fromTo(el, { opacity: 0, y: 0 }, { opacity: 1, y: `${PARTS[i].y}vh`, duration: at(0.14), ease: "expo.out" }, at(0.22 + i * 0.035));
      tl.fromTo(el.querySelector("[data-tick]"), { scaleX: 0 }, { scaleX: 1, duration: at(0.06), ease: "power2.out" }, at(0.27 + i * 0.035));
    });
    // the click
    tl.to(q("[data-part]"), { y: 0, opacity: 0, duration: at(0.12), ease: "power4.in", stagger: at(0.01) }, at(0.6))
      .to(q("[data-bottle]"), { scale: 1, opacity: 1, duration: at(0.12), ease: "power4.in" }, at(0.6))
      .fromTo(q("[data-shake]"), { x: 0 }, { keyframes: { x: [0, -4, 3, -2, 1, 0] }, duration: at(0.04) }, at(0.72))
      .fromTo(q("[data-snap]"), { opacity: 0 }, { opacity: 0.5, duration: at(0.01), yoyo: true, repeat: 1 }, at(0.72))
      // the turn and the line of light
      .fromTo(q("[data-bottle]"), { rotateY: 0 }, { rotateY: 360, duration: at(0.2), ease: "power1.inOut" }, at(0.8))
      .fromTo(q("[data-sweep]"), { xPercent: -150, opacity: 0 }, { xPercent: 150, opacity: 1, duration: at(0.16), ease: "power2.inOut" }, at(0.82))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.05) }, at(0.92));
  });

  return (
    <Stage id="bottle">
      <div ref={root} className="absolute inset-0 [perspective:1200px]">
        <div data-shake className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_30%_45%_at_50%_50%,rgba(201,145,122,0.12),transparent_70%)]" />
          <div data-bottle className="absolute inset-0 flex items-center justify-center text-petal/80">
            <div className="relative overflow-hidden">
              <BottleLine className="h-[58vh] w-auto" strokeWidth={0.6} />
              <div
                data-sweep
                className="absolute inset-y-0 left-1/4 w-1/2 -skew-x-[18deg] opacity-0 bg-[linear-gradient(90deg,transparent,rgba(242,230,220,0.55),transparent)] mix-blend-screen"
              />
            </div>
          </div>

          <ul className="absolute inset-0">
            {PARTS.map((p) => (
              <li
                key={p.name}
                data-part
                className="absolute top-1/2 flex w-full items-center opacity-0"
                style={{ justifyContent: p.side === "left" ? "flex-start" : "flex-end" }}
              >
                <div
                  className={`flex w-1/2 items-center gap-4 px-5 md:px-10 ${p.side === "left" ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className={p.side === "left" ? "text-left" : "text-right"}>
                    <p className="label text-rosegold">{p.name}</p>
                    <p className="mt-2 max-w-[22ch] font-serif text-[clamp(1.1rem,1.6vw,1.5rem)] italic leading-snug text-petal/85">
                      {p.note}
                    </p>
                  </div>
                  <span
                    data-tick
                    className={`h-px flex-1 bg-petal/30 ${p.side === "left" ? "origin-left" : "origin-right"}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-snap className="pointer-events-none absolute inset-0 bg-rosegold/20 opacity-0" />

        <div data-eyebrow className="absolute left-5 top-24 opacity-0 md:left-10 md:top-28">
          <Eyebrow id="bottle">№ 01 · Extrait</Eyebrow>
        </div>
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-28 md:px-10 md:pb-32">
          <h2 ref={head} className="display text-[clamp(2.75rem,7vw,7rem)] text-petal">
            <Words text="Кристал. Масло. Търпение." />
          </h2>
        </div>
      </div>
    </Stage>
  );
}
