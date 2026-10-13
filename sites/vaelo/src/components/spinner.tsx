import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Product } from "../data/products";
import { drawFrame, useSpin } from "../lib/spin";

/*
  Дрехата, която се върти след курсора: позицията на мишката по ширината
  на сцената = ъгълът (лява половина → завърта наляво, дясна → надясно).
  На допир: плъзгане. Ъгълът се плъзга към целта с инерция, така че
  движението е плавно, дори кадрите да са 48.
  Ако дрехата няма кадри — показва снимката с лек 3D наклон.
*/
export type SpinnerHandle = { goTo: (turn: number) => void };

type Props = {
  product: Product;
  className?: string;
  /** "hover": ъгълът следва курсора; "drag": само при дърпане; "none": управлява се отвън */
  mode?: "hover" | "drag" | "none";
  /** 0..1 — външно управляван ъгъл (за "none") */
  turn?: number;
  onTurn?: (turn: number) => void;
  align?: "center" | "top";
};

export const Spinner = forwardRef<SpinnerHandle, Props>(function Spinner({ product, className = "", mode = "hover", turn, onTurn, align = "center" }, ref) {
  const n = product.spin;
  const { frames, loaded } = useSpin(product.slug, n);
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const st = useRef({ cur: 0, target: 0, base: 0, drag: false, lastX: 0, raf: 0, onTurn });
  st.current.onTurn = onTurn;

  useImperativeHandle(ref, () => ({
    goTo: (t: number) => {
      const s = st.current;
      // Най-близкият еквивалентен ъгъл, за да не се превърти излишно.
      const base = Math.floor(s.cur);
      let want = base + t;
      if (want - s.cur > 0.5) want -= 1;
      if (s.cur - want > 0.5) want += 1;
      s.target = want;
      s.base = want;
    },
  }));

  useEffect(() => {
    if (mode === "none" && turn !== undefined) st.current.target = turn;
  }, [mode, turn]);

  useEffect(() => {
    const s = st.current;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const prev = s.cur;
      s.cur += (s.target - s.cur) * Math.min(1, dt * (mode === "none" ? 14 : 7));
      if (Math.abs(s.cur - prev) > 1e-5 || !s.raf) {
        if (frames && loaded && canvas.current) drawFrame(canvas.current, frames, s.cur * n, align);
        else if (img.current) {
          const a = Math.sin(s.cur * Math.PI * 2) * 22;
          img.current.style.transform = `perspective(1200px) rotateY(${a}deg)`;
        }
        s.onTurn?.(((s.cur % 1) + 1) % 1);
      }
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [frames, loaded, n, mode, align]);

  // Пренарисува при промяна на размера.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (frames && loaded && canvas.current) drawFrame(canvas.current, frames, st.current.cur * n, align);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [frames, loaded, n, align]);

  const onMove = (e: React.PointerEvent) => {
    const s = st.current;
    const r = box.current!.getBoundingClientRect();
    if (mode === "hover" && e.pointerType === "mouse") {
      const x = (e.clientX - r.left) / r.width; // 0..1
      // Центърът = текущото лице; краищата = ±половин оборот.
      s.target = s.base + (x - 0.5) * 1.1;
    } else if (s.drag) {
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.target -= dx / Math.max(260, r.width * 0.9);
      s.base = s.target;
    }
  };

  return (
    <div
      ref={box}
      className={`relative touch-pan-y select-none ${mode !== "none" ? "cursor-ew-resize" : ""} ${className}`}
      onPointerMove={mode === "none" ? undefined : onMove}
      onPointerDown={(e) => {
        if (mode === "none") return;
        st.current.drag = true;
        st.current.lastX = e.clientX;
      }}
      onPointerUp={() => (st.current.drag = false)}
      onPointerCancel={() => (st.current.drag = false)}
      onPointerLeave={(e) => {
        st.current.drag = false;
        if (mode === "hover" && e.pointerType === "mouse") st.current.target = st.current.base;
      }}
    >
      {frames && loaded ? (
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      ) : (
        <img
          ref={img}
          src={`img/p/${product.slug}.webp`}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain will-change-transform ${align === "top" ? "object-top" : ""}`}
        />
      )}
      <span className="sr-only">
        {product.name} — {product.kind}
      </span>
    </div>
  );
});
