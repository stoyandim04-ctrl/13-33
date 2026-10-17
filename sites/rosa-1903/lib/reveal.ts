import { gsap } from "gsap";

const words = (root: Element | null) => (root ? root.querySelectorAll(".w > span") : []);

/** Scroll-scrubbed word reveal: rises from the mask, focuses out of a blur. */
export function revealWords(
  tl: gsap.core.Timeline,
  root: Element | null,
  at: number,
  span = 30,
) {
  const els = words(root);
  if (!els.length) return;
  tl.fromTo(
    els,
    { yPercent: 105, opacity: 0, filter: "blur(12px)" },
    {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "expo.out",
      duration: span,
      stagger: span / Math.max(els.length, 1) / 1.4,
    },
    at,
  );
}

/** Scroll-scrubbed exit: the words dissolve upward into blur. */
export function dissolveWords(tl: gsap.core.Timeline, root: Element | null, at: number, span = 24) {
  const els = words(root);
  if (!els.length) return;
  tl.to(
    els,
    {
      yPercent: -40,
      opacity: 0,
      filter: "blur(14px)",
      ease: "power4.in",
      duration: span,
      stagger: span / Math.max(els.length, 1) / 2,
    },
    at,
  );
}

/** Time-based reveal for moments that are not tied to the scroll. */
export function playWords(root: Element | null, delay = 0) {
  const els = words(root);
  if (!els.length) return;
  return gsap.fromTo(
    els,
    { yPercent: 105, opacity: 0, filter: "blur(12px)" },
    {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "expo.out",
      duration: 2.4,
      stagger: 0.16,
      delay,
    },
  );
}
