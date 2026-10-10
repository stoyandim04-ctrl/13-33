import { useEffect, useRef } from "react";
import { chapters } from "../data/content";
import { BEATS, formatHour, hourAt, nightAt, smoothstep } from "../scene/day";
import type { VarovikScene } from "../scene/varovik-scene";
import { ScrollTrigger, prefersReducedMotion } from "../lib/motion";

const INK = [43, 37, 32];
const CREAM = [246, 239, 228];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ");

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The signature: a pinned 3D scene where the scroll is one day of sunlight. */
export function DayStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const clockRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const host = hostRef.current;
    if (!section || !host) return;

    let lastInk = -1;
    const paint = (p: number) => {
      const hour = hourAt(p);
      // text flips to light only once the sky is really dark
      const ink = smoothstep(18.9, 19.9, hour);
      if (Math.abs(ink - lastInk) > 0.004) {
        lastInk = ink;
        const root = document.documentElement.style;
        root.setProperty("--scene-ink", `rgb(${mix(INK, CREAM, ink)})`);
        root.setProperty("--scene-scrim", `rgb(${mix([244, 238, 229], [18, 16, 28], ink)} / ${0.55 + ink * 0.1})`);
      }
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const c = BEATS[i].p;
        const d = p - c;
        // first and last chapters hold at the ends of the scroll
        const dist = (i === 0 && d < 0) || (i === BEATS.length - 1 && d > 0) ? 0 : Math.abs(d);
        const o = 1 - smoothstep(0.05, 0.11, dist);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(-d * 260).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
      if (clockRef.current) clockRef.current.textContent = formatHour(hour);
      if (dotRef.current) dotRef.current.style.top = `${p * 100}%`;
      if (cueRef.current) cueRef.current.style.opacity = String(1 - smoothstep(0.005, 0.04, p));
      host.dataset.night = nightAt(hour) > 0.5 ? "1" : "0";
    };
    paint(0);

    let scene: VarovikScene | null = null;
    let disposed = false;
    const q = new URLSearchParams(location.search).get("quality");
    const lite = q ? q === "lite" : window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const still = prefersReducedMotion();

    if (hasWebGL()) {
      import("../scene/varovik-scene").then(({ createVarovikScene }) => {
        if (disposed) return;
        scene = createVarovikScene(host, { lite, still, onFrame: paint });
        if (scene) {
          scene.setProgress(trigger.progress);
          host.dataset.ready = "1";
        }
      });
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (scene) scene.setProgress(self.progress);
        else paint(self.progress);
      },
    });

    const io = new IntersectionObserver(([e]) => scene?.setActive(e.isIntersecting));
    io.observe(section);
    const onResize = () => scene?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      trigger.kill();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={sectionRef} id="den" aria-label="Един ден във Варовик" className="relative h-[560svh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-[#e9dccb]">
        {/* fallback sky until (or instead of) the 3D scene */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#a9b6c6_0%,#efd9c0_62%,#d8c6a8_62%,#cfbd9f_100%)]" aria-hidden="true" />
        <div
          ref={hostRef}
          className="absolute inset-0 opacity-0 transition-opacity duration-[2400ms] ease-[var(--ease-calm)] data-[ready=1]:opacity-100"
        />
        <div className="grain absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 75% 55% at 0% 100%, var(--scene-scrim) 0%, transparent 75%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18vmax_rgb(30_22_14/0.28)]"
          aria-hidden="true"
        />

        {/* chapters */}
        <div className="wrap relative grid h-full items-end pb-[max(2.5rem,7svh)]" style={{ color: "var(--scene-ink)" }}>
          {chapters.map((c, i) => (
            <div
              key={c.eyebrow}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
              className="col-start-1 row-start-1 max-w-[40rem] will-change-transform"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <p className="eyebrow opacity-80">
                {i > 0 && <span className="mr-3 tabular-nums">{formatHour(BEATS[i].hour)}</span>}
                {c.eyebrow}
              </p>
              {i === 0 ? (
                <h1 className="mt-4 font-display text-display font-light tracking-[-0.02em]">{c.title}</h1>
              ) : (
                <h2 className="mt-4 font-display text-heading font-light text-balance">{c.title}</h2>
              )}
              <p className="mt-5 max-w-[30rem] text-lead opacity-85 text-pretty">{c.lead}</p>
            </div>
          ))}
        </div>

        {/* clock: the time the light is showing */}
        <div
          className="pointer-events-none absolute right-5 top-20 text-right md:right-24 md:top-auto md:bottom-[max(2.5rem,7svh)]"
          style={{ color: "var(--scene-ink)" }}
          aria-hidden="true"
        >
          <span className="eyebrow block opacity-70">Часът във Варовик</span>
          <span
            ref={clockRef}
            className="mt-1 block font-display text-[clamp(2.6rem,1.6rem+4vw,6.5rem)] font-light leading-none [font-variant-numeric:lining-nums_tabular-nums]"
          >
            06:30
          </span>
        </div>

        {/* day rail */}
        <div
          className="pointer-events-none absolute right-10 top-1/2 hidden h-[44svh] -translate-y-1/2 md:block"
          style={{ color: "var(--scene-ink)" }}
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 left-0 w-px bg-current opacity-25" />
          {BEATS.map((b) => (
            <span
              key={b.p}
              className="absolute left-0 -translate-y-1/2 pl-3 text-[0.62rem] tracking-[0.14em] opacity-55 tabular-nums"
              style={{ top: `${b.p * 100}%` }}
            >
              {formatHour(b.hour)}
            </span>
          ))}
          <span ref={dotRef} className="absolute -left-[3px] top-0 size-[7px] -translate-y-1/2 rounded-full bg-accent" />
        </div>

        <div
          ref={cueRef}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
          style={{ color: "var(--scene-ink)" }}
          aria-hidden="true"
        >
          <span className="eyebrow opacity-70">Скролнете</span>
          <span className="cue block h-12 w-px bg-current opacity-60" />
        </div>
      </div>
    </section>
  );
}
