"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import Stage, { Eyebrow } from "../ui/Stage";
import { useSceneTimeline } from "@/lib/timeline";

const YEARS = [
  { year: "1903", line: "Първият меден казан. Първата беритба на семейството.", plate: "Беритба край Казанлък", img: "1903" },
  { year: "1944", line: "Полетата оцеляват. Казанът — също.", plate: "Дестилерията", img: "1944" },
  { year: "1989", line: "Третото поколение връща старата рецепта.", plate: "Флакони на рафта", img: "1989" },
  { year: "Днес", line: "Същото поле. Същият огън. Същото търпение.", plate: "Къщата и полето", img: "dnes" },
] as const;

/**
 * VI — 1903. A short history of the (invented) house: a horizontal track of
 * four years, toned "archive" photographs on three depths of parallax.
 * (Phase 2/5: the Higgsfield sepia photographs fill the frames.)
 */
export default function SceneArchive() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useSceneTimeline("archive", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    const shift = () => -(track.current!.scrollWidth - window.innerWidth);
    tl.fromTo(q("[data-eyebrow]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: at(0.08) }, at(0.04))
      .fromTo(track.current, { x: 0 }, { x: shift, duration: at(0.84), ease: "power1.inOut" }, at(0.08))
      // depth: frames lag, numerals lead
      .fromTo(q("[data-depth='far']"), { xPercent: 12 }, { xPercent: -12, duration: at(0.84) }, at(0.08))
      .fromTo(q("[data-depth='near']"), { xPercent: -10 }, { xPercent: 10, duration: at(0.84) }, at(0.08))
      .fromTo(q("[data-depth='mid']"), { xPercent: -4 }, { xPercent: 4, duration: at(0.84) }, at(0.08))
      .to(q("[data-eyebrow]"), { opacity: 0, duration: at(0.06) }, at(0.92));
  });

  return (
    <Stage id="archive">
      <div ref={root} className="absolute inset-0">
        <div data-eyebrow className="absolute left-5 top-24 z-10 opacity-0 md:left-10 md:top-28">
          <Eyebrow id="archive">Къщата · четири години</Eyebrow>
        </div>

        <div ref={track} className="absolute inset-y-0 left-0 flex w-max items-center gap-[12vw] pl-[8vw] pr-[20vw]">
          {YEARS.map((y) => (
            <article key={y.year} className="relative flex h-[70vh] w-[78vw] shrink-0 items-center md:w-[52vw]">
              <span
                data-depth="far"
                className="numeral absolute -top-[6vh] left-0 z-10 text-[clamp(7rem,22vw,20rem)] text-petal/[0.09] mix-blend-screen"
                aria-hidden
              >
                {y.year}
              </span>
              <figure
                className="relative ml-[12%] h-[52vh] w-[70%] overflow-hidden bg-[linear-gradient(160deg,#3b2d22,#1a130e)] shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
              >
                <img
                  src={`/img/archive-${y.img}.webp`}
                  alt={y.plate}
                  loading="lazy"
                  decoding="async"
                  data-depth="mid"
                  className="absolute inset-[-6%] h-[112%] w-[112%] max-w-none object-cover sepia-[0.35] brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,9,8,0.7),transparent_40%)]" />
                <div className="absolute inset-3 border border-petal/10" />
                <figcaption className="label absolute bottom-5 left-5 text-petal/60">{y.plate}</figcaption>
              </figure>
              <div data-depth="near" className="absolute bottom-[2vh] right-0 max-w-[24ch] text-right">
                <p className="numeral text-[clamp(2.5rem,5vw,4.5rem)] text-rosegold">{y.year}</p>
                <p className="mt-3 font-serif text-[clamp(1.15rem,1.7vw,1.6rem)] italic leading-snug text-petal/85">{y.line}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Stage>
  );
}
