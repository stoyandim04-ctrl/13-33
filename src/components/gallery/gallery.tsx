import * as React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { useContent } from "@/data/content";
import { KIND_LABEL, projects, STATUS_LABEL } from "@/data/projects";
import { useLang } from "@/lib/i18n";
import { displayCanvasFont, sansCanvasFont } from "@/lib/display-font";
import { RainbowLink } from "@/components/ui/rainbow-button";
import { galleryWindows } from "@/components/gallery/windows";
import { GalleryLite } from "@/components/gallery/gallery-lite";
import { ANCHOR, CH, LENGTH, moodAt, seg, smooth, within } from "@/components/gallery/timeline";
import type { GalleryScene } from "@/components/gallery/scene";

type Mode = "pending" | "3d" | "lite";

const isPhone = () => window.matchMedia("(pointer: coarse)").matches && Math.min(window.innerWidth, window.innerHeight) < 820;

/** `?3d` / `?lite` force a version (for reviewing both on any device). */
const forced = () => {
  const q = new URLSearchParams(location.search);
  return q.has("3d") ? "3d" : q.has("lite") ? "lite" : null;
};

/** 3D only where it will run well: WebGL, no reduced motion, a decent device. */
function canRun3d() {
  if (forced() === "lite") return false;
  const force = forced() === "3d";
  if (!force && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (!force && ((nav.deviceMemory ?? 8) < 3 || (nav.hardwareConcurrency ?? 8) < 4)) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Opens a project's site in a new tab, through a real link (so the click
    reaches lib/ping like any other project link). */
function openSite(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function Gallery({ onMode }: { onMode?: (mode: "3d" | "lite") => void }) {
  const [mode, setMode] = React.useState<Mode>("pending");
  React.useEffect(() => setMode(canRun3d() ? "3d" : "lite"), []);
  React.useEffect(() => {
    if (mode !== "pending") onMode?.(mode);
  }, [mode, onMode]);
  if (mode === "pending") return <div className="h-svh" />;
  if (mode === "lite") return <GalleryLite />;
  return <Gallery3d onFail={() => forced() !== "3d" && setMode("lite")} />;
}

function Gallery3d({ onFail }: { onFail: () => void }) {
  const { gallery } = useContent();
  const { lang, tr } = useLang();
  const [phone] = React.useState(isPhone);
  const windows = React.useMemo(() => galleryWindows(phone), [phone]);
  const [focus, setFocus] = React.useState(0);

  const section = React.useRef<HTMLElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const scene = React.useRef<GalleryScene | null>(null);
  const layers = React.useRef<Record<string, HTMLDivElement | null>>({});
  const stripes = React.useRef<HTMLDivElement>(null);
  const len = phone ? LENGTH.phone : LENGTH.desktop;

  const title = React.useMemo(
    () => ({
      lines: gallery.title.map(([a, b]) => [
        { text: a, serif: false },
        { text: b, serif: true },
      ]),
      small: gallery.small,
      lang,
      sans: sansCanvasFont,
      serif: displayCanvasFont,
    }),
    [gallery, lang],
  );
  const titleRef = React.useRef(title);
  titleRef.current = title;
  const failRef = React.useRef(onFail);
  failRef.current = onFail;

  // The HTML on top of the scene follows the same progress, without React.
  const onFrame = React.useCallback((p: number) => {
    const show = (key: string, v: number, lift = 0) => {
      const el = layers.current[key];
      if (!el) return;
      el.style.opacity = String(v);
      el.style.visibility = v > 0.01 ? "visible" : "hidden";
      el.style.pointerEvents = v > 0.6 ? "auto" : "none";
      if (lift) el.style.transform = `translate3d(0, ${(1 - v) * lift}px, 0)`;
    };
    show("hint", 1 - smooth(seg(p, [0.004, 0.03])));
    // „За нас“ is dark: the header turns light with it.
    document.documentElement.classList.toggle("scene-dark", moodAt(p) > 0.5);
    show("wall", within(p, [CH.wall[0], CH.wall[1]], 0.015), 14);
    show("about", within(p, [CH.about[0] + 0.01, CH.about[1] - 0.005], 0.02), 24);
    show("cta", smooth(seg(p, [CH.cta[0] + 0.01, CH.cta[0] + 0.05])), 24);
    // Glitch: the screen tears into sliding stripes for a moment.
    const g = seg(p, CH.glitch);
    const bell = Math.sin(Math.PI * g);
    const st = stripes.current;
    if (st) {
      st.style.visibility = bell > 0.01 ? "visible" : "hidden";
      Array.from(st.children).forEach((c, i) => {
        const el = c as HTMLElement;
        const r = Math.sin(i * 91.7) * 0.5;
        el.style.transform = `translate3d(${(r * 70 + (g - 0.5) * 30 * (i % 2 ? 1 : -1)) * bell}vw, 0, 0) scaleY(${0.4 + bell})`;
        el.style.opacity = String(Math.min(1, bell * (0.5 + Math.abs(r))));
      });
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    let s: GalleryScene | null = null;
    const onScroll = () => {
      const el = section.current;
      if (!el || !s) return;
      const r = el.getBoundingClientRect();
      s.setProgress(-r.top / Math.max(1, r.height - window.innerHeight));
      // The header's flat logo steps aside while the 3D one is on screen.
      document.documentElement.classList.toggle("has-3d-logo", r.bottom > 80);
    };
    (async () => {
      const [{ GalleryScene }] = await Promise.all([
        import("@/components/gallery/scene"),
        document.fonts.load(displayCanvasFont(64), "Пд").catch(() => {}),
        document.fonts.load('400 16px "Manrope Variable"', "Пд").catch(() => {}),
      ]);
      if (!alive || !canvas.current) return;
      try {
        s = new GalleryScene({
          canvas: canvas.current,
          windows,
          phone,
          title: titleRef.current,
          onFocus: (w) => w !== null && setFocus(w),
          onOpen: (w) => {
            const url = projects[windows[w].project].liveUrl;
            if (url) openSite(url);
          },
          logoSlot: () => document.querySelector("[data-logo-slot]")?.getBoundingClientRect() ?? null,
          onFrame,
          onFail: () => {
            // Remember where in the story the visitor is, for the light version.
            const r = section.current?.getBoundingClientRect();
            const p = r ? -r.top / Math.max(1, r.height - window.innerHeight) : 0;
            const at = p > ANCHOR.kontakt - 0.05 ? "kontakt" : p > ANCHOR["za-nas"] - 0.07 ? "za-nas" : p > CH.drop[0] ? "proekti" : "";
            try {
              sessionStorage.setItem("1333-gallery-at", at);
            } catch {
              /* private mode */
            }
            failRef.current();
          },
        });
      } catch {
        failRef.current();
        return;
      }
      scene.current = s;
      onScroll();
    })();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.classList.remove("has-3d-logo", "scene-dark");
      s?.dispose();
      scene.current = null;
    };
  }, [windows, phone, onFrame]);

  React.useEffect(() => {
    scene.current?.setTitle(title);
  }, [title]);

  const win = windows[focus] ?? windows[0];
  const project = projects[win.project];
  const name = lang === "en" && project.nameEn ? project.nameEn : project.name;
  const anchorTop = (p: number) => `calc(${p} * (${len * 100}svh - 100svh))`;

  return (
    <section
      ref={section}
      aria-label={tr("Проекти")}
      className="relative"
      style={{ height: `${len * 100}svh` }}
    >
      {Object.entries(ANCHOR).map(([id, p]) => (
        <div key={id} id={id} aria-hidden="true" className="pointer-events-none absolute left-0 h-px w-px scroll-mt-0" style={{ top: anchorTop(p) }} />
      ))}

      <div className="sticky top-0 h-svh overflow-hidden">
        <canvas ref={canvas} className="absolute inset-0 block size-full touch-pan-y" aria-hidden="true" />

        {/* The first screen's words live in the scene; here they are for
            readers and search engines. */}
        <h1 className="sr-only">
          {gallery.title.map((l) => l.join(" ")).join(" ")}
        </h1>
        <p className="sr-only">{gallery.small}</p>

        <div ref={(el) => void (layers.current.hint = el)} className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
          <span className="text-label text-muted-foreground uppercase">{gallery.scroll}</span>
          <span className="hero-scroll-line text-foreground/50" />
        </div>

        {/* The wall: what the window under the pointer is. */}
        <div
          ref={(el) => void (layers.current.wall = el)}
          className="invisible absolute inset-x-0 top-20 px-5 opacity-0 sm:px-8 md:top-24 lg:px-14"
        >
          <div key={win.project} className="ww-rise flex max-w-[52rem] flex-wrap items-start gap-x-8 gap-y-3">
            <p className="font-serif text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-none whitespace-nowrap">
              <span className="text-muted-foreground mr-2 align-top font-sans text-[0.8125rem] tracking-[0.1em] tabular-nums">
                [{String(win.project + 1).padStart(2, "0")}]
              </span>
              {name}
            </p>
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-muted-foreground line-clamp-2 text-[0.875rem] sm:line-clamp-3 leading-snug">{lang === "en" && project.summaryEn ? project.summaryEn : project.summary}</p>
              <p className="text-label text-primary mt-2 tracking-[0.16em] uppercase">
                {tr(KIND_LABEL[project.kind])} · {tr(STATUS_LABEL[project.status])}
              </p>
            </div>
            {project.liveUrl ? (
              <RainbowLink to={project.liveUrl} size="sm" className="shrink-0">
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
                {gallery.open}
              </RainbowLink>
            ) : null}
          </div>
          <p className="text-muted-foreground/80 mt-4 text-[0.8125rem]">{gallery.wallHint}</p>
          {/* Keyboard and screen readers: the projects as plain links. */}
          <ul className="sr-only">
            {projects.map((p) =>
              p.liveUrl ? (
                <li key={p.slug}>
                  <a href={p.liveUrl} target="_blank" rel="noreferrer">
                    {lang === "en" && p.nameEn ? p.nameEn : p.name} — {tr(STATUS_LABEL[p.status])}
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </div>

        {/* Glitch stripes between the wall and the dark. */}
        <div ref={stripes} aria-hidden="true" className="pointer-events-none invisible absolute inset-0 flex flex-col">
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: i % 3 === 0 ? "#246BFF" : i % 3 === 1 ? "#080A0F" : "#44C8FF", opacity: 0 }}
            />
          ))}
        </div>

        {/* About: the words in front of the globe. */}
        <div
          ref={(el) => void (layers.current.about = el)}
          className="invisible absolute inset-0 flex flex-col justify-end px-5 pt-24 pb-16 opacity-0 sm:px-8 md:justify-center md:pb-0 lg:px-14"
        >
          <div className="max-w-[46rem]">
            <p className="text-label flex items-center gap-2 text-white/60 uppercase">
              <span className="inline-block size-1.5 rounded-full bg-[var(--color-accent)]" />
              {gallery.aboutLabel}
            </p>
            <h2 className="mt-6 text-white text-[clamp(1.6rem,1rem+2.6vw,3.4rem)] leading-[1.08] font-[400] tracking-[-0.025em]">
              <span className="chroma">{gallery.aboutLead}</span> {gallery.aboutBody}
            </h2>
            <p className="mt-6 max-w-[28rem] text-[0.9375rem] text-white/60">{gallery.aboutNote}</p>
          </div>
        </div>

        {/* The way in. */}
        <div
          ref={(el) => void (layers.current.cta = el)}
          className="invisible absolute inset-0 flex flex-col items-center justify-center px-5 text-center opacity-0"
        >
          <h2 className="font-serif text-[clamp(3rem,1rem+8vw,9rem)] leading-[0.95]">{gallery.ctaTitle}</h2>
          <p className="text-muted-foreground mt-6 text-lead">{gallery.ctaLead}</p>
          <RainbowLink to="/zapochni" size="lg" className="mt-10" data-ping="start-contact">
            {gallery.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </RainbowLink>
        </div>

        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
      </div>
    </section>
  );
}
