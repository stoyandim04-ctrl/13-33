import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, ChevronRight, Menu, Plus, X } from "lucide-react";
import { nutrition, programs, type Program } from "./data";

const links = [
  { href: "#about", label: "За Анна" },
  { href: "#programs", label: "Програми" },
  { href: "#nutrition", label: "Хранене" },
  { href: "#contact", label: "Контакт" },
];

const CUTOUT = "/anna/anna-cutout.webp";
const PHOTO = "/anna/anna-waterfall.webp";
const HERO = "/anna/anna-flex-cutout.webp";

// Photos Anna supplied on 2026-10-10. The words are typography for the frames,
// not claims about her.
const frames = [
  { src: "/anna/anna-window.webp", w: 933, h: 1400, word: "ГРАЦИЯ", alt: "Анна Димитрова в профил пред светъл прозорец, ръцете вдигнати" },
  { src: "/anna/anna-gym.webp", w: 960, h: 640, word: "СИЛА", alt: "Анна Димитрова показва бицепс в залата" },
  { src: "/anna/anna-rest.webp", w: 933, h: 1400, word: "ФОКУС", alt: "Анна Димитрова облегната на кушетка" },
];

// Reveals sections once as they enter the viewport. Content stays visible
// without JS and under reduced motion (see `.motion` in style.css).
function useReveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("motion");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function ProgramDialog({
  program,
  onClose,
}: {
  program: Program | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el || !program) return;
    const previous = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = previous;
    };
  }, [program]);
  return (
    <dialog
      ref={dialog}
      className="program-dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {program && (
        <>
          <div className={`dialog-cover cover-${program.id}`} aria-hidden="true">
            <span className="cover-word">{program.word}</span>
            <img src={CUTOUT} alt="" />
          </div>
          <div className="dialog-body">
            <button
              className="dialog-close icon-button"
              onClick={onClose}
              aria-label="Затвори подробностите"
            >
              <X />
            </button>
            <p className="eyebrow">{program.category}</p>
            <h2 id="dialog-title">{program.name}</h2>
            <p className="dialog-subtitle">{program.subtitle}</p>
            {program.duration && <p className="duration">{program.duration}</p>}
            <div className="status-note">
              <span className="status-dot" />
              Предстояща програма
            </div>
            <p>
              Програмата е в подготовка. Съдържанието, условията и началото
              предстои да бъдат обявени.
            </p>
            <button className="button dark" onClick={onClose}>
              Обратно към програмите <ChevronRight size={17} />
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Program | null>(null);
  const menuDialog = useRef<HTMLDialogElement>(null);
  useReveal();
  useEffect(() => {
    const el = menuDialog.current;
    if (!el || !menuOpen) return;
    const previous = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <a className="skip-link" href="#main">
        Към съдържанието
      </a>
      <div className="grain" aria-hidden="true" />
      <div className="review-banner">
        Дизайн концепция за преглед <span>·</span> Програмите още не се
        предлагат
      </div>
      <header className="site-header">
        <div className="wrap header-inner">
          <a className="wordmark" href="#home" aria-label="Strong Muse — начало">
            <span className="wordmark-star">✷</span> STRONG MUSE
          </a>
          <nav className="desktop-nav" aria-label="Основна навигация">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <button
            className="icon-button menu-button"
            aria-label="Отвори менюто"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <dialog
        id="mobile-navigation"
        ref={menuDialog}
        className="menu-dialog"
        aria-label="Мобилна навигация"
        onCancel={closeMenu}
      >
        <button
          className="icon-button dialog-close"
          aria-label="Затвори менюто"
          onClick={closeMenu}
        >
          <X />
        </button>
        <p className="eyebrow">Strong Muse</p>
        <nav>
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
              <ArrowUpRight />
            </a>
          ))}
        </nav>
      </dialog>

      <main id="main">
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-leak" aria-hidden="true" />
          <span className="hero-word" aria-hidden="true">
            MUSE
          </span>
          <div className="hero-figure">
            <img
              src={HERO}
              alt="Анна Димитрова показва бицепси"
              width={1252}
              height={1500}
              fetchPriority="high"
            />
          </div>
          <span className="hero-side left" aria-hidden="true">
            СИЛА ✷ ДВИЖЕНИЕ
          </span>
          <span className="hero-side right" aria-hidden="true">
            STRONG ✷ MUSE
          </span>
          <div className="hero-copy wrap">
            <p className="eyebrow">STRONG MUSE · АННА ДИМИТРОВА</p>
            <h1 id="hero-title">
              <span>СИЛАТА Е В ТЕБ.</span>
              <br />
              <span>ДАЙ И ДВИЖЕНИЕ !</span>
            </h1>
            <p className="hero-subtitle">Бъди своето вдъхновение</p>
            <div className="hero-actions">
              <a href="#programs" className="button dark">
                Разгледай програмите <ArrowUpRight size={18} />
              </a>
              <a className="button ghost" href="#about">
                За Анна
              </a>
            </div>
          </div>
          <div className="letterbox top" aria-hidden="true" />
          <div className="letterbox bottom" aria-hidden="true" />
          <a className="scroll-link" href="#about" aria-label="Към следващата секция">
            <ArrowDown size={16} />
          </a>
        </section>

        <section id="about" className="feature wrap" aria-labelledby="about-title">
          <h2 id="about-title" className="sr-only">
            За Анна
          </h2>
          <ul className="film" aria-label="Снимки на Анна">
            {frames.map((f, i) => (
              <li
                key={f.src}
                className={`film-frame ${f.w > f.h ? "wide" : "tall"}`}
                data-reveal
                style={{ "--i": i } as CSSProperties}
              >
                <figure>
                  <img src={f.src} alt={f.alt} width={f.w} height={f.h} loading="lazy" />
                  <figcaption aria-hidden="true">
                    <span>SM · 0{i + 1}</span>
                    <strong>{f.word}</strong>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section id="programs" className="section wrap" aria-labelledby="programs-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">02 / ТВОЯТА ПОСОКА</p>
            <h2 id="programs-title">
              Движение с <em>намерение.</em>
            </h2>
            <p className="section-lead">
              Четири посоки за Strong Muse. Програмите са в подготовка.
            </p>
          </div>
          <div className="card-grid program-grid">
            {programs.map((p, i) => (
              <article
                key={p.id}
                className={`program-card cover-${p.id}`}
                data-reveal
                style={{ "--i": i } as CSSProperties}
              >
                <div className="cover" aria-hidden="true">
                  {p.duration && <span className="cover-meta">{p.duration}</span>}
                  <span className="cover-word">{p.word}</span>
                  <img src={CUTOUT} alt="" loading="lazy" />
                  <span className="planned-label">Предстояща програма</span>
                </div>
                <div className="card-label">
                  <h3>{p.name}</h3>
                  <p>{p.subtitle}</p>
                  <button
                    className="card-link"
                    onClick={() => setSelected(p)}
                    aria-label={`Виж подробности за ${p.name}`}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="nutrition" className="section wrap" aria-labelledby="nutrition-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">03 / ХРАНЕНЕ</p>
            <h2 id="nutrition-title">
              Място за <em>баланс.</em>
            </h2>
            <p className="section-lead">
              Хранителни материали в подготовка. Още не се предлагат за покупка.
            </p>
          </div>
          <div className="card-grid nutrition-grid">
            {nutrition.map((n, i) => (
              <article
                className="nutrition-card"
                key={n.number}
                data-reveal
                style={{ "--i": i } as CSSProperties}
              >
                <div className="cover book">
                  <img
                    className="book-cover"
                    src={n.cover}
                    alt={`Корица на „${n.title}“`}
                    loading="lazy"
                  />
                </div>
                <div className="card-label">
                  <h3>{n.title}</h3>
                  <p>{n.type} · В подготовка</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section wrap" aria-labelledby="faq-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">04 / ДОБРЕ Е ДА ЗНАЕШ</p>
            <h2 id="faq-title">
              Преди първата <em>стъпка.</em>
            </h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>
                Мога ли вече да се запиша? <Plus size={19} />
              </summary>
              <p>
                Програмите са в подготовка. Записвания и покупки още не са
                отворени.
              </p>
            </details>
            <details>
              <summary>
                Ще има ли домашни тренировки? <Plus size={19} />
              </summary>
              <p>
                HIIT VIBES AT HOME е планирана посока за домашни HIIT
                тренировки. Форматът и необходимото оборудване предстои да бъдат
                уточнени.
              </p>
            </details>
            <details>
              <summary>
                Как ще получа хранителните материали? <Plus size={19} />
              </summary>
              <p>
                Начинът на достъп и условията още не са определени. Материалите
                не са достъпни за изтегляне в тази концепция.
              </p>
            </details>
          </div>
        </section>

        <section id="contact" className="contact-section" aria-labelledby="contact-title">
          <img className="contact-photo" src={PHOTO} alt="" loading="lazy" />
          <div className="wrap contact-inner" data-reveal>
            <p className="eyebrow">STRONG MUSE</p>
            <h2 id="contact-title">
              Бъди своето <em>вдъхновение.</em>
            </h2>
            <p>Контактите на Анна ще бъдат добавени след потвърждение.</p>
            <a href="#programs" className="button light">
              Разгледай посоките <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
      </main>
      <footer className="site-footer wrap">
        <a className="footer-brand" href="#home">
          ✷ STRONG MUSE
        </a>
        <p>Анна Димитрова</p>
        <a href="#home">
          Към началото <ArrowUpRight size={14} />
        </a>
        <p className="footer-note">
          Концепция за преглед · Визията и условията предстои да бъдат одобрени.
        </p>
      </footer>
      <ProgramDialog program={selected} onClose={() => setSelected(null)} />
    </>
  );
}
