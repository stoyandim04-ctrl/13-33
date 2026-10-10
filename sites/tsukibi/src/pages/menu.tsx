import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap } from "gsap";
import { categories, dishes, formatPrice, type Dish } from "../data/menu";
import { useCart } from "../lib/cart";
import { PlateHotspots } from "../components/plate-hotspots";
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
  const [hover, setHover] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const lock = useRef(false);
  const layerId = useRef(1);
  const infoRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dish = dishes[index];
  const { add } = useCart();

  useEffect(() => {
    document.title = `${dish.name} — Меню · Цукиби`;
  }, [dish]);

  const go = useCallback(
    (next: number, dirHint?: number) => {
      const n = (next + dishes.length) % dishes.length;
      if (n === index || lock.current) return;
      lock.current = true;
      setTimeout(() => (lock.current = false), 750);
      const dir = dirHint ?? (n > index ? 1 : -1);
      setIndex(n);
      setLayers((l) => [...l.slice(-1), { id: layerId.current++, dish: dishes[n], dir }]);
      setParams({ dish: dishes[n].slug }, { replace: true, preventScrollReset: true });
    },
    [index, setParams],
  );

  // Колелото / тракпадът сменят чинията (само на голям екран, където страницата не скролва).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    let acc = 0;
    let t: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if (!mq.matches) return;
      if ((e.target as HTMLElement).closest("[data-scroll-own]")) return;
      e.preventDefault();
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      clearTimeout(t);
      t = setTimeout(() => (acc = 0), 160);
      if (Math.abs(acc) > 40) {
        go(index + Math.sign(acc), Math.sign(acc));
        acc = 0;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(index + 1, 1); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(index - 1, -1); }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [go, index]);

  // Плъзгане с пръст върху чинията.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let x0 = 0, y0 = 0;
    const start = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchend", end); };
  }, [go, index]);

  // Текстът влиза ред по ред при всяка смяна.
  useLayoutEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-line]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06 });
      gsap.fromTo("[data-fade]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.15 });
    }, el);
    gsap.to(ringRef.current, { rotate: `+=${(layers[layers.length - 1]?.dir ?? 1) * 60}`, duration: 1.2, ease: "expo.out" });
    const active = listRef.current?.querySelector<HTMLElement>(`[data-slug="${dish.slug}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Лек 3D наклон към курсора.
  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tiltRef.current, { rotateY: px * 10, rotateX: -py * 10, duration: 0.8, ease: "power3.out" });
  };
  const onLeave = () => {
    setHover(false);
    gsap.to(tiltRef.current, { rotateY: 0, rotateX: 0, duration: 1, ease: "power3.out" });
  };

  const flyToCart = () => {
    add(dish.slug);
    const from = stageRef.current?.querySelector("img[data-current]")?.getBoundingClientRect();
    const to = document.querySelector("[data-cart-button]")?.getBoundingClientRect();
    if (!from || !to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ghost = document.createElement("img");
    ghost.src = dish.image;
    Object.assign(ghost.style, {
      position: "fixed", left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
      zIndex: "80", pointerEvents: "none",
    });
    document.body.appendChild(ghost);
    gsap.to(ghost, {
      left: to.left + to.width / 2 - 20, top: to.top + to.height / 2 - 20, width: 40, height: 40, rotate: 540, opacity: 0.4,
      duration: 0.9, ease: "power3.inOut", onComplete: () => ghost.remove(),
    });
  };

  const spotsOn = hover || showSpots;
  const cat = categories.find((c) => c.id === dish.category)!;

  return (
    <main className="relative min-h-svh overflow-hidden bg-ink pt-20 lg:h-svh lg:pt-0">
      {/* фон */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[46%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(255 91 36 / 0.16), transparent 62%)" }} />
        <p className="absolute -left-[2vw] top-[18%] select-none whitespace-nowrap font-display text-[22vw] leading-none text-bone/[0.025] lg:top-[12%]" key={dish.slug}>
          {dish.name.split(" ")[0]}
        </p>
      </div>

      {/* категории */}
      <nav aria-label="Категории" className="relative z-10 mx-auto mt-2 flex max-w-full gap-1 overflow-x-auto px-5 lg:absolute lg:inset-x-0 lg:top-[5.25rem] lg:mt-0 lg:justify-center" data-scroll-own>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => go(dishes.findIndex((d) => d.category === c.id))}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
              c.id === dish.category ? "bg-bone text-ink" : "text-muted hover:text-bone"
            }`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="relative z-10 mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-6 px-5 pb-28 pt-4 md:px-10 lg:h-full lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,0.7fr)] lg:gap-10 lg:pb-16 lg:pt-28">
        {/* сцена */}
        <div className="order-1 lg:order-2">
          <div
            ref={stageRef}
            className="relative mx-auto aspect-square w-[min(76vw,30rem)] lg:w-[min(30vw,62vh)]"
            style={{ perspective: "1200px" }}
            onMouseEnter={() => setHover(true)}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            <div ref={ringRef} aria-hidden="true" className="absolute -inset-[7%] rounded-full border border-line">
              {Array.from({ length: 48 }).map((_, i) => (
                <span key={i} className={`absolute left-1/2 top-0 h-full w-px origin-center ${i % 4 ? "" : ""}`} style={{ transform: `rotate(${i * 7.5}deg)` }}>
                  <span className={`absolute left-0 top-0 w-px ${i % 4 === 0 ? "h-3 bg-bone/40" : "h-1.5 bg-bone/20"}`} />
                </span>
              ))}
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
            </div>
            <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
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
              <div className="hidden lg:block">
                <PlateHotspots spots={dish.hotspots} visible={spotsOn} />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(index - 1, -1)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-lg transition-colors hover:border-bone/60" aria-label="Предишно ястие">‹</button>
            <button type="button" onClick={() => setShowSpots((v) => !v)} className={`rounded-full border px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors lg:hidden ${showSpots ? "border-ember text-ember" : "border-line text-muted"}`}>
              Съставки
            </button>
            <span className="hidden min-w-24 text-center text-[0.7rem] uppercase tracking-[0.24em] text-muted lg:block">Задръж върху чинията</span>
            <button type="button" onClick={() => go(index + 1, 1)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-lg transition-colors hover:border-bone/60" aria-label="Следващо ястие">›</button>
          </div>
          {showSpots && (
            <ul className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 lg:hidden">
              {dish.hotspots.map((s) => (
                <li key={s.label} className="border-l border-ember/60 pl-3">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted">{s.kicker}</p>
                  <p className="font-display text-lg leading-tight">{s.label}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* информация */}
        <div ref={infoRef} className="order-3 lg:order-1" aria-live="polite">
          <div className="overflow-hidden">
            <p data-line className="flex items-center gap-3 text-[0.7rem] tabular-nums tracking-[0.3em] text-muted">
              {pad(index + 1)} <span className="h-px w-10 bg-line" /> {pad(dishes.length)}
            </p>
          </div>
          <div className="mt-6 overflow-hidden"><p data-line className="eyebrow">{cat.label}</p></div>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,1.5rem+3.4vw,5.25rem)] font-normal leading-[0.92] tracking-[-0.01em]">
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
                <span className="rounded-full border border-line px-3 py-1 text-xs text-bone/80" aria-label={`Лютивина ${dish.heat} от 3`}>
                  {"●".repeat(dish.heat)}<span className="text-faint">{"●".repeat(3 - dish.heat)}</span> лютиво
                </span>
              ) : null}
            </div>
          )}
          <div data-fade className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <span className="whitespace-nowrap font-display text-4xl tabular-nums">{formatPrice(dish.price)}</span>
            <button type="button" onClick={flyToCart} className="btn-ember">
              <span>Добави към поръчката</span>
              <span aria-hidden="true" className="text-lg leading-none">+</span>
            </button>
          </div>
          <p data-fade className="mt-10 hidden text-[0.65rem] uppercase tracking-[0.3em] text-faint lg:block">
            Скролни за следващата чиния ↓
          </p>
        </div>

        {/* списък */}
        <aside className={`order-2 transition-opacity duration-500 lg:order-3 ${spotsOn ? "lg:opacity-25" : ""}`} aria-label="Всички ястия">
          <ul ref={listRef} data-scroll-own className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:max-h-[68vh] lg:flex-col lg:gap-1 lg:overflow-y-auto lg:overflow-x-visible lg:px-0 lg:pb-0 [scrollbar-width:none]">
            {dishes.map((d, i) => {
              const active = i === index;
              return (
                <li key={d.slug} data-slug={d.slug} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active}
                    className={`group flex w-full items-center gap-3 rounded-2xl p-2 pr-4 text-left transition-colors duration-300 ${
                      active ? "bg-coal-2" : "hover:bg-coal"
                    }`}
                  >
                    <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full ${active ? "ring-1 ring-ember" : ""}`}>
                      <img src={d.image} alt="" loading="lazy" className={`h-12 w-12 transition-transform duration-700 ease-out-expo ${active ? "rotate-45 scale-110" : "group-hover:rotate-12"}`} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${active ? "text-bone" : "text-bone/70"}`}>{d.name}</span>
                      <span className="block text-xs tabular-nums text-muted">{formatPrice(d.price)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/80 backdrop-blur">
        <Marquee
          small
          items={["Робата на бинчотан", "Отворено вт–нд · 18:00–24:00", "Вземане за вкъщи", "Омакасе на бара — 10 места", "Скролни за следващата чиния", "Кухнята е отворена"]}
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
        { yPercent: 70 * dir, rotate: 140 * dir, scale: 0.55, opacity: 0, filter: "blur(6px)" },
        { yPercent: 0, rotate: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.15, ease: "expo.out" },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leaving || !ref.current) return;
    const tw = gsap.to(ref.current, {
      yPercent: -70 * dir, rotate: -140 * dir, scale: 0.55, opacity: 0, filter: "blur(6px)",
      duration: 0.8, ease: "power3.in", onComplete: onGone,
    });
    return () => { tw.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <img
      ref={ref}
      src={dish.image}
      alt={leaving ? "" : `${dish.name}, поглед отгоре`}
      data-current={leaving ? undefined : ""}
      className="absolute inset-0 h-full w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.7)]"
      draggable={false}
    />
  );
}
