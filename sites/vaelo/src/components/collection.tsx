import { useRef } from "react";
import { euro, products, type Product } from "../data/products";
import { useStore } from "../lib/store";

/*
  Цялата колекция в мрежа. Картата се накланя след курсора (3D), а при
  посочване дрехата се обръща с гръб — кадърът от средата на завъртането.
*/
export function Collection() {
  return (
    <section id="collection" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-blood">Колекция 001</p>
            <h2 className="mt-4 text-heading font-medium tracking-[-0.05em]">
              Безтегловност<span className="serif-i text-blood">.</span>
            </h2>
          </div>
          <p className="max-w-sm text-lead text-ink-2">Осем дрехи, ушити на малки серии. Посочи карта — дрехата се обръща с гръб.</p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {products.map((p, i) => (
            <li key={p.slug}>
              <Card p={p} i={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ p, i }: { p: Product; i: number }) {
  const { view } = useStore();
  const tilt = useRef<HTMLDivElement>(null);
  const back = p.spin ? `/img/spin/${p.slug}/${String(Math.round(p.spin / 2)).padStart(2, "0")}.webp` : null;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.current.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg) scale(1.03)`;
    tilt.current.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    tilt.current.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (tilt.current) tilt.current.style.transform = "";
  };

  return (
    <button
      type="button"
      onClick={() => view(i)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group block w-full text-left outline-none"
      aria-label={`${p.name} — ${p.kind}, ${euro(p.price)}`}
    >
      <div
        ref={tilt}
        className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-bone-2 transition-transform duration-700 ease-[var(--ease-out-expo)] will-change-transform group-focus-visible:ring-2 group-focus-visible:ring-blood"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgb(255 255 255 / 0.55), transparent 55%)" }}
        />
        <span className="label absolute left-4 top-4 text-muted">{String(i + 1).padStart(2, "0")}</span>
        <img
          src={`/img/p/${p.slug}.webp`}
          alt=""
          loading="lazy"
          className={`absolute inset-[9%] h-[82%] w-[82%] object-contain drop-shadow-[0_24px_24px_rgba(20,18,16,0.18)] transition-all duration-700 ease-[var(--ease-out-expo)] ${back ? "group-hover:scale-95 group-hover:opacity-0" : "group-hover:scale-105"}`}
        />
        {back && (
          <img
            src={back}
            alt=""
            loading="lazy"
            className="absolute inset-[9%] h-[82%] w-[82%] scale-105 object-contain opacity-0 drop-shadow-[0_24px_24px_rgba(20,18,16,0.18)] transition-all duration-700 ease-[var(--ease-out-expo)] group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        <span className="label absolute bottom-4 right-4 translate-y-2 rounded-full bg-ink px-3 py-1.5 text-paper opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          {back ? "Гръб · разгледай" : "Разгледай"}
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-sm text-muted">{p.kind}</p>
        </div>
        <p className="font-medium tabular-nums">{euro(p.price)}</p>
      </div>
    </button>
  );
}
