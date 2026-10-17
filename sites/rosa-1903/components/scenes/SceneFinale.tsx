"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import Stage from "../ui/Stage";
import Words from "../ui/Words";
import BottleLine from "../ui/BottleLine";
import { useSceneTimeline } from "@/lib/timeline";
import { revealWords } from "@/lib/reveal";

export const STUDIO_URL = "https://digistudio13.com";

/**
 * VII — Финал. Darkness; one line of light crosses left to right and leaves
 * the bottle and the name behind it.
 */
export default function SceneFinale() {
  const root = useRef<HTMLDivElement>(null);
  const motto = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);

  useSceneTimeline("finale", (tl, at) => {
    const q = gsap.utils.selector(root.current);
    tl.fromTo(q("[data-light]"), { left: "0%", opacity: 0 }, { left: "100%", opacity: 1, duration: at(0.36), ease: "power2.inOut" }, at(0.14))
      .to(q("[data-light]"), { opacity: 0, duration: at(0.06) }, at(0.46))
      .fromTo(q("[data-lit]"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: at(0.36), ease: "power2.inOut" }, at(0.14))
      .fromTo(q("[data-cta]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: at(0.12), ease: "expo.out" }, at(0.56))
      .fromTo(q("[data-foot]"), { opacity: 0 }, { opacity: 1, duration: at(0.12) }, at(0.62));
    revealWords(tl, motto.current, at(0.44), at(0.12));
  });

  return (
    <Stage id="finale" className="bg-obsidian">
      <div ref={root} className="absolute inset-0 flex flex-col">
        <div className="relative flex flex-1 flex-col items-center justify-center px-5 text-center">
          <div data-lit className="flex flex-col items-center">
            <BottleLine className="h-[22vh] w-auto text-rosegold" strokeWidth={0.9} />
            <h2 className="display mt-6 text-[clamp(3rem,9vw,8.5rem)] tracking-[0.04em] text-petal">
              РОЗА <span className="italic text-rosegold">1903</span>
            </h2>
          </div>
          <p ref={motto} className="mt-4 font-serif text-[clamp(1.4rem,2.6vw,2.4rem)] italic text-petal/80">
            <Words text="Розата не се бърза." />
          </p>

          <form
            data-cta
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-12 w-full max-w-md opacity-0"
          >
            {sent ? (
              <p className="animate-[chapter_1.4s_var(--ease-expo)_both] font-serif text-[1.6rem] italic text-rosegold">
                Благодарим. Ще ви пишем, когато розите узреят.
              </p>
            ) : (
              <>
                <label htmlFor="email" className="label text-petal/50">
                  Запиши се за първата партида
                </label>
                <div className="mt-5 flex items-center border-b border-petal/25 transition-colors duration-700 focus-within:border-rosegold">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="имейл"
                    autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent py-3 font-serif text-[1.35rem] italic text-petal placeholder:text-petal/30 focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-cursor="Запиши"
                    className="label py-3 pl-4 text-rosegold transition-[color,letter-spacing] duration-700 hover:tracking-[0.42em] hover:text-petal"
                  >
                    Запиши ме
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <footer
          data-foot
          className="flex flex-col items-center gap-2 px-5 pb-6 text-center opacity-0 md:flex-row md:justify-between md:px-10 md:pb-8 md:text-left"
        >
          <p className="text-[0.75rem] text-petal/40">Концептуален проект на 13:33 Digital Studio. Марката е измислена.</p>
          <a
            href={STUDIO_URL}
            target="_blank"
            rel="noreferrer"
            data-cursor="Разгледай"
            className="label text-petal/55 transition-colors duration-700 hover:text-rosegold"
          >
            13:33 Digital Studio
          </a>
        </footer>
      </div>

      <div
        data-light
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-petal opacity-0 shadow-[0_0_30px_6px_rgba(242,230,220,0.5),0_0_120px_30px_rgba(201,145,122,0.35)]"
      />
    </Stage>
  );
}
