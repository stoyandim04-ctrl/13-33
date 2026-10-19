"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ASK, MENU, UI_COPY } from "@/lib/copy";
import { anchors, live, nav, setUI, useUI, type Lang } from "@/lib/store";
import { ANNOTATIONS, frame } from "@/lib/timeline";
import { useAmbient } from "./useAmbient";

const pad = (n: number) => String(n).padStart(2, "0");

function Logo() {
  return (
    <a href="#" aria-label="NOCTA" className="wordmark" onClick={(e) => { e.preventDefault(); nav.request = 0; }}>
      N<span className="text-cyan">O</span>CTA
    </a>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      {[2, 7, 12].flatMap((x) => [2, 7, 12].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill="currentColor" />))}
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M7 0.5 C7.6 4.6 9.4 6.4 13.5 7 C9.4 7.6 7.6 9.4 7 13.5 C6.4 9.4 4.6 7.6 0.5 7 C4.6 6.4 6.4 4.6 7 0.5Z" fill="currentColor" />
    </svg>
  );
}

function LangSwitch() {
  const lang = useUI((s) => s.lang);
  const set = (l: Lang) => {
    setUI({ lang: l });
    try {
      localStorage.setItem("nocta-lang", l);
    } catch {}
    document.documentElement.lang = l;
  };
  return (
    <div className="mono flex items-center gap-1.5 text-ink-60">
      {(["bg", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-35">/</span>}
          <button onClick={() => set(l)} className={`hud-link uppercase ${lang === l ? "text-ink" : ""}`}>
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

function Header() {
  const lang = useUI((s) => s.lang);
  const sound = useUI((s) => s.sound);
  const menu = useUI((s) => s.menu);
  useAmbient(sound);
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-[var(--gutter)] pt-5 md:pt-7">
      <Logo />
      <div className="flex items-center gap-4 md:gap-7">
        <div className="hidden md:block">
          <LangSwitch />
        </div>
        <button className="mono hud-link hidden items-center gap-2 text-ink-60 sm:flex" onClick={() => setUI({ sound: !sound })} aria-pressed={sound}>
          {UI_COPY.sound[lang]}
          <span className={`sound-line ${sound ? "is-on" : ""}`} aria-hidden>
            <i /><i /><i /><i />
          </span>
        </button>
        <button className="glass mono flex h-10 w-[150px] items-center justify-between rounded-full pl-4 pr-3 md:w-[210px]" onClick={() => setUI({ menu: !menu })} aria-expanded={menu}>
          <span>{menu ? UI_COPY.close[lang] : UI_COPY.menu[lang]}</span>
          <DotsIcon />
        </button>
      </div>
    </header>
  );
}

function Menu() {
  const open = useUI((s) => s.menu);
  const lang = useUI((s) => s.lang);
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-item]");
    if (open) {
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { opacity: 0, backdropFilter: "blur(0px)" }, { opacity: 1, backdropFilter: "blur(18px)", duration: 0.6, ease: "power3.out" });
      gsap.fromTo(items, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.1 });
    } else {
      gsap.to(el, { opacity: 0, duration: 0.4, ease: "power2.in", onComplete: () => gsap.set(el, { display: "none" }) });
    }
  }, [open]);

  return (
    <div ref={root} className="menu-overlay fixed inset-0 z-20 hidden flex-col justify-center px-[var(--gutter)]" onClick={() => setUI({ menu: false })}>
      <nav className="flex flex-col gap-2">
        {MENU.map((m, i) => (
          <div key={i} className="overflow-hidden">
            <button
              data-item
              className="menu-item group flex items-baseline gap-5"
              onClick={(e) => {
                e.stopPropagation();
                nav.request = m.to;
                setUI({ menu: false });
              }}
            >
              <span className="mono text-ink-35">{pad(i + 1)}</span>
              <span>{m.label[lang]}</span>
            </button>
          </div>
        ))}
      </nav>
      <div className="mt-12 md:hidden">
        <LangSwitch />
      </div>
    </div>
  );
}

function Ask() {
  const open = useUI((s) => s.ask);
  const lang = useUI((s) => s.lang);
  const panel = useRef<HTMLDivElement>(null);
  const answer = useRef<HTMLParagraphElement>(null);
  const active = useRef(-1);

  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      gsap.set(el, { display: "block" });
      gsap.fromTo(el, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out" });
    } else {
      gsap.to(el, { opacity: 0, y: 10, duration: 0.3, ease: "power2.in", onComplete: () => gsap.set(el, { display: "none" }) });
    }
  }, [open]);

  const pick = (i: number) => {
    active.current = i;
    const a = answer.current;
    if (!a) return;
    const text = ASK[i].a[lang];
    // type the answer out, quickly
    const o = { n: 0 };
    gsap.killTweensOf(o);
    gsap.to(o, {
      n: text.length,
      duration: Math.min(1.6, text.length * 0.012),
      ease: "none",
      onUpdate: () => {
        a.textContent = text.slice(0, Math.round(o.n));
      },
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 md:bottom-8">
      <div ref={panel} className="glass ask-panel absolute bottom-14 left-1/2 hidden w-[min(88vw,380px)] -translate-x-1/2 rounded-2xl p-5">
        <p className="mono mb-3 text-ink-35">NOCTA / {lang === "bg" ? "ВЪПРОСИ" : "QUESTIONS"}</p>
        <div className="flex flex-col gap-1.5">
          {ASK.map((q, i) => (
            <button key={i} className="ask-q text-left" onClick={() => pick(i)}>
              {q.q[lang]}
            </button>
          ))}
        </div>
        <p ref={answer} className="ask-a mt-4 min-h-[3.5em] text-ink-60" aria-live="polite" />
      </div>
      <button className="glass pill mono flex h-10 items-center gap-2.5 rounded-full px-5" onClick={() => setUI({ ask: !open })} aria-expanded={open}>
        <SparkIcon />
        {UI_COPY.ask[lang]}
      </button>
    </div>
  );
}

/** Labels pinned to 3D points, with leader lines that draw themselves. */
function Annotations() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const els = new Map<string, { box: HTMLElement; line: SVGLineElement; dot: HTMLElement; on: boolean; w: number }>();
    root.current?.querySelectorAll<HTMLElement>("[data-ann]").forEach((box) => {
      const id = box.dataset.ann!;
      els.set(id, {
        box,
        line: root.current!.querySelector(`[data-line="${id}"]`)!,
        dot: root.current!.querySelector(`[data-dot="${id}"]`)!,
        on: false,
        w: 0,
      });
    });
    const loop = () => {
      const p = live.progress;
      const scale = live.portrait ? 0.55 : 1;
      for (const a of ANNOTATIONS) {
        const e = els.get(a.id);
        const pt = anchors[a.anchor];
        if (!e) continue;
        const on = !!pt && pt.visible && p >= a.from && p < a.to;
        if (on !== e.on) {
          e.on = on;
          e.box.classList.toggle("is-on", on);
          e.line.classList.toggle("is-on", on);
          e.dot.classList.toggle("is-on", on);
        }
        if (!pt) continue;
        // flip to the other side if the label would leave the screen
        const w = (e.w ||= e.box.offsetWidth);
        let dx = a.dx * scale;
        if (dx > 0 && pt.x + dx + w > innerWidth - 16) dx = -dx;
        if (dx < 0 && pt.x + dx - w < 16) dx = -dx;
        const lx = pt.x + dx;
        const ly = Math.min(Math.max(pt.y + a.dy * scale, 80), innerHeight - 90);
        e.dot.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        e.line.setAttribute("x1", String(pt.x));
        e.line.setAttribute("y1", String(pt.y));
        e.line.setAttribute("x2", String(lx));
        e.line.setAttribute("y2", String(ly));
        e.box.style.transform = `translate(${lx}px, ${ly}px) translate(${dx < 0 ? "-100%" : "0"}, -50%)`;
        e.box.style.textAlign = dx < 0 ? "right" : "left";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-10" aria-hidden>
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {ANNOTATIONS.map((a) => (
          <line key={a.id} data-line={a.id} className="ann-line" pathLength={1} />
        ))}
      </svg>
      {ANNOTATIONS.map((a) => (
        <span key={a.id} data-dot={a.id} className="ann-dot" />
      ))}
      {ANNOTATIONS.map((a) => (
        <div key={a.id} data-ann={a.id} className="ann mono normal-case">
          <span className="block text-ink">{a.label}</span>
          {a.sub && <span className="block text-ink-35">{a.sub}</span>}
        </div>
      ))}
    </div>
  );
}

function SceneCounter() {
  const scene = useUI((s) => s.scene);
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${live.progress})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="mono fixed bottom-7 right-[var(--gutter)] z-30 hidden w-[140px] flex-col items-end gap-2 md:flex">
      <span>
        <span className="text-ink">{pad(scene + 1)}</span>
        <span className="text-ink-35"> / 06</span>
      </span>
      <span className="relative block h-px w-full bg-ink-12">
        <span ref={bar} className="absolute inset-0 origin-left bg-cyan" />
      </span>
    </div>
  );
}

function Footer() {
  const lang = useUI((s) => s.lang);
  return (
    <p className="mono concept fixed bottom-7 left-[var(--gutter)] z-30 hidden max-w-[300px] text-ink-35 md:block">
      {UI_COPY.concept[lang]}
    </p>
  );
}

function ScrollHint() {
  const lang = useUI((s) => s.lang);
  const scene = useUI((s) => s.scene);
  const loaded = useUI((s) => s.loaded);
  return (
    <div className={`scroll-hint mono fixed right-[var(--gutter)] top-1/2 z-10 hidden -translate-y-1/2 items-center gap-3 md:flex ${loaded && scene === 0 ? "is-on" : ""}`}>
      <span className="eq" aria-hidden>
        <i /><i /><i /><i /><i />
      </span>
      <span className="text-ink-60">{UI_COPY.scroll[lang]}</span>
    </div>
  );
}

/** White flash that hides the jump back to the hero. */
function Flash() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (el.current) el.current.style.opacity = String(live.reduced ? frame.flash * 0.4 : frame.flash);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} className="flash pointer-events-none fixed inset-0 z-[5]" aria-hidden />;
}

export function Hud() {
  return (
    <>
      <Flash />
      <Annotations />
      <ScrollHint />
      <Menu />
      <Header />
      <Ask />
      <SceneCounter />
      <Footer />
    </>
  );
}
