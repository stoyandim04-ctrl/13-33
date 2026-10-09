import * as React from "react";
import {
  Check,
  LoaderCircle,
  MousePointer2,
  ShoppingBag,
  Sparkles,
  Workflow,
} from "lucide-react";

import { process, services, type Service } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Bento of service cards, each with a small live visual. Visuals are
 * decorative — no numbers, results or deadlines — and only animate while the
 * section is on screen (`data-live`). Reduced motion stills them globally.
 */
export function Services() {
  const ref = React.useRef<HTMLElement>(null);
  const [live, setLive] = React.useState(false);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setLive(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="uslugi"
      aria-labelledby="uslugi-title"
      data-live={live || undefined}
      data-seen={seen || undefined}
      className="svc section overflow-hidden"
    >
      <div aria-hidden="true" className="svc-backdrop" />
      <div className="container-wide relative">
        <header className="svc-head mx-auto max-w-[46rem] text-center">
          <p className="svc-pill">Услуги</p>
          <h2
            id="uslugi-title"
            className="font-display text-heading mt-6 font-[500] tracking-[-0.045em] text-balance"
          >
            Решения според това, от което бизнесът ти има нужда.
          </h2>
          <p className="text-lead text-muted-foreground mx-auto mt-6 max-w-[44ch] text-pretty">
            Не продаваме инструменти, а работещ резултат — по-силно представяне,
            повече запитвания, по-лесни продажби или по-подредени процеси.
          </p>
        </header>

        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-24 lg:grid-cols-12 lg:gap-5">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} large={i < 3} live={live} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  large,
  live,
}: {
  service: Service;
  index: number;
  large: boolean;
  live: boolean;
}) {
  const Visual = VISUALS[service.id] ?? VisualOrbit;
  return (
    <li
      className={cn(
        "svc-card group",
        large ? "lg:col-span-4" : "lg:col-span-3",
        index === 2 && "sm:col-span-2 lg:col-span-4",
      )}
      style={{ "--i": index } as React.CSSProperties}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div className={cn("svc-visual", large ? "h-[15.5rem]" : "h-[12rem]")} aria-hidden="true">
        <Visual live={live} />
      </div>
      <div className="px-3 pt-6 pb-3 md:px-4">
        <h3 className="text-title font-[600] tracking-[-0.03em]">{service.name}</h3>
        <p className="text-muted-foreground mt-2.5 text-[0.95rem] leading-relaxed text-pretty">
          {service.body}
        </p>
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {service.includes.map((x) => (
            <li key={x} className="svc-chip">
              {x}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* ---------- Visuals ---------- */

type VisualProps = { live: boolean };

/** Sites: the build moving through our own process steps. */
function VisualSteps({ live }: VisualProps) {
  const steps = process.slice(0, 4).map((p) => p.name.split(" ")[0]);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (!live || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % (steps.length + 1)), 1500);
    return () => clearInterval(t);
  }, [live, steps.length]);

  return (
    <div className="relative grid h-full place-items-center">
      <Rings />
      <ol className="relative grid w-[min(15rem,80%)] gap-2.5">
        {steps.map((name, i) => {
          const done = i < active;
          const now = i === active;
          return (
            <li key={name} className={cn("svc-step", now && "is-now", done && "is-done")}>
              <span className="svc-step-icon">
                {done ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : now ? (
                  <LoaderCircle className="svc-spin size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className="truncate">{name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Stores: a product card, a click, the bag fills. */
function VisualStore() {
  return (
    <div className="relative grid h-full place-items-center">
      <Rings />
      <div className="svc-product relative w-[min(13.5rem,72%)]">
        <div className="svc-product-img" />
        <div className="mt-3 h-2 w-3/4 rounded-full bg-white/15" />
        <div className="mt-2 h-2 w-1/2 rounded-full bg-white/8" />
        <div className="svc-add mt-4">
          <ShoppingBag className="size-3.5" /> Добави
        </div>
        <span className="svc-bag">
          <ShoppingBag className="size-4" />
          <span className="svc-bag-dot" />
        </span>
        <MousePointer2 className="svc-cursor size-5" fill="currentColor" />
      </div>
    </div>
  );
}

/** Funnels: many visitors narrowing into prepared inquiries. */
function VisualBars() {
  const bars = [92, 84, 76, 70, 62, 55, 47, 40, 34];
  return (
    <div className="svc-bars">
      {bars.map((h, i) => (
        <span key={i} style={{ "--h": `${h}%`, "--b": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

/** Portals: a client's own dashboard rows. */
function VisualPortal() {
  return (
    <div className="relative grid h-full place-items-center">
      <div className="svc-window w-[min(16rem,82%)]">
        {[0, 1, 2].map((r) => (
          <div key={r} className="flex items-center gap-3 py-2">
            <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-white/25 to-white/5" />
            <span className="grid flex-1 gap-1.5">
              <span className="h-1.5 w-4/5 rounded-full bg-white/18" />
              <span className="h-1.5 w-2/5 rounded-full bg-white/8" />
            </span>
            <span className={cn("svc-toggle", r === 1 && "svc-toggle-anim")} data-on={r === 0 || undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Web apps: code arriving line by line. */
function VisualCode() {
  const lines = [62, 44, 78, 36, 56];
  return (
    <div className="relative grid h-full place-items-center">
      <div className="svc-window w-[min(16rem,82%)]">
        <div className="mb-3 flex gap-1.5">
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
        </div>
        {lines.map((w, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <span className="w-3 text-[0.6rem] text-white/25 tabular-nums">{i + 1}</span>
            <span
              className="svc-code h-1.5 rounded-full"
              style={{ "--w": `${w}%`, "--c": i } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Automations: systems orbiting one flow. */
function VisualOrbit() {
  return (
    <div className="relative grid h-full place-items-center">
      <Rings />
      <div className="svc-orbit">
        <span />
        <span />
        <span />
      </div>
      <span className="svc-core">
        <Workflow className="size-5" />
      </span>
    </div>
  );
}

/** AI interfaces: a question, a typing reply. */
function VisualChat() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-2.5 px-6">
      <div className="svc-bubble self-end">
        <span className="h-1.5 w-20 rounded-full bg-white/30" />
      </div>
      <div className="svc-bubble svc-bubble-ai self-start">
        <Sparkles className="size-3.5 shrink-0 text-white/70" />
        <span className="svc-typing">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

function Rings() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      {[70, 120, 175, 235].map((r) => (
        <circle key={r} cx="200" cy="130" r={r} fill="none" stroke="rgb(255 255 255 / 0.05)" />
      ))}
    </svg>
  );
}

const VISUALS: Record<string, (p: VisualProps) => React.ReactElement> = {
  sites: VisualSteps,
  stores: VisualStore,
  funnels: VisualBars,
  portals: VisualPortal,
  apps: VisualCode,
  automation: VisualOrbit,
  ai: VisualChat,
};
