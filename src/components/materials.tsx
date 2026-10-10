import { useEffect, useRef, useState } from "react";
import { materials } from "../data/content";
import { materialSwatch } from "../lib/textures";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { SectionHead } from "./section-head";

/** Desktop: the section pins and the materials slide past like a film strip.
 *  Phones and reduced motion: a plain vertical list. */
export function Materials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [swatches, setSwatches] = useState<Record<string, string>>({});

  useEffect(() => {
    setSwatches(Object.fromEntries(materials.map((m) => [m.id, materialSwatch(m.id)])));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      // each swatch drifts inside its frame: slow, filmic parallax
      gsap.utils.toArray<HTMLElement>("[data-swatch]", track).forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.18, xPercent: 6 },
          {
            scale: 1.04,
            xPercent: -6,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, scrub: true },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="materiali" aria-labelledby="materiali-h" className="overflow-hidden bg-paper-2">
      <div ref={trackRef} className="flex flex-col gap-20 py-[clamp(6rem,4rem+8vw,11rem)] lg:h-svh lg:w-max lg:flex-row lg:items-center lg:gap-0 lg:py-0">
        <div className="wrap lg:w-[44vw] lg:max-w-none lg:shrink-0 lg:pl-[max(3rem,calc((100vw-88rem)/2+3rem))] lg:pr-16">
          <SectionHead
            id="materiali-h"
            eyebrow="Материали"
            title={
              <>
                Три материала.
                <br />
                <em className="font-light italic">Нищо повече.</em>
              </>
            }
            lead="Палитрата е събрана от неща, които остаряват красиво."
          />
        </div>

        {materials.map((m) => (
          <article
            key={m.id}
            className="wrap grid gap-8 lg:w-[62vw] lg:max-w-none lg:shrink-0 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)] lg:items-end lg:gap-12 lg:px-[4vw]"
            data-reveal
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-paper-3 lg:aspect-auto lg:h-[72svh]">
              {swatches[m.id] && (
                <div
                  data-swatch
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${swatches[m.id]})` }}
                  role="img"
                  aria-label={`Текстура — ${m.name}`}
                />
              )}
              <div className="absolute inset-0 shadow-[inset_0_0_8rem_rgb(43_37_32/0.18)]" aria-hidden="true" />
            </div>
            <div className="pb-2">
              <p className="eyebrow text-mute">{m.use}</p>
              <h3 className="mt-4 font-display text-heading font-light">{m.name}</h3>
              <p className="mt-5 max-w-[22rem] text-body text-mute text-pretty">{m.text}</p>
            </div>
          </article>
        ))}
        <div className="hidden lg:block lg:w-[8vw] lg:shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}
