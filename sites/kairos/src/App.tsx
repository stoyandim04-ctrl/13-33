import { useEffect, useRef, useState } from "react";
import type { Stage } from "./lib/scene";
import { Tick } from "./lib/sound";
import { addJob, lockScroll, scrollToProgress, useLenis } from "./lib/scroll";

/*
  KAIROS — един закачен кадър и дълъг скрол. Сцената рисува всичко; текстът
  са субтитри върху филма, всеки с прозорец в скрола (от → до). Нищо не рисува
  React на всеки кадър — цикълът пише направо в DOM.
*/

type Chapter = { id: string; from: number; to: number; no: string; title: string; body: string; side?: "left" | "right" };

const CHAPTERS: Chapter[] = [
  {
    id: "glass",
    from: 0.205,
    to: 0.3,
    no: "I",
    title: "Through the glass",
    body: "A sapphire caseback, 1.2 mm thick. On the other side the scale breaks: a millimetre becomes a hall.",
  },
  {
    id: "train",
    from: 0.325,
    to: 0.505,
    no: "II",
    title: "The going train",
    body: "Barrel 80 → pinion 10. Centre 80 → 10. Third 75 → 10. Fourth 80 → 8. Every tooth you pass is in mesh — nothing here is animated by hand.",
    side: "right",
  },
  {
    id: "balance",
    from: 0.54,
    to: 0.645,
    no: "III",
    title: "The balance",
    body: "Two and a half swings a second — 18,000 beats an hour. In here time runs ten times slower, so you can stand beneath it.",
  },
  {
    id: "rubies",
    from: 0.675,
    to: 0.8,
    no: "IV",
    title: "Rubies and the spring",
    body: "Two ruby pallets let the escape wheel go one tooth per beat. Behind them, the mainspring: six turns of the barrel, forty-eight hours, coiled in blued steel.",
    side: "right",
  },
  {
    id: "dial",
    from: 0.84,
    to: 0.925,
    no: "V",
    title: "Under the dial",
    body: "The hands ride the cannon pinion on friction. Set them, and the train never stops.",
  },
];

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clock = (s: number) => {
  const t = ((s % 86400) + 86400) % 86400;
  return `${pad(t / 3600)}:${pad((t % 3600) / 60)}:${pad(t % 60)}`;
};
const fade = (p: number, a: number, b: number, edge = 0.018) =>
  Math.max(0, Math.min(1, (p - a) / edge, (b - p) / edge));

export default function App() {
  useLenis();
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const sound = useRef(new Tick());
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const hud = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const rate = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prologue = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const boxes = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    lockScroll(true);
    window.scrollTo(0, 0);
    let alive = true;
    let dispose = () => {};
    // Брояч до 100, докато three.js и сцената се зареждат.
    let fake = 0;
    const iv = setInterval(() => {
      fake = Math.min(88, fake + 3 + Math.random() * 6);
      setLoaded((l) => Math.max(l, Math.floor(fake)));
    }, 90);
    import("./lib/scene").then(async ({ Stage }) => {
      if (!alive || !canvas.current) return;
      const s = new Stage(canvas.current);
      dispose = () => s.dispose();
      await s.init();
      if (!alive) return;
      stage.current = s;
      clearInterval(iv);
      setLoaded(100);
      setTimeout(() => alive && setReady(true), 350);
    });
    const onResize = () => stage.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      clearInterval(iv);
      window.removeEventListener("resize", onResize);
      dispose();
    };
  }, []);

  useEffect(() => {
    return addJob((t) => {
      const s = stage.current;
      if (!s) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      s.progress = p;
      const f = s.render(t);
      if (f.ticked) sound.current.tick(f.tick, f.rate, f.inside);
      sound.current.ambience(f.inside, f.rate);

      if (time.current) time.current.textContent = clock(f.display);
      if (rate.current) rate.current.textContent = `×${f.rate.toFixed(2)}`;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (boxes.current) boxes.current.style.setProperty("--lb", String(f.inside));
      if (prologue.current) prologue.current.style.opacity = String(fade(p, -1, 0.06, 0.04));
      if (finale.current) {
        const o = Math.max(0, Math.min(1, (p - 0.965) / 0.03));
        finale.current.style.opacity = String(o);
        finale.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
      if (now.current) now.current.textContent = clock(f.time);
      for (const c of CHAPTERS) {
        const el = chapterRefs.current[c.id];
        if (!el) continue;
        const o = fade(p, c.from, c.to);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * 14}px, 0)`;
        el.style.filter = `blur(${(1 - o) * 6}px)`;
      }
    });
  }, []);

  const enter = async (withSound: boolean) => {
    setEntered(true);
    setSoundOn(withSound);
    await sound.current.enable(withSound);
    lockScroll(false);
  };
  const toggleSound = async () => {
    const on = !soundOn;
    setSoundOn(on);
    await sound.current.enable(on);
  };

  return (
    <>
      <canvas ref={canvas} className="fixed inset-0 h-full w-full" aria-hidden />

      {/* Кинематографични ленти — затварят се, когато влезем в механизма. */}
      <div ref={boxes} className="letterbox" aria-hidden>
        <i />
        <i />
      </div>
      <div className="grain" aria-hidden />

      {/* Горе: марката и звукът. */}
      <header ref={hud} className={`hud-top ${entered ? "is-on" : ""}`}>
        <span className="brand">KAIROS</span>
        <span className="mono hidden sm:inline">Calibre K-13 · 18 000 A/h</span>
        <button type="button" className="mono sound" onClick={toggleSound} aria-pressed={soundOn}>
          <span className={`eq ${soundOn ? "is-on" : ""}`} aria-hidden>
            <b />
            <b />
            <b />
          </span>
          Sound {soundOn ? "on" : "off"}
        </button>
      </header>

      {/* Долу: времето на механизма (забавя се заедно с него) и напредъкът. */}
      <footer className={`hud-bottom ${entered ? "is-on" : ""}`}>
        <div className="mono">
          Movement time <span ref={time} className="ink">--:--:--</span>
          <span className="sep">·</span>
          <span ref={rate}>×1.00</span>
        </div>
        <div className="track">
          <div ref={bar} className="track-fill" />
        </div>
      </footer>

      {/* Пролог. */}
      <div ref={prologue} className="prologue">
        <p className="mono eyebrow">Calibre K-13 · a concept by 13:33</p>
        <h1 className="display">KAIROS</h1>
        <p className="lead">A watch you can walk into.</p>
        <p className="mono hint">
          Scroll <span aria-hidden>↓</span>
        </p>
      </div>

      {/* Субтитрите на главите. */}
      {CHAPTERS.map((c) => (
        <div
          key={c.id}
          ref={(el) => {
            chapterRefs.current[c.id] = el;
          }}
          className={`chapter ${c.side === "right" ? "is-right" : ""}`}
          style={{ opacity: 0 }}
        >
          <p className="mono eyebrow">
            Chapter {c.no} <span className="rule" />
          </p>
          <h2 className="title">{c.title}</h2>
          <p className="body">{c.body}</p>
        </div>
      ))}

      {/* Финал. */}
      <div ref={finale} className="finale" style={{ opacity: 0 }}>
        <p className="mono eyebrow">KAIROS · καιρός — the right moment</p>
        <p className="mega">13:33</p>
        <p className="lead">
          The hands stopped. The train didn’t — it’s <span ref={now} className="ink">--:--:--</span> inside.
        </p>
        <div className="end-actions">
          <button type="button" className="pill" onClick={() => scrollToProgress(0)}>
            Enter again
          </button>
          <a className="mono link" href="https://digistudio13.com" target="_blank" rel="noreferrer">
            A concept by 13:33 ↗
          </a>
        </div>
        <p className="mono note">KAIROS and calibre K-13 are invented. The movement on this page is real geometry — it keeps time.</p>
      </div>

      {/* Скролът — само дължина; всичко се вижда върху платното. */}
      <main aria-label="KAIROS — scroll through the movement" style={{ height: "1500vh" }} />

      {/* Вход: зареждане и избор на звук. */}
      <div className={`gate ${entered ? "is-gone" : ""}`}>
        <p className="mono eyebrow">KAIROS · Calibre K-13</p>
        <p className="count" aria-live="polite">
          {String(loaded).padStart(3, "0")}
        </p>
        <p className="lead gate-lead">The sound of this site is a ticking. Headphones help.</p>
        <div className={`gate-actions ${ready ? "is-ready" : ""}`}>
          <button type="button" className="pill" disabled={!ready} onClick={() => enter(true)}>
            Enter with sound
          </button>
          <button type="button" className="mono link" disabled={!ready} onClick={() => enter(false)}>
            Enter in silence
          </button>
        </div>
      </div>
    </>
  );
}
