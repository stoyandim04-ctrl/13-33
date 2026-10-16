import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap } from "gsap";
import { categories, dishes, formatPrice, type Dish } from "../data/menu";
import { PlatePins, TILT } from "../components/plate-pins";
import { Marquee } from "../components/marquee";

const pad = (n: number) => String(n).padStart(2, "0");

interface Layer {
  id: number;
  dish: Dish;
  dir: number;
}

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const initial = Math.max(0, dishes.findIndex((d) => d.slug === params.get("dish")));
  const [index, setIndex] = useState(initial);
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, dish: dishes[initial], dir: 1 }]);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const layerId = useRef(1);
  const infoRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dish = dishes[index];
  const cat = categories.find((c) => c.id === dish.category)!;
  const inCat = dishes.filter((d) => d.category === dish.category);
  const posInCat = inCat.findIndex((d) => d.slug === dish.slug);

  useEffect(() => {
    document.title = `${dish.name} — Меню · Цукиби`;
  }, [dish]);

  const go = useCallback(
    (next: number, dirHint?: number) => {
      const n = (next + dishes.length) % dishes.length;
      if (n === index || busy.current) return;
      busy.current = true;
      setTimeout(() => (busy.current = false), 650);
      const dir = dirHint ?? (n > index ? 1 : -1);
      setOpen(false);
      setIndex(n);
      setLayers((l) => [...l.slice(-1), { id: layerId.current++, dish: dishes[n], dir }]);
      setParams({ dish: dishes[n].slug }, { replace: true, preventScrollReset: true });
    },
    [index, setParams],
  );

  // Колело / тракпад: един жест = едно ястие. Инерцията на тракпада не прескача чинии —
  // следващото ястие идва чак след като колелото спре за миг. Състоянието е в ref,
  // защото слушателят се закача наново след всяка смяна.
  const wheel = useRef({ acc: 0, locked: false, idle: 0 as ReturnType<typeof setTimeout> | 0 });
  const goRef = useRef(go);
  goRef.current = go;
  const indexRef = useRef(index);
  indexRef.current = index;
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const w = wheel.current;
    const onWheel = (e: WheelEvent) => {
      if (!mq.matches) return;
      if ((e.target as HTMLElement).closest("[data-scroll-own]")) return;
      e.preventDefault();
      if (w.idle) clearTimeout(w.idle);
      w.idle = setTimeout(() => { w.locked = false; w.acc = 0; }, 260);
      if (w.locked) return;
      w.acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(w.acc) > 30) {
        const d = Math.sign(w.acc);
        w.locked = true;
        w.acc = 0;
        goRef.current(indexRef.current + d, d);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const i = indexRef.current;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); goRef.current(i + 1, 1); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); goRef.current(i - 1, -1); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Плъзгане с пръст наляво/надясно върху чинията.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let x0 = 0, y0 = 0;
    const start = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchend", end); };
  }, [go, index]);

  // Текстът влиза ред по ред; активното ястие в списъка се показва.
  useLayoutEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-line]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06 });
      gsap.fromTo("[data-fade]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.15 });
    }, el);
    gsap.to(ringRef.current, { rotate: `+=${(layers[layers.length - 1]?.dir ?? 1) * 45}`, duration: 1.2, ease: "expo.out" });
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>(`[data-slug="${dish.slug}"]`);
    if (list && active && list.scrollHeight > list.clientHeight) {
      list.scrollTo({ top: active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2, behavior: "smooth" });
    }
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Наклон: затворено — леко следва курсора; отворено — чинията ляга на ${TILT}°.
  useEffect(() => {
    gsap.to(tiltRef.current, {
      rotateX: open ? TILT : 0, rotateY: 0, scale: 1, yPercent: open ? 10 : 0,
      duration: 1.1, ease: "expo.out",
    });
  }, [open]);

  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tiltRef.current, open
      ? { rotateZ: px * 10, duration: 1, ease: "power3.out" }
      : { rotateY: px * 10, rotateX: -py * 10, duration: 0.8, ease: "power3.out" });
  };
  const onLeave = () => gsap.to(tiltRef.current, open ? { rotateZ: 0, duration: 1 } : { rotateY: 0, rotateX: 0, rotateZ: 0, duration: 1, ease: "power3.out" });

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-ink pt-20 lg:h-svh lg:overflow-hidden lg:pt-0">
      {/* фон */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[46%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(255 91 36 / 0.16), transparent 62%)" }} />
        <p className="absolute -left-[2vw] top-[18%] select-none whitespace-nowrap font-display text-[22vw] leading-none text-bone/[0.025] lg:top-[12%]">
          {cat.label}
        </p>
      </div>

      {/* категории */}
      <nav aria-label="Категории" data-scroll-own className="relative z-30 mx-auto mt-2 flex max-w-full gap-1 overflow-x-auto px-5 [scrollbar-width:none] lg:absolute lg:inset-x-0 lg:top-[5.25rem] lg:mt-0 lg:justify-center">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => go(dishes.findIndex((d) => d.category === c.id))}
            aria-current={c.id === dish.category}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
              c.id === dish.category ? "bg-bone text-ink" : "text-muted hover:text-bone"
            }`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="relative z-10 mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-6 px-5 pb-24 pt-4 md:px-10 lg:h-full lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)_minmax(0,0.75fr)] lg:gap-10 lg:pb-16 lg:pt-32">
        {/* сцена */}
        <div className="order-1 lg:order-2">
          <div
            ref={stageRef}
            className="relative mx-auto aspect-square w-[min(78vw,30rem)] cursor-pointer select-none lg:w-[min(32vw,58vh)]"
            style={{ perspective: "1300px", containerType: "inline-size" }}
            onClick={() => setOpen((v) => !v)}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            role="button"
            tabIndex={0}
            aria-pressed={open}
            aria-label={open ? "Скрий съставките" : `Покажи съставките на ${dish.name}`}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen((v) => !v))}
          >
            <div ref={ringRef} aria-hidden="true" className={`absolute -inset-[7%] rounded-full border border-line transition-opacity duration-700 ${open ? "opacity-0" : ""}`}>
              {Array.from({ length: 48 }).map((_, i) => (
                <span key={i} className="absolute left-1/2 top-0 h-full w-px" style={{ transform: `rotate(${i * 7.5}deg)` }}>
                  <span className={`absolute left-0 top-0 w-px ${i % 4 === 0 ? "h-3 bg-bone/40" : "h-1.5 bg-bone/20"}`} />
                </span>
              ))}
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
            </div>
            <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              {/* сянката под чинията, когато легне */}
              <div aria-hidden="true" className={`absolute inset-[4%] rounded-full bg-black/70 blur-2xl transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`} style={{ transform: "translateZ(-30px)" }} />
              {layers.map((l, i) => (
                <PlateLayer
                  key={l.id}
                  dish={l.dish}
                  dir={layers[layers.length - 1].dir}
                  leaving={i < layers.length - 1}
                  first={l.id === 0}
                  onGone={() => setLayers((ls) => ls.filter((x) => x.id !== l.id))}
                />
              ))}
              <PlatePins key={dish.slug} spots={dish.hotspots} open={open} />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(index - 1, -1)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-lg transition-colors hover:border-bone/60" aria-label="Предишно ястие">‹</button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`rounded-full border px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors ${open ? "border-ember text-ember" : "border-line text-muted hover:text-bone"}`}
            >
              {open ? "Скрий съставките" : "Виж съставките"}
            </button>
            <button type="button" onClick={() => go(index + 1, 1)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-lg transition-colors hover:border-bone/60" aria-label="Следващо ястие">›</button>
          </div>

          {/* телефон: ястията от категорията */}
          <div className="mt-6 grid grid-cols-4 gap-2 lg:hidden">
            {inCat.map((d) => {
              const i = dishes.indexOf(d);
              const active = i === index;
              return (
                <button key={d.slug} type="button" onClick={() => go(i)} aria-current={active} className={`rounded-2xl p-1.5 transition-colors ${active ? "bg-coal-2 ring-1 ring-ember/70" : ""}`}>
                  <img src={d.image} alt="" loading="lazy" className="aspect-square w-full" />
                  <span className={`mt-1 block truncate text-[0.65rem] ${active ? "text-bone" : "text-muted"}`}>{d.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* информация */}
        <div ref={infoRef} className="order-2 lg:order-1" aria-live="polite">
          <div className="overflow-hidden">
            <p data-line className="flex items-center gap-3 text-[0.7rem] tabular-nums tracking-[0.3em] text-muted">
              <span className="text-ember">{cat.label.toUpperCase()}</span>
              <span className="h-px w-8 bg-line" />
              {pad(posInCat + 1)} / {pad(inCat.length)}
            </p>
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,1.5rem+3.2vw,5rem)] font-normal leading-[0.92] tracking-[-0.01em]">
            {dish.name.split(" ").map((w, i) => (
              <span key={`${dish.slug}${i}`} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-top">
                <span data-line className="inline-block">{w}</span>
              </span>
            ))}
          </h1>
          <div className="mt-2 overflow-hidden">
            <p data-line className="font-jp text-lg tracking-[0.35em] text-muted">{dish.native}</p>
          </div>
          <p data-fade className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-bone/75">{dish.description}</p>
          {(dish.tags?.length || dish.heat) && (
            <div data-fade className="mt-5 flex flex-wrap items-center gap-2">
              {dish.tags?.map((t) => (
                <span key={t} className="rounded-full border border-line px-3 py-1 text-xs text-bone/80">{t}</span>
              ))}
              {dish.heat ? (
                <span className="rounded-full border border-line px-3 py-1 text-xs text-bone/80">
                  Лютиво {"🌶".repeat(dish.heat)}
                </span>
              ) : null}
            </div>
          )}
          <p data-fade className="mt-8 whitespace-nowrap font-display text-4xl tabular-nums">{formatPrice(dish.price)}</p>
          <p data-fade className="mt-8 hidden text-[0.65rem] uppercase tracking-[0.3em] text-faint lg:block">
            Натисни чинията — виж съставките · Скрол — следващо ястие
          </p>
        </div>

        {/* списък по категории (голям екран) */}
        <aside className="order-3 hidden lg:block" aria-label="Всички ястия">
          <div ref={listRef} data-scroll-own className="relative max-h-[66vh] overflow-y-auto pr-2 [scrollbar-width:thin]">
            {categories.map((c) => (
              <section key={c.id} className="mb-4">
                <h2 className={`sticky top-0 z-10 bg-ink/90 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] backdrop-blur ${c.id === dish.category ? "text-ember" : "text-faint"}`}>
                  {c.label}
                </h2>
                <ul className="space-y-1">
                  {dishes.filter((d) => d.category === c.id).map((d) => {
                    const i = dishes.indexOf(d);
                    const active = i === index;
                    return (
                      <li key={d.slug} data-slug={d.slug}>
                        <button
                          type="button"
                          onClick={() => go(i)}
                          aria-current={active}
                          className={`group flex w-full items-center gap-3 rounded-2xl p-1.5 pr-3 text-left transition-colors duration-300 ${active ? "bg-coal-2" : "hover:bg-coal"}`}
                        >
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${active ? "ring-1 ring-ember" : ""}`}>
                            <img src={d.image} alt="" loading="lazy" className={`h-11 w-11 transition-transform duration-700 ease-out-expo ${active ? "rotate-45 scale-110" : "group-hover:rotate-12"}`} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${active ? "text-bone" : "text-bone/70"}`}>{d.name}</span>
                          </span>
                          <span className="text-xs tabular-nums text-muted">{formatPrice(d.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/80 backdrop-blur">
        <Marquee
          small
          items={["Салати", "Предястия", "Робата на бинчотан", "Риби", "Суши", "Отворено вт–нд · 18:00–24:00", "Натисни чинията — виж съставките"]}
        />
      </div>
    </main>
  );
}

function PlateLayer({ dish, dir, leaving, first, onGone }: { dish: Dish; dir: number; leaving: boolean; first: boolean; onGone: () => void }) {
  const ref = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first) {
      gsap.fromTo(el, { scale: 0.6, rotate: -160, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.6, ease: "expo.out", delay: 0.3 });
    } else {
      gsap.fromTo(
        el,
        { yPercent: 70 * dir, rotate: 140 * dir, scale: 0.55, opacity: 0 },
        { yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: 1.05, ease: "expo.out" },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leaving || !ref.current) return;
    const tw = gsap.to(ref.current, {
      yPercent: -70 * dir, rotate: -140 * dir, scale: 0.55, opacity: 0,
      duration: 0.7, ease: "power3.in", onComplete: onGone,
    });
    return () => { tw.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <img
      ref={ref}
      src={dish.image}
      alt={leaving ? "" : `${dish.name}, поглед отгоре`}
      className="absolute inset-0 h-full w-full"
      style={{ filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.65))" }}
      draggable={false}
    />
  );
}
