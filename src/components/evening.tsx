import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/motion";

/** A full-bleed breath between the homes and the materials: the building at
 *  dusk, slowly settling as you scroll past it. */
export function Evening() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-evening-img]",
        { scale: 1.18, yPercent: -6 },
        { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} aria-label="Варовик вечер" className="relative h-[110svh] overflow-hidden bg-night text-cream">
      <img
        data-evening-img
        src="/media/evening.webp"
        alt="Варовик в синия час: осветената фасада се отразява в басейна, зад сградата — планината"
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_12_24/0.35),transparent_30%,transparent_55%,rgb(10_12_24/0.75))]" aria-hidden="true" />
      <div className="wrap relative flex h-full items-end pb-[10svh]">
        <p className="max-w-[34rem] font-display text-title font-light text-balance [text-shadow:0_2px_24px_rgb(5_6_14/0.6)]" data-reveal>
          Вечер сградата светва отвътре — като фенер в полите на планината.
        </p>
      </div>
    </section>
  );
}
