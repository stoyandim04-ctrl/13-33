import { useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { gsap } from "gsap";
import { LogoMark } from "./logo";

// Преходът между страниците: завеса от въглен с пламъка в средата.
// goTo() се вика от линковете; без JS/при модифицирани кликове линкът работи нормално.

let navigateRef: NavigateFunction | null = null;
let playing = false;
let curtain: HTMLDivElement | null = null;

export function scrollToHash(hash: string) {
  const el = document.getElementById(hash.replace("#", ""));
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(el, { offset: -40, duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function goTo(e: MouseEvent, to: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const [path, hash] = to.split("#");
  const target = path || "/";
  if (target === window.location.pathname) {
    if (hash) scrollToHash(hash);
    else window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (playing || !navigateRef) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !curtain) {
    navigateRef(to);
    return;
  }
  playing = true;
  const c = curtain;
  gsap
    .timeline({
      onComplete: () => {
        playing = false;
      },
    })
    .set(c, { display: "grid", clipPath: "circle(0% at 50% 100%)" })
    .to(c, { clipPath: "circle(150% at 50% 100%)", duration: 0.8, ease: "power3.inOut" })
    .fromTo(c.querySelector("[data-mark]"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 }, "-=0.35")
    .add(() => {
      navigateRef?.(to);
      window.scrollTo(0, 0);
    })
    .to(c, { clipPath: "circle(0% at 50% 0%)", duration: 0.8, ease: "power3.inOut", delay: 0.25 })
    .set(c, { display: "none" });
}

export function PageTransition() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    navigateRef = navigate;
    curtain = ref.current;
  }, [navigate]);

  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => scrollToHash(hash), 900);
      return () => clearTimeout(t);
    }
  }, [pathname, hash]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 z-[70] hidden place-items-center bg-coal"
      style={{ background: "radial-gradient(circle at 50% 60%, #2a1a12 0%, #0b0a09 65%)" }}
    >
      <div data-mark className="flex flex-col items-center gap-4 text-bone">
        <LogoMark className="h-20 w-20" />
        <span className="font-display text-xl tracking-[0.4em]">TSUKIBI</span>
      </div>
    </div>
  );
}
