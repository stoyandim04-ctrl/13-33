import * as React from "react";

import { useContent } from "@/data/content";
import { useReducedMotion } from "@/hooks/use-media";

// Three statements, set big and light. As the section travels up the screen
// the words light up one after another; with reduced motion they are simply
// lit. Replaces the old "Why 13:33" paragraphs and the FAQ.
export function Manifest() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { manifest } = useContent();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".manifest-word"));
    if (reduced) {
      words.forEach((w) => w.classList.add("is-on"));
      return;
    }
    let frame = 0;
    const draw = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block enters the lower part of the screen, 1 once its
      // bottom clears the middle.
      const p = Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (r.height + vh * 0.3)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("is-on", i < n));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    draw();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, manifest]);

  return (
    <section id="manifest" aria-label="13:33" className="section">
      <div ref={ref} data-reveal className="container-wide grid gap-6 md:gap-8">
        {manifest.map((line) => (
          <p
            key={line}
            className="font-display max-w-[22ch] text-[clamp(1.75rem,1rem+3.2vw,4rem)] leading-[1.1] font-[300] tracking-[-0.035em] text-balance"
          >
            {line.split(" ").map((word, i) => (
              <React.Fragment key={i}>
                <span className="manifest-word">{word}</span>{" "}
              </React.Fragment>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
