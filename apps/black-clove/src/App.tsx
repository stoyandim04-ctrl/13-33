import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Lenis from "lenis";
import { Film } from "./Film";
import { Words } from "./words";
import { kitchen, nav, order, orderCta, process, statement, taste, tube } from "./content";

const STUDIO_URL = "https://13-33.vercel.app";

/* Reveal on enter: adds .is-in once. Content is visible without JS/motion. */
function useReveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("motion");
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

/* Scroll-linked progress (0 → 1) of an element through the viewport. */
function useProgress<T extends HTMLElement>(cb: (p: number, el: T) => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      cb(Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height))), el);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cb]);
  return ref;
}

function SectionHead({ eyebrow, title, lead, center = false }: { eyebrow: string; title: string; lead: string; center?: boolean }) {
  return (
    <header className={`sec-head${center ? " center" : ""}`} data-reveal>
      <p className="eyebrow pill">{eyebrow}</p>
      <h2>
        <Words text={title} />
      </h2>
      <p className="lead">{lead}</p>
    </header>
  );
}

function Loader({ progress }: { progress: number }) {
  const done = progress >= 1;
  return (
    <div className={`loader${done ? " is-done" : ""}`} aria-hidden={done}>
      <p className="loader-mark">black clove</p>
      <span className="loader-bar" style={{ "--p": progress } as CSSProperties} />
      <p className="loader-note">Отлежава…</p>
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 40);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a href="#top" className="wordmark" aria-label="Black Clove — начало">
        black clove
      </a>
      <nav aria-label="Основна навигация">
        {nav.map((n) => (
          <a key={n.href} href={n.href}>
            {n.label}
          </a>
        ))}
      </nav>
      <a className="header-cta" href={orderCta.href}>
        {orderCta.label}
      </a>
    </header>
  );
}

function Process() {
  const ref = useProgress<HTMLElement>(
    useCallback((p: number, el: HTMLElement) => el.style.setProperty("--p", p.toFixed(4)), []),
  );
  return (
    <section id="process" ref={ref} className="process section">
      <div className="process-bg" aria-hidden="true">
        <img src="/media/aging.webp" alt="" loading="lazy" />
      </div>
      <div className="wrap">
        <SectionHead {...process} />
        <ol className="steps">
          {process.steps.map((s, i) => (
            <li key={s.n} data-reveal style={{ "--i": i } as CSSProperties}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Taste() {
  const ref = useProgress<HTMLElement>(
    useCallback((p: number, el: HTMLElement) => el.style.setProperty("--p", p.toFixed(4)), []),
  );
  return (
    <section id="taste" ref={ref} className="taste section">
      <div className="wrap taste-grid">
        <figure className="taste-figure" data-reveal>
          <img src="/media/macro.webp" alt="Разрязана скилидка черен чесън отблизо" loading="lazy" />
        </figure>
        <div>
          <SectionHead {...taste} />
          <ul className="notes">
            {taste.notes.map((n, i) => (
              <li key={n.name} data-reveal style={{ "--i": i } as CSSProperties}>
                <span className="note-name">{n.name}</span>
                <span className="note-line" aria-hidden="true" />
                <span className="note-text">{n.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Statement() {
  const ref = useProgress<HTMLElement>(
    useCallback((p: number, el: HTMLElement) => el.style.setProperty("--p", p.toFixed(4)), []),
  );
  return (
    <section ref={ref} className="statement" aria-label={statement.title}>
      <img src="/media/pour.webp" alt="" loading="lazy" />
      <div className="statement-copy" data-reveal>
        <h2>
          <Words text={statement.title} />
        </h2>
        <p>{statement.text}</p>
      </div>
    </section>
  );
}

function Kitchen() {
  const track = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    const tr = track.current;
    if (!el || !tr) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (innerWidth < 900) {
        tr.style.transform = "";
        return;
      }
      const r = el.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const max = tr.scrollWidth - innerWidth;
      tr.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
      el.style.setProperty("--p", p.toFixed(4));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section id="kitchen" ref={ref} className="kitchen">
      <div className="kitchen-stage">
        <div ref={track} className="kitchen-track">
          <div className="kitchen-intro">
            <SectionHead {...kitchen} />
            <span className="kitchen-hint" aria-hidden="true">
              Продължи надолу <i />
            </span>
          </div>
          {kitchen.dishes.map((d, i) => (
            <figure key={d.title} className="dish" style={{ "--i": i } as CSSProperties}>
              <div className="dish-img">
                <img src={d.img} alt={d.title} loading="lazy" />
              </div>
              <figcaption>
                <span className="dish-n">0{i + 1}</span>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="kitchen-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}

function Tube() {
  const ref = useProgress<HTMLElement>(
    useCallback((p: number, el: HTMLElement) => el.style.setProperty("--p", p.toFixed(4)), []),
  );
  return (
    <section id="tube" ref={ref} className="tube section">
      <div className="wrap tube-grid">
        <div className="tube-visual" aria-hidden="true">
          <div className="tube-glow" />
          <img src="/media/tube-open.webp" alt="" loading="lazy" />
        </div>
        <div>
          <SectionHead {...tube} />
          <dl className="facts" data-reveal>
            {tube.facts.map((f) => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
          <a className="button gold" href={orderCta.href} data-reveal>
            {orderCta.label} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Order() {
  const [sent, setSent] = useState(false);
  return (
    <section id="order" className="order section">
      <div className="wrap order-grid">
        <div>
          <SectionHead {...order} />
        </div>
        <form
          className="order-form"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            <span>{order.fields.name}</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            <span>{order.fields.email}</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>{order.fields.qty}</span>
            <input name="qty" type="number" min={1} max={99} defaultValue={1} required />
          </label>
          <label>
            <span>{order.fields.note}</span>
            <textarea name="note" rows={3} />
          </label>
          <button className="button gold" type="submit" disabled={sent}>
            {order.submit} <span aria-hidden="true">→</span>
          </button>
          <p className="order-done" role="status" aria-live="polite">
            {sent ? order.done : ""}
          </p>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer-mark" aria-hidden="true">
        black clove
      </p>
      <div className="wrap footer-row">
        <p>Открий тъмната страна на вкуса.</p>
        <p className="footer-note">
          Концептуален проект на{" "}
          <a href={STUDIO_URL}>13:33 Digital Studio</a>. Визуализациите са създадени за
          презентация.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const onReady = useCallback((p: number) => setProgress((old) => Math.max(old, p)), []);
  useReveal();

  // Smooth inertial scroll; native scroll position stays the source of truth.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!;
      const target = id === "#top" ? 0 : (document.querySelector(id) as HTMLElement | null);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6 });
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  // Never trap the page behind the loader.
  useEffect(() => {
    const t = setTimeout(() => setProgress(1), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Loader progress={progress} />
      <div className="grain" aria-hidden="true" />
      <Header />
      <main id="top" className={progress >= 1 ? "is-ready" : ""}>
        <Film onReady={onReady} />
        <Process />
        <Taste />
        <Statement />
        <Kitchen />
        <Tube />
        <Order />
      </main>
      <Footer />
    </>
  );
}
