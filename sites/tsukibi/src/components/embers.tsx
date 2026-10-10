import { useEffect, useRef } from "react";

/** Искри, които се издигат от въглените. Платно 2D, спира извън екрана. */
export function Embers({ className = "", density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0, h = 0, raf = 0, visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -1e4, y: -1e4 };

    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; seed: number };
    let parts: P[] = [];
    const spawn = (initial = false): P => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.4 + Math.random() * 1.3),
      r: 0.6 + Math.random() * 1.9,
      life: 0,
      max: 220 + Math.random() * 380,
      seed: Math.random() * 1000,
    });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(140, (w * h) / 11000) * density);
      parts = Array.from({ length: count }, () => spawn(true));
    };
    resize();

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.life++;
        p.x += p.vx + Math.sin(t * 0.001 + p.seed) * 0.35;
        p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) { p.x += dx * 0.02; p.y += dy * 0.02; }
        const k = p.life / p.max;
        if (k >= 1 || p.y < -20) { parts[i] = spawn(); continue; }
        const a = Math.sin(Math.PI * k) * (0.55 + 0.45 * Math.sin(t * 0.01 + p.seed));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(255,${170 - k * 80},${80 - k * 60},${a})`);
        g.addColorStop(0.35, `rgba(255,91,36,${a * 0.45})`);
        g.addColorStop(1, "rgba(255,60,20,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
