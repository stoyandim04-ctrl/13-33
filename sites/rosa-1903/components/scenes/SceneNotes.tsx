"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import BottleLine from "../ui/BottleLine";
import { NOTE_ATMOS, useSceneTimeline } from "@/lib/timeline";

const NOTES = [
  { word: "Роза", order: "Първа нота", line: "Росата още не е изсъхнала.", tint: "text-rosegold" },
  { word: "Пачули", order: "Втора нота", line: "Влажна земя след първия дъжд.", tint: "text-[#9aa56a]" },
  { word: "Кехлибар", order: "Трета нота", line: "Светлината, която остава последна.", tint: "text-[#e2a061]" },
] as const;

/**
 * V — Нотите. Three movements of 150 vh; each repaints the whole site while
 * the bottle stays in the centre and bends the new light.
 * (Phase 5: the macro loops, smoke shader and per-note particles.)
 */
export default function SceneNotes() {
  const root = useRef<HTMLDivElement>(null);

  useSceneTimeline("notes", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    const atmos = document.querySelector("[data-atmos]");
    const third = 1 / 3;
    tl.fromTo(q("[data-eyebrow]"), { opacity: 0 }, { opacity: 1, duration: at(0.04) }, at(0.03))
      .fromTo(q("[data-bottle]"), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: at(0.08), ease: "power2.out" }, at(0.02))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.04) }, at(0.94));

    q("[data-note]").forEach((el, i) => {
      const start = at(i * third);
      const word = el.querySelector("[data-word]");
      const line = el.querySelector("[data-line]");
      const plate = q("[data-noteplate]")[i];
      tl.fromTo(plate, { opacity: 0 }, { opacity: 1, duration: at(0.08), ease: "power1.inOut" }, start - (i ? at(0.04) : 0))
        .fromTo(word, { opacity: 0, yPercent: 30, filter: "blur(20px)", letterSpacing: "0.08em" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", letterSpacing: "-0.02em", duration: at(0.1), ease: "expo.out" }, start + at(0.03))
        .fromTo(line, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: at(0.06), ease: "expo.out" }, start + at(0.1))
        .to([word, line], { opacity: 0, yPercent: -20, filter: "blur(16px)", duration: at(0.06), ease: "power2.in" }, start + at(0.26));
      if (i < 2) tl.to(plate, { opacity: 0, duration: at(0.08) }, start + at(0.3));
      if (i > 0 && atmos) {
        const from = NOTE_ATMOS[i - 1];
        const to = NOTE_ATMOS[i];
        tl.fromTo(
          atmos,
          { "--base": from.base, "--glow": from.glow, "--gy": `${from.y}%` },
          { "--base": to.base, "--glow": to.glow, "--gy": `${to.y}%`, duration: at(0.12), ease: "power1.inOut", immediateRender: false },
          start - at(0.05),
        );
      }
    });
    tl.to(q("[data-bottle]"), { rotate: 6, duration: at(1) }, 0);
  });

  return (
    <Stage id="notes">
      <div ref={root} className="absolute inset-0">
        {/* per-note plates */}
        <div data-noteplate className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_45%,rgba(201,145,122,0.28),transparent_70%)]" />
        <div data-noteplate className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_60%_35%_at_50%_80%,rgba(94,107,60,0.35),transparent_70%),radial-gradient(ellipse_30%_50%_at_40%_40%,rgba(242,230,220,0.06),transparent_70%)]" />
        <div data-noteplate className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_40%_60%_at_62%_35%,rgba(217,138,61,0.35),transparent_70%)]" />

        <div data-bottle className="absolute inset-0 flex items-center justify-center text-petal/70">
          <BottleLine className="h-[44vh] w-auto" strokeWidth={0.6} />
        </div>

        {NOTES.map((n) => (
          <div key={n.word} data-note className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <p data-word className={`display text-[clamp(4.5rem,17vw,16rem)] italic opacity-0 mix-blend-screen ${n.tint}`}>
              {n.word}
            </p>
            <div data-line className="mt-[28vh] opacity-0 md:mt-[30vh]">
              <p className="label text-petal/50">{n.order}</p>
              <p className="mt-3 font-serif text-[clamp(1.4rem,2.4vw,2.2rem)] italic text-petal/90">{n.line}</p>
            </div>
          </div>
        ))}

        <div data-eyebrow className="absolute left-5 top-24 opacity-0 md:left-10 md:top-28">
          <Eyebrow id="notes">Три ноти · един флакон</Eyebrow>
        </div>
      </div>
    </Stage>
  );
}
