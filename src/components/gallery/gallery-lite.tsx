import * as React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { useContent } from "@/data/content";
import { KIND_LABEL, projects, STATUS_LABEL } from "@/data/projects";
import { useLang } from "@/lib/i18n";
import { LogoMark } from "@/components/brand/logo-mark";
import { RainbowLink } from "@/components/ui/rainbow-button";
import { galleryWindows } from "@/components/gallery/windows";

/** The gallery without 3D: for devices without WebGL, slow ones, and anyone
    who asked for reduced motion. Same story, same windows, as plain cards. */
export function GalleryLite() {
  // Arriving here from the 3D version (it could not keep up): stay at the
  // same part of the story.
  React.useEffect(() => {
    let at: string | null = null;
    try {
      at = sessionStorage.getItem("1333-gallery-at");
      sessionStorage.removeItem("1333-gallery-at");
    } catch {
      /* private mode */
    }
    if (at) document.getElementById(at)?.scrollIntoView({ behavior: "auto" });
    else if (at === "") window.scrollTo(0, 0);
  }, []);
  const { gallery } = useContent();
  const { lang, tr } = useLang();
  const windows = React.useMemo(() => galleryWindows(true), []);
  const strip = React.useRef<HTMLDivElement>(null);
  const still = React.useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // Only the card in the middle of the strip plays its clip.
  React.useEffect(() => {
    const el = strip.current;
    if (!el || still) return;
    const videos = Array.from(el.querySelectorAll("video"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.intersectionRatio > 0.7) void v.play().catch(() => {});
          else v.pause();
        }
      },
      { root: el, threshold: [0, 0.7, 1] },
    );
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [still]);

  return (
    <>
      <section className="relative flex min-h-svh flex-col justify-center px-5 pt-24 pb-16 sm:px-8 lg:px-14">
        <LogoMark className="h-10 w-auto" />
        <h1 className="font-serif mt-10 text-[clamp(3rem,1rem+9vw,10rem)] leading-[0.95]">
          <span className="block">{gallery.title[0]}</span>
          <span className="block text-right">{gallery.title[1]}</span>
        </h1>
        <p className="text-muted-foreground mt-8 max-w-[26rem] text-[0.9375rem]">{gallery.small}</p>
      </section>

      <section id="proekti" aria-label={tr("Проекти")} className="py-10">
        <div ref={strip} className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-14 [scrollbar-width:none]">
          {windows.map((w, i) => {
            const p = projects[w.project];
            const name = lang === "en" && p.nameEn ? p.nameEn : p.name;
            return (
              <a
                key={i}
                href={p.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="group border-border bg-surface relative w-[82vw] max-w-[34rem] shrink-0 snap-center overflow-hidden rounded-2xl border"
              >
                <video
                  className="aspect-[16/10] w-full object-cover"
                  poster={w.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-hidden="true"
                >
                  <source src={w.webm} type="video/webm" />
                  <source src={w.mp4} type="video/mp4" />
                </video>
                <span className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-serif text-[1.375rem] leading-none">{name}</span>
                  <span className="text-label text-[var(--color-accent)] uppercase">
                    {tr(KIND_LABEL[p.kind])} · {tr(STATUS_LABEL[p.status])}
                    <ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5" />
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section id="za-nas" className="px-5 py-24 sm:px-8 md:py-36 lg:px-14">
        <p className="text-label text-muted-foreground flex items-center gap-2 uppercase">
          <span className="inline-block size-1.5 rounded-full bg-[var(--color-accent)]" />
          {gallery.aboutLabel}
        </p>
        <h2 className="mt-6 max-w-[52rem] text-[clamp(1.6rem,1rem+2.6vw,3.4rem)] leading-[1.08] font-[400] tracking-[-0.025em]">
          <span className="chroma">{gallery.aboutLead}</span> {gallery.aboutBody}
        </h2>
        <p className="text-muted-foreground mt-6 max-w-[28rem] text-[0.9375rem]">{gallery.aboutNote}</p>
      </section>

      <section id="kontakt" className="flex min-h-[80svh] flex-col items-center justify-center px-5 text-center">
        <h2 className="font-serif text-[clamp(3rem,1rem+8vw,9rem)] leading-[0.95]">{gallery.ctaTitle}</h2>
        <p className="text-muted-foreground text-lead mt-6">{gallery.ctaLead}</p>
        <RainbowLink to="/zapochni" size="lg" className="mt-10" data-ping="start-contact">
          {gallery.cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </RainbowLink>
      </section>
    </>
  );
}
