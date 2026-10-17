"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import Words from "../ui/Words";
import BottleLine from "../ui/BottleLine";
import { useSceneTimeline } from "@/lib/timeline";
import { dissolveWords, revealWords } from "@/lib/reveal";

/**
 * II — Беритба. The main moment: petals fall (0–30 %), a vortex pulls them in
 * (30–70 %), they become the bottle (70–100 %), then fall apart into drops.
 * (Phase 3: the macro sequence and ~40 000 GPU petals replace the CSS plates.)
 */
export default function SceneHarvest() {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLParagraphElement>(null);
  const b = useRef<HTMLParagraphElement>(null);

  useSceneTimeline("harvest", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    // out of the white of the dawn flash
    tl.fromTo(q("[data-veil]"), { opacity: 1 }, { opacity: 0, duration: at(0.12), ease: "power2.out" }, 0)
      .fromTo(q("[data-macro]"), { scale: 1.25, filter: "blur(18px)" }, { scale: 1, filter: "blur(0px)", duration: at(0.3), ease: "expo.out" }, 0)
      .fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.08) }, at(0.08))
      .fromTo(q("[data-kg]"), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: at(0.3), ease: "power2.out" }, at(0.1))
      .to(q("[data-kg]"), { scale: 0.92, duration: at(0.5) }, at(0.4))
      // vortex: the macro plate rotates and pulls in
      .to(q("[data-macro]"), { rotate: 28, scale: 0.6, opacity: 0.25, duration: at(0.4), ease: "power2.inOut" }, at(0.3))
      .to(q("[data-kg]"), { opacity: 0.1, duration: at(0.2) }, at(0.62))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.1) }, at(0.62));
    revealWords(tl, a.current, at(0.18), at(0.12));
    revealWords(tl, b.current, at(0.34), at(0.12));
    dissolveWords(tl, a.current, at(0.6), at(0.08));
    dissolveWords(tl, b.current, at(0.63), at(0.08));
    // the bottle forms (70–100 %), glows rose-gold, then drops fall away
    tl.fromTo(q("[data-bottle] [data-draw]"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: at(0.18), stagger: at(0.02), ease: "power2.inOut" }, at(0.68))
      .fromTo(q("[data-bottle]"), { filter: "drop-shadow(0 0 0 rgba(201,145,122,0))" }, { filter: "drop-shadow(0 0 18px rgba(201,145,122,0.8))", duration: at(0.08) }, at(0.84))
      .to(q("[data-bottle]"), { y: "40vh", opacity: 0, filter: "blur(10px)", duration: at(0.1), ease: "power2.in" }, at(0.92));
  });

  return (
    <Stage id="harvest">
      <div ref={root} className="absolute inset-0">
        <div
          data-macro
          className="absolute inset-[-15%] bg-[radial-gradient(ellipse_40%_35%_at_42%_48%,rgba(201,145,122,0.55),transparent_70%),radial-gradient(ellipse_30%_25%_at_60%_40%,rgba(242,230,220,0.18),transparent_70%),radial-gradient(ellipse_70%_60%_at_50%_60%,#2a0e12,transparent_75%)]"
        />

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            data-kg
            className="numeral text-center text-[44vw] text-petal/[0.08] opacity-0 md:whitespace-nowrap md:text-[clamp(10rem,34vw,34rem)]"
            aria-hidden
          >
            4000 кг
          </span>
        </div>

        <div data-bottle className="absolute inset-0 flex items-center justify-center text-rosegold">
          <BottleLine className="h-[46vh] w-auto" strokeWidth={0.8} />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-28 md:px-10 md:pb-32">
          <div data-eyebrow className="mb-8 opacity-0">
            <Eyebrow id="harvest">Май · ръчна беритба</Eyebrow>
          </div>
          <p ref={a} className="display text-[clamp(2.75rem,7vw,7rem)] text-petal">
            <Words text="Толкова листенца." />
          </p>
          <p ref={b} className="display text-[clamp(2.75rem,7vw,7rem)] italic text-rosegold">
            <Words text="За един килограм масло." />
          </p>
        </div>

        <div data-veil className="pointer-events-none absolute inset-0 bg-petal" />
      </div>
    </Stage>
  );
}
