import { useEffect, useRef, useState } from "react";
import { euro, products } from "../data/products";
import { useStore } from "../lib/store";

/*
  Орбита — всички дрехи летят в кръг около думата VAELO.
  Елипса в перспектива: отпред дрехите са големи и остри, отзад — малки,
  бледи и минават ЗАД думата. Един rAF проход, без React рендер на кадър.
  Върти се сама; дърпане (мишка/пръст) я завърта, стрелките ← → сменят дреха,
  клик върху предната я отваря, клик върху друга я довърта отпред.
*/
const N = products.length;
const STEP = (Math.PI * 2) / N;

export function Orbit() {
  const { view } = useStore();
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const state = useRef({
    angle: 0, // текущ ъгъл на пръстена
    target: 0, // към него се стреми
    vel: 0,
    drag: false,
    lastX: 0,
    moved: 0,
    idle: 0,
    intro: 0, // 0 → 1 влитане
    active: 0,
    w: 1,
    h: 1,
    reduced: false,
  });

  useEffect(() => {
    const s = state.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = stage.current!;
    const ro = new ResizeObserver(() => {
      s.w = el.clientWidth;
      s.h = el.clientHeight;
    });
    ro.observe(el);

    // Случайни начални точки за влитането — далеч извън пръстена.
    const seeds = products.map((_, i) => ({
      x: (Math.random() - 0.5) * 2.4,
      y: (Math.random() - 0.5) * 1.8 - 0.4,
      r: (Math.random() - 0.5) * 70,
      d: i * 0.06,
    }));

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      s.intro = s.reduced ? 1 : Math.min(1, s.intro + dt / 2.2);

      if (!s.drag) {
        s.idle += dt;
        // След 2.5 s без намеса пръстенът тръгва бавно сам.
        if (s.idle > 2.5 && !s.reduced) s.target -= dt * 0.16;
        s.angle += (s.target - s.angle) * Math.min(1, dt * 4.5);
      }

      const R = s.w < 640 ? s.w * 0.4 : Math.min(s.w * 0.36, 600);
      const tilt = Math.min(s.h * 0.13, 120);
      const cy = s.h * 0.5;
      let best = 0;
      let bestZ = -Infinity;

      for (let i = 0; i < N; i++) {
        const node = items.current[i];
        if (!node) continue;
        const a = i * STEP + s.angle;
        const z = Math.cos(a); // 1 отпред, -1 отзад
        const x = Math.sin(a) * R;
        const depth = (z + 1) / 2; // 0..1
        const scale = 0.42 + depth * 0.78;
        const bob = Math.sin(t * 1.1 + i * 1.7) * 10;
        const y = z * tilt * 0.7 + bob - tilt * 0.25;
        const rot = Math.sin(a) * -14 + Math.sin(t * 0.8 + i) * 2.5;

        // Влитане: от разпилени точки към мястото в пръстена, с лека закъснение по ред.
        const k = Math.max(0, Math.min(1, (s.intro * 1.35 - seeds[i].d) / 1));
        const e = 1 - Math.pow(1 - k, 4);
        const fx = seeds[i].x * s.w * (1 - e) + x * e;
        const fy = seeds[i].y * s.h * (1 - e) + y * e;
        const fr = seeds[i].r * (1 - e) + rot * e;
        const fs = (0.3 + 0.7 * e) * scale;

        node.style.transform = `translate3d(${fx + s.w / 2}px, ${fy + cy}px, 0) translate(-50%, -50%) rotate(${fr}deg) scale(${fs})`;
        node.style.zIndex = String(z > -0.05 ? 20 + Math.round(depth * 50) : Math.round(depth * 9));
        node.style.opacity = String(Math.min(1, e * 1.4) * (z > 0 ? 1 : 0.45 + depth * 1.1));
        node.style.filter = depth < 0.55 ? `blur(${((0.55 - depth) * 7).toFixed(2)}px) saturate(${0.6 + depth * 0.6})` : "none";
        if (z > bestZ) {
          bestZ = z;
          best = i;
        }
      }
      if (best !== s.active) {
        s.active = best;
        setActive(best);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const goTo = (i: number) => {
    const s = state.current;
    // Най-късият път до ъгъла, при който i е отпред (a = 0 mod 2π).
    const want = -i * STEP;
    const diff = ((((want - s.target) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    s.target += diff;
    s.idle = 0;
  };

  const onDown = (e: React.PointerEvent) => {
    const s = state.current;
    s.drag = true;
    s.lastX = e.clientX;
    s.moved = 0;
    s.idle = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.drag) return;
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    s.moved += Math.abs(dx);
    const d = dx / Math.max(320, s.w * 0.55);
    s.angle += d * Math.PI;
    s.target = s.angle;
  };
  const onUp = () => {
    const s = state.current;
    if (!s.drag) return;
    s.drag = false;
    // Довърта до най-близката дреха.
    s.target = Math.round(s.angle / STEP) * STEP;
  };

  const p = products[active];

  return (
    <section
      className="relative h-[100svh] min-h-[640px] select-none overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Колекция 001"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo((active + 1) % N);
        if (e.key === "ArrowLeft") goTo((active - 1 + N) % N);
      }}
    >
      {/* Думата — дрехите минават пред и зад нея */}
      <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
        <h1
          className="text-display font-semibold tracking-[-0.06em] text-ink"
          style={{ animation: "fade-in 1.6s var(--ease-out-expo) both", animationDelay: "0.2s" }}
        >
          VAELO
        </h1>
      </div>

      <div
        ref={stage}
        className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
      >
        {products.map((pr, i) => (
          <button
            key={pr.slug}
            ref={(n) => {
              items.current[i] = n;
            }}
            type="button"
            className="absolute left-0 top-0 w-[clamp(112px,19vw,290px)] will-change-transform outline-none"
            style={{ opacity: 0 }}
            aria-label={`${pr.name} — ${pr.kind}`}
            onClick={() => {
              if (state.current.moved > 6) return;
              if (i === state.current.active) view(i);
              else goTo(i);
            }}
          >
            <img
              src={`/img/p/${pr.slug}.webp`}
              alt=""
              draggable={false}
              className="aspect-[3/4] w-full object-contain drop-shadow-[0_40px_40px_rgba(20,18,16,0.22)]"
            />
          </button>
        ))}
      </div>

      {/* Долу: коя дреха е отпред */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-4 px-4 pb-8 text-center sm:pb-10">
        <div key={p.slug} className="flex flex-col items-center gap-1" style={{ animation: "fade-in .6s var(--ease-out-expo) both" }}>
          <span className="label text-muted">
            {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} · {p.kind}
          </span>
          <span className="text-title font-medium tracking-tight">
            {p.name} <span className="text-muted">— {euro(p.price)}</span>
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {products.map((pr, i) => (
            <button
              key={pr.slug}
              type="button"
              aria-label={`Покажи ${pr.name}`}
              onClick={() => goTo(i)}
              className="grid h-6 w-6 place-items-center"
            >
              <span
                className={`block rounded-full transition-all duration-500 ${i === active ? "h-2 w-6 bg-blood" : "h-1.5 w-1.5 bg-ink/30 hover:bg-ink/60"}`}
              />
            </button>
          ))}
        </div>
        <span className="label text-faint">Дърпай · натисни дрехата отпред, за да я разгледаш</span>
      </div>
    </section>
  );
}
