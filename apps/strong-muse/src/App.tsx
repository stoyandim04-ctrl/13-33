import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronRight,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { nutrition, programs, type Program } from "./data";

const links = [
  { href: "#about", label: "За Анна" },
  { href: "#programs", label: "Програми" },
  { href: "#nutrition", label: "Хранене" },
  { href: "#contact", label: "Контакт" },
];

function MuseArtwork({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "muse-art small-art" : "muse-art"}
      viewBox="0 0 480 560"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={small ? "art-small" : "art-large"}
          x1="70"
          y1="40"
          x2="400"
          y2="530"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#efc5b3" />
          <stop offset="1" stopColor="#aa6867" />
        </linearGradient>
      </defs>
      <ellipse
        cx="242"
        cy="303"
        rx="182"
        ry="223"
        stroke="currentColor"
        strokeOpacity=".25"
      />
      <ellipse
        cx="242"
        cy="303"
        rx="151"
        ry="190"
        stroke="currentColor"
        strokeOpacity=".14"
      />
      <path
        d="M237 103c35 0 52 27 47 54-3 19-15 32-33 38l-3 27c51 22 69 58 56 100-9 27-33 46-29 83l23 119h-59l-16-124-29 124h-55l42-178c7-28-13-48-7-78 5-29 25-49 51-56l1-20c-27-8-41-26-38-48 3-25 21-41 49-41Z"
        fill={`url(#${small ? "art-small" : "art-large"})`}
      />
      <path
        d="M214 240c-37 22-57 42-79 83l-46 63m170-145c46 16 69 45 84 86l29 44"
        stroke={`url(#${small ? "art-small" : "art-large"})`}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M210 259c13 16 36 18 53 4m-60 55c16 9 34 12 49 7"
        stroke="#fff7ed"
        strokeOpacity=".5"
        strokeWidth="2"
      />
      <circle cx="367" cy="132" r="4" fill="currentColor" />
      <path d="M358 132h18m-9-9v18" stroke="currentColor" />
    </svg>
  );
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
        </>
      )}
    </dialog>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Program | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuDialog = useRef<HTMLDialogElement>(null);
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
      <div className="review-banner">
        Дизайн концепция за преглед <span>·</span> Програмите още не се
        предлагат
      </div>
      <header className="site-header wrap">
        <a className="wordmark" href="#home" aria-label="Strong Muse — начало">
          STRONG
          <span>
            MUSE<span className="wordmark-star">✷</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Основна навигация">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="header-action" href="#programs">
          Открий своята посока <ArrowUpRight size={16} />
        </a>
        <button
          ref={menuButton}
          className="icon-button menu-button"
          aria-label="Отвори менюто"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(true)}
        >
          <Menu />
        </button>
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
        <section id="home" className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="line" /> STRONG MUSE · АННА ДИМИТРОВА
            </p>
            <h1 id="hero-title">
              СИЛАТА Е В ТЕБ.
              <br />
              <em>ДАЙ И</em>
              <br />
              ДВИЖЕНИЕ !
            </h1>
            <p className="hero-subtitle">Бъди своето вдъхновение</p>
            <div className="hero-actions">
              <a href="#programs" className="button dark">
                Разгледай програмите <ArrowUpRight size={18} />
              </a>
              <a className="text-link" href="#about">
                За Анна <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <span className="tiny-star">✷</span>
              <p>
                Твоята сила.
                <br />
                Твоето движение.
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-top">
              <span>THE STRONG MUSE</span>
              <span>01 / ДВИЖЕНИЕ</span>
            </div>
            <MuseArtwork />
            <div className="visual-bottom">
              <span>
                strong
                <br />
                <em>by nature.</em>
              </span>
              <span className="image-placeholder">
                Място за фотография
                <br />
                на Анна
              </span>
            </div>
          </div>
          <a className="scroll-link" href="#programs">
            <ArrowDown size={15} /> НАМЕРИ СВОЯТА ПОСОКА
          </a>
        </section>
        <div className="brand-strip" aria-hidden="true">
          <span>СИЛА</span>
          <span>✷</span>
          <span>ДВИЖЕНИЕ</span>
          <span>✷</span>
          <span>ВДЪХНОВЕНИЕ</span>
          <span>✷</span>
          <span>STRONG MUSE</span>
        </div>

        <section
          id="programs"
          className="section wrap"
          aria-labelledby="programs-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / ТВОЯТА ПОСОКА</p>
              <h2 id="programs-title">
                Движение с <em>намерение.</em>
              </h2>
            </div>
            <p className="section-lead">
              Четири посоки за Strong Muse.
              <br />
              Програмите са в подготовка.
            </p>
          </div>
          <div className="program-grid">
            {programs.map((p) => (
              <article key={p.id} className={`program-card ${p.color}`}>
                <div className="program-art">
                  <div className="card-top">
                    <span>{p.duration || p.category}</span>
                    <span className="card-number">{p.symbol}</span>
                  </div>
                  <div className={`graphic graphic-${p.id}`} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="art-word">
                    {p.id === "start"
                      ? "begin."
                      : p.id === "strong"
                        ? "strong."
                        : p.id === "hiit"
                          ? "move."
                          : "together."}
                  </p>
                  <span className="planned-label">Предстояща програма</span>
                </div>
                <div className="card-body">
                  <p className="eyebrow">{p.category}</p>
                  <h3>{p.name}</h3>
                  <p>{p.subtitle}</p>
                  <button
                    className="card-link"
                    onClick={() => setSelected(p)}
                    aria-label={`Виж подробности за ${p.name}`}
                  >
                    Виж посоката <ArrowUpRight size={19} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="about-section"
          aria-labelledby="about-title"
        >
          <div className="wrap about-grid">
            <div className="portrait-placeholder">
              <MuseArtwork small />
              <span>ПОРТРЕТ НА АННА · ПРЕДСТОИ</span>
            </div>
            <div className="about-copy">
              <p className="eyebrow">02 / ЧОВЕКЪТ ЗАД STRONG MUSE</p>
              <h2 id="about-title">
                Анна
                <br />
                <em>Димитрова.</em>
              </h2>
              <p className="about-manifesto">
                „Бъди своето
                <br />
                вдъхновение“
              </p>
              <p className="muted">
                Историята на Анна и професионалните фотографии ще бъдат добавени
                след нейното одобрение.
              </p>
              <a className="text-link" href="#programs">
                Открий Strong Muse <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        <section
          id="nutrition"
          className="section wrap"
          aria-labelledby="nutrition-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / ХРАНЕНЕ</p>
              <h2 id="nutrition-title">
                Място за <em>баланс.</em>
              </h2>
            </div>
            <p className="section-lead">
              Хранителни материали в подготовка.
              <br />
              Още не се предлагат за покупка.
            </p>
          </div>
          <div className="nutrition-grid">
            {nutrition.map((n) => (
              <article className="nutrition-card" key={n.number}>
                <div className="book-art" aria-hidden="true">
                  <div className="book-cover">
                    <span>STRONG MUSE</span>
                    <div className="plate-symbol">
                      <span />
                    </div>
                    <strong>{n.title}</strong>
                    <span>{n.number} / ХРАНЕНЕ</span>
                  </div>
                </div>
                <div className="nutrition-copy">
                  <span className="eyebrow">{n.type}</span>
                  <h3>{n.title}</h3>
                  <p>
                    Детайлите и начинът на достъп предстои да бъдат потвърдени.
                  </p>
                  <span className="status-note">
                    <span className="status-dot" />В подготовка
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section wrap" aria-labelledby="faq-title">
          <div>
            <p className="eyebrow">04 / ДОБРЕ Е ДА ЗНАЕШ</p>
            <h2 id="faq-title">
              Преди първата
              <br />
              <em>стъпка.</em>
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

        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <div className="wrap">
            <p className="eyebrow">STRONG MUSE</p>
            <h2 id="contact-title">
              Бъди своето
              <br />
              <em>вдъхновение.</em>
            </h2>
            <p>Контактите на Анна ще бъдат добавени след потвърждение.</p>
            <a href="#programs" className="button light">
              Разгледай посоките <ArrowUpRight size={18} />
            </a>
            <span className="contact-star" aria-hidden="true">
              ✷
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer wrap">
        <a className="footer-brand" href="#home">
          STRONG MUSE
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
