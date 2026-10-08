// Horizon hero for 13:33, adapted from the provided Horizon component.
//
// Kept: the procedural scene (stars, nebula, four ridgelines, atmosphere,
// bloom), the eased camera with its subtle float, the split-character title
// intro, the side rail and the scroll indicator.
// Changed: one hero and one transition instead of HORIZON / COSMOS / INFINITY;
// progress is local to this section (not the whole document); each text has its
// own ref; the scroll path is a scrubbed ScrollTrigger tied to this section;
// resources are disposed; phones get a lighter scene; reduced motion and
// missing WebGL get a still, static horizon.
import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "lucide-react";

import { cn, clamp } from "@/lib/utils";
import { useCoarseDevice, useReducedMotion } from "@/hooks/use-media";
// Type only: three.js itself is loaded after first paint (see below), so the
// headline and buttons never wait for the 3D scene.
import type { HorizonScene } from "@/components/ui/horizon-scene";

gsap.registerPlugin(ScrollTrigger);

export interface HorizonHeroProps {
  id?: string;
  /** Big mark. */
  title: string;
  /** Small line above the mark. */
  eyebrow: string;
  /** What we do, in one sentence. */
  message: string;
  description: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  /** Vertical label in the side rail. */
  railLabel: string;
  /** Label beside the scroll indicator; the indicator links to `scrollHref`. */
  scrollLabel: string;
  scrollHref: string;
  /** Extra scroll length of the transition, in viewport heights. */
  travel?: number;
  className?: string;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function HorizonHero({
  id,
  title,
  eyebrow,
  message,
  description,
  primary,
  secondary,
  railLabel,
  scrollLabel,
  scrollHref,
  travel = 0.5,
  className,
}: HorizonHeroProps) {
  const containerRef = React.useRef<HTMLElement>(null);
  const sceneHostRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const eyebrowRef = React.useRef<HTMLParagraphElement>(null);
  const messageRef = React.useRef<HTMLParagraphElement>(null);
  const descriptionRef = React.useRef<HTMLParagraphElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const scrollCueRef = React.useRef<HTMLAnchorElement>(null);
  const progressFillRef = React.useRef<HTMLSpanElement>(null);
  const veilRef = React.useRef<HTMLDivElement>(null);
  const threeRef = React.useRef<HorizonScene | null>(null);
  const progressRef = React.useRef(0);

  const reduced = useReducedMotion();
  const lite = useCoarseDevice();
  const [webgl, setWebgl] = React.useState<boolean | null>(null);

  // ---- Three.js scene -------------------------------------------------
  React.useEffect(() => {
    const host = sceneHostRef.current;
    const section = containerRef.current;
    if (!host || !section) return;
    if (!supportsWebGL()) {
      setWebgl(false);
      return;
    }
    let cancelled = false;
    let teardown: (() => void) | undefined;

    import("@/components/ui/horizon-scene")
      .then(({ createHorizonScene }) => {
        if (cancelled) return;
        const scene = createHorizonScene(host, { lite, still: reduced });
        if (!scene) {
          setWebgl(false);
          return;
        }
        threeRef.current = scene;
        setWebgl(true);
        // The scroll may already be under way when the scene arrives.
        scene.setProgress(progressRef.current);

        // Draw only while the hero is on screen and the tab is visible.
        let onScreen = true;
        const sync = () => scene.setActive(onScreen && !document.hidden);
        const io = new IntersectionObserver(
          ([entry]) => {
            onScreen = entry.isIntersecting;
            sync();
          },
          { rootMargin: "100px 0px" },
        );
        io.observe(section);
        document.addEventListener("visibilitychange", sync);
        const ro = new ResizeObserver(() => scene.resize());
        ro.observe(host);
        sync();

        teardown = () => {
          io.disconnect();
          ro.disconnect();
          document.removeEventListener("visibilitychange", sync);
          scene.dispose();
          threeRef.current = null;
        };
      })
      .catch(() => {
        if (!cancelled) setWebgl(false);
      });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [lite, reduced]);

  // ---- Intro: short, and never in the way of the buttons --------------
  React.useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const chars = titleRef.current?.querySelectorAll(".title-char");
      if (chars?.length) {
        tl.from(chars, {
          yPercent: 70,
          opacity: 0,
          duration: 1.1,
          stagger: 0.045,
          ease: "power4.out",
        });
      }
      tl.from(
        [eyebrowRef.current, messageRef.current, descriptionRef.current],
        { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 },
        0.15,
      )
        .from(actionsRef.current, { y: 16, opacity: 0, duration: 0.7 }, 0.35)
        .from(railRef.current, { x: -24, opacity: 0, duration: 0.8 }, 0.3)
        .from(scrollCueRef.current, { y: 16, opacity: 0, duration: 0.7 }, 0.5);
    }, containerRef);
    return () => ctx.revert();
  }, [reduced]);

  // ---- Scroll: one local transition into the work ---------------------
  React.useLayoutEffect(() => {
    const section = containerRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      // Text retreats first, then the light fades into the page's graphite.
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      // Progress runs until the hero has fully left the screen, so the camera
      // is still climbing while the work slides in underneath - no dead frame.
      tl.to(
        contentRef.current,
        reduced
          ? { opacity: 0, duration: 0.3 }
          : { yPercent: -16, opacity: 0, scale: 0.97, duration: 0.32 },
        0,
      )
        .to(railRef.current, { opacity: 0, duration: 0.2 }, 0.04)
        .to(scrollCueRef.current, { opacity: 0, duration: 0.15 }, 0)
        .fromTo(veilRef.current, { opacity: 0 }, { opacity: 0.85, duration: 0.5 }, 0.5);

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: reduced ? true : 0.6,
        animation: tl,
        onUpdate: (self) => {
          const p = clamp(self.progress, 0, 1);
          progressRef.current = p;
          threeRef.current?.setProgress(p);
          if (progressFillRef.current) {
            progressFillRef.current.style.transform = `scaleX(${p})`;
          }
        },
      });
    }, section);
    return () => ctx.revert();
  }, [reduced]);

  const chars = React.useMemo(() => Array.from(title), [title]);

  return (
    <section
      id={id}
      ref={containerRef}
      aria-label={`${title} — ${eyebrow}`}
      className={cn("relative", className)}
      style={{ height: `${(1 + travel) * 100}svh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Scene, or the still horizon when WebGL is unavailable. */}
        <div
          ref={sceneHostRef}
          className="absolute inset-0"
          aria-hidden="true"
        />
        {webgl === false && (
          <div className="horizon-fallback absolute inset-0" aria-hidden="true">
            <StaticRidges />
          </div>
        )}
        <div
          className="from-background/80 pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b to-transparent"
          aria-hidden="true"
        />
        {/* Keeps type legible over the brightest part of the glow. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_75%_at_10%_78%,rgb(8_10_15/0.85),transparent_72%)] md:bg-[radial-gradient(90%_70%_at_20%_80%,rgb(8_10_15/0.72),transparent_70%)]"
          aria-hidden="true"
        />
        {/* Melts the stage's bottom edge into the page as it scrolls away. */}
        <div
          className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t to-transparent"
          aria-hidden="true"
        />
        <div
          ref={veilRef}
          className="bg-background pointer-events-none absolute inset-0 opacity-0"
          aria-hidden="true"
        />

        {/* Side rail */}
        <div
          ref={railRef}
          className="text-label text-muted-foreground absolute top-1/2 left-5 hidden -translate-y-1/2 flex-col items-center gap-6 uppercase lg:flex"
          aria-hidden="true"
        >
          <span className="bg-border block h-16 w-px" />
          <span className="vertical-text tracking-[0.32em]">{railLabel}</span>
          <span className="bg-border block h-16 w-px" />
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="relative flex h-full flex-col justify-end px-5 pt-24 pb-28 will-change-transform sm:px-8 md:pb-32 lg:px-24"
        >
          <div className="container-wide">
            <p ref={eyebrowRef} className="eyebrow text-ice/90 mb-3 md:mb-1">
              {eyebrow}
            </p>
            <h1
              ref={titleRef}
              className="horizon-title font-display text-display -ml-[0.04em] font-[250] tracking-[-0.035em]"
            >
              <span aria-hidden="true" className="inline-block overflow-hidden pb-[0.04em]">
                {chars.map((char, i) => (
                  <span key={i} className="title-char">
                    {char}
                  </span>
                ))}
              </span>
              <span className="sr-only">
                {title} — {eyebrow}
              </span>
            </h1>

            <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end md:gap-10">
              <p
                ref={messageRef}
                className="font-display text-title max-w-[17ch] font-[350] tracking-[-0.01em] text-balance md:col-span-6 lg:col-span-5 lg:text-[2.5rem] lg:leading-[1.08]"
              >
                {message}
              </p>
              <div className="md:col-span-6 lg:col-span-6 lg:col-start-7">
                <p
                  ref={descriptionRef}
                  className="text-muted-foreground max-w-[44ch] text-pretty"
                >
                  {description}
                </p>
                <div ref={actionsRef} className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href={primary.href}
                    className="bg-primary text-foreground hover:bg-primary/90 group inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[0.9375rem] font-semibold transition-colors"
                  >
                    {primary.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                    />
                  </a>
                  <a
                    href={secondary.href}
                    className="border-foreground/25 hover:border-foreground/60 inline-flex h-12 items-center rounded-full border px-6 text-[0.9375rem] font-medium transition-colors"
                  >
                    {secondary.label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          ref={scrollCueRef}
          href={scrollHref}
          className="text-label text-muted-foreground hover:text-foreground absolute right-5 bottom-7 left-5 flex items-center gap-4 uppercase transition-colors sm:right-8 sm:left-8 lg:right-24 lg:left-24"
        >
          <ArrowDown aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="shrink-0 tracking-[0.22em]">{scrollLabel}</span>
          <span className="bg-border relative hidden h-px flex-1 overflow-hidden sm:block" aria-hidden="true">
            <span
              ref={progressFillRef}
              className="bg-ice/70 absolute inset-0 origin-left scale-x-0"
            />
          </span>
        </a>
      </div>
    </section>
  );
}

/** The still horizon: same ridgelines, drawn once in SVG. */
function StaticRidges() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[62%] w-full"
      viewBox="0 0 1000 400"
      preserveAspectRatio="none"
    >
      <path d="M0 170 C120 120 220 190 330 150 S560 90 680 140 S880 120 1000 150 V400 H0Z" fill="#1b2742" opacity="0.5" />
      <path d="M0 210 C140 170 260 230 380 190 S600 150 720 200 S900 180 1000 205 V400 H0Z" fill="#141c2e" opacity="0.7" />
      <path d="M0 255 C160 220 280 275 420 240 S640 210 760 255 S920 240 1000 260 V400 H0Z" fill="#0e1320" opacity="0.9" />
      <path d="M0 305 C170 280 300 320 460 295 S700 270 820 305 S940 300 1000 310 V400 H0Z" fill="#0a0d13" />
    </svg>
  );
}

export default HorizonHero;
