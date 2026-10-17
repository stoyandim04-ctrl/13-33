"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import Words from "../ui/Words";
import Plate from "../ui/Plate";
import { useSceneActive, useSceneTimeline } from "@/lib/timeline";
import SeqCanvas, { type SeqHandle } from "../ui/SeqCanvas";
import Petals, { type PetalState } from "../gl/Petals";
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
  const seq = useRef<SeqHandle>(null);
  const petals = useRef<PetalState>({ progress: 0 });
  const active = useSceneActive("harvest");
  const near = useSceneActive("harvest", 160);

  useSceneTimeline("harvest", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    // out of the white of the dawn flash
    tl.fromTo(q("[data-veil]"), { opacity: 1 }, { opacity: 0, duration: at(0.12), ease: "power2.out" }, 0)
      .fromTo(q("[data-macro]"), { scale: 1.25, filter: "blur(18px)" }, { scale: 1, filter: "blur(0px)", duration: at(0.3), ease: "expo.out" }, 0)
      .fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.08) }, at(0.08))
      .fromTo(q("[data-kg]"), { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: at(0.3), ease: "power2.out" }, at(0.1))
      .to(q("[data-kg]"), { scale: 0.92, duration: at(0.5) }, at(0.4))
      // vortex: the macro plate rotates and pulls in
      .to(q("[data-macro]"), { rotate: 8, scale: 1.25, opacity: 0.12, filter: "blur(14px)", duration: at(0.4), ease: "power2.inOut" }, at(0.3))
      .to(q("[data-kg]"), { opacity: 0.1, duration: at(0.2) }, at(0.62))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.1) }, at(0.62));
    revealWords(tl, a.current, at(0.18), at(0.12));
    revealWords(tl, b.current, at(0.34), at(0.12));
    dissolveWords(tl, a.current, at(0.6), at(0.08));
    dissolveWords(tl, b.current, at(0.63), at(0.08));
    // the petals: fall → vortex → the bottle → drops (Petals reads this)
    const film = { p: 0 };
    tl.fromTo(
      film,
      { p: 0 },
      {
        p: 1,
        duration: at(1),
        onUpdate: () => {
          petals.current.progress = film.p;
          seq.current?.seek(Math.min(1, film.p / 0.35));
        },
      },
      0,
    )
      .fromTo(q("[data-glow]"), { opacity: 0 }, { opacity: 1, duration: at(0.12), ease: "power2.out" }, at(0.74))
      .to(q("[data-glow]"), { opacity: 0, duration: at(0.06) }, at(0.9));
  });

  return (
    <Stage id="harvest">
      <div ref={root} className="absolute inset-0">
        <div data-macro className="absolute inset-0">
          <Plate name="harvest" />
          <SeqCanvas ref={seq} scene="harvest" count={116} near={near} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_60%_40%,transparent_30%,rgba(10,9,8,0.75)_100%)]" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            data-kg
            className="numeral text-center text-[44vw] text-petal/[0.08] opacity-0 md:whitespace-nowrap md:text-[clamp(10rem,34vw,34rem)]"
            aria-hidden
          >
            4000 кг
          </span>
        </div>

        <div data-glow className="absolute left-1/2 top-1/2 h-[70vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,145,122,0.35),transparent)] opacity-0 blur-2xl" />
        {near && <Petals state={petals.current} active={active} />}

        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(0deg,rgba(10,9,8,0.8),transparent)]" />
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
