import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "../hooks/use-lenis";
import { Embers } from "../components/embers";
import { Intro } from "../components/intro";
import { Marquee } from "../components/marquee";
import { LogoMark } from "../components/logo";
import { goTo } from "../components/transition";

gsap.registerPlugin(ScrollTrigger);

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Home() {
  useLenis();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    document.title = "Цукиби 月火 — азиатска кухня на живи въглища";
  }, []);

  return (
    <main>
      <Intro onDone={() => setReady(true)} />
      <Hero ready={ready} />
      <Manifesto />
      <Evening />
      <Gallery />
      <Fire />
      <Omakase />
      <Bar />
      <div className="border-y border-line">
        <Marquee items={["Луна", "Огън", "Бинчотан", "Суши", "Омакасе", "Саке"]} />
      </div>
      <Visit />
      <Footer />
    </main>
  );
}

/* ───────────────────────── HERO ─────────────────────────
   Подписът: „луната“. Огънят се вижда в пълен цвят само през кръг в центъра;
   около него кадърът е потъмнен. При скрол луната се разширява, докато огънят
   изпълни екрана — после секцията просто се изкачва нагоре. Нищо не се реже. */

// Радиусът на луната в px — GSAP интерполира числа, не var() и смесени единици.
const moonR0 = () => Math.min(window.innerWidth, window.innerHeight) * (window.innerWidth < 768 ? 0.34 : 0.26);
const moonR1 = () => Math.hypot(window.innerWidth, window.innerHeight) / 2 + 40;

function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const moon = useRef<HTMLDivElement>(null);

  // Влизане след интрото.
  useLayoutEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo("[data-hero-bg]", { scale: 1.25, opacity: 0 }, { scale: 1.08, opacity: 1, duration: 2.6 }, 0)
        .fromTo(moon.current, { "--r": "0px" }, { "--r": () => `${moonR0()}px`, duration: 2.2, ease: "expo.inOut" }, 0.1)
        .fromTo("[data-hero-ring]", { opacity: 0, scale: 0.85, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 2.4 }, 0.6)
        .fromTo("[data-hero-char]", { yPercent: 115 }, { yPercent: 0, duration: 1.5, stagger: 0.045 }, 0.7)
        .fromTo("[data-hero-fade]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 1.1);
    }, root);
    return () => ctx.revert();
  }, [ready]);

  // Скрол: луната се разширява до цял екран, текстът се отдръпва.
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 } });
      tl.to("[data-hero-copy]", { yPercent: -18, opacity: 0, ease: "none", duration: 0.45 }, 0)
        .to("[data-hero-ring]", { scale: 2.6, opacity: 0, ease: "none", duration: 0.6 }, 0)
        .fromTo(moon.current, { "--r": () => `${moonR0()}px` }, { "--r": () => `${moonR1()}px`, ease: "power1.in", duration: 1, immediateRender: false }, 0)
        .to("[data-hero-bg]", { scale: 1, ease: "none", duration: 1 }, 0)
        .fromTo("[data-hero-after]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "none", duration: 0.25 }, 0.6);
    }, root);
    return () => ctx.revert();
  }, []);

  // Лек паралакс на заглавието към курсора.
  const onMove = (e: React.MouseEvent) => {
    if (reduce()) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    gsap.to("[data-hero-par]", { x: x * -18, y: y * -12, duration: 1.4, ease: "power3.out" });
    gsap.to("[data-hero-ring]", { x: x * 10, y: y * 8, duration: 1.6, ease: "power3.out" });
  };

  const lines = ["Луна", "и огън"];

  return (
    <section ref={root} className="relative h-[190vh]" onMouseMove={onMove}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-hero-bg className="absolute inset-0 opacity-0">
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster="/img/scenes/grill.webp" aria-hidden="true">
            <source src="/img/scenes/grill.webm" type="video/webm" />
            <source src="/img/scenes/grill.mp4" type="video/mp4" />
          </video>
        </div>

        {/* тъмнината около луната — дупка с радиус --r */}
        <div
          ref={moon}
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            ["--r" as string]: "0px",
            background: "rgb(11 10 9 / 0.86)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--r) - 1px), #000 calc(var(--r) + 1px))",
            maskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--r) - 1px), #000 calc(var(--r) + 1px))",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgb(11 10 9 / 0.55) 100%)" }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <Embers density={typeof window !== "undefined" && window.innerWidth < 768 ? 0.4 : 0.8} />

        {/* пръстенът около луната */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-hero-ring className="relative aspect-square w-[88vmin] opacity-0 md:w-[68vmin]">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-[spin-slow_60s_linear_infinite]">
              <defs>
                <path id="moon-ring" d="M100,100 m-94,0 a94,94 0 1,1 188,0 a94,94 0 1,1 -188,0" />
              </defs>
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgb(241 233 219 / 0.18)" strokeWidth="0.25" />
              <text className="fill-bone/45 font-sans text-[4.6px] uppercase tracking-[0.6em]">
                <textPath href="#moon-ring">Бинчотан · 1000 °C · Луна и огън · 月火 · Робата · Суши · Омакасе · София · </textPath>
              </text>
            </svg>
            <span className="absolute left-1/2 top-[6%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ember shadow-[0_0_14px_rgba(255,91,36,0.9)]" />
          </div>
        </div>

        {/* текст */}
        <div data-hero-copy className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
          <div data-hero-par className="flex flex-col items-center">
            <h1 className="font-display font-normal leading-[0.82] tracking-[-0.02em] [text-shadow:0_10px_60px_rgba(0,0,0,0.55)]">
              {lines.map((line, li) => (
                <span key={line} className={`block overflow-hidden pb-[0.06em] text-display ${li ? "italic text-bone/90" : ""}`}>
                  {line.split("").map((c, i) => (
                    <span key={i} data-hero-char className="inline-block whitespace-pre">{c}</span>
                  ))}
                </span>
              ))}
            </h1>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
              <Link data-hero-fade to="/menu" onClick={(e) => goTo(e, "/menu")} className="btn-ember opacity-0">
                <span>Разгледай менюто</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a data-hero-fade href="#poseti" onClick={(e) => goTo(e, "/#poseti")} className="text-sm font-semibold uppercase tracking-[0.2em] text-bone/80 underline-offset-8 opacity-0 transition-colors hover:text-bone hover:underline">
                Резервирай маса
              </a>
            </div>
          </div>
        </div>

        {/* долна лента */}
        <div data-hero-copy className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-line md:block">
          <div data-hero-fade className="mx-auto grid max-w-[1600px] grid-cols-3 px-10 py-5 text-[0.68rem] uppercase tracking-[0.28em] text-bone/55 opacity-0">
            <span>Вт–Нд · 18:00–24:00</span>
            <span className="text-center text-ember">Азиатска кухня на живи въглища</span>
            <span className="text-right">ул. „Луна“ 13 · София</span>
          </div>
        </div>

        <div data-hero-after className="absolute inset-x-0 bottom-[14vh] z-10 px-5 text-center opacity-0">
          <p className="font-jp text-sm tracking-[0.6em] text-bone/60">月火 · 炭火料理</p>
          <p className="mt-4 font-display text-title">Една робата. Цяла Азия.</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── MANIFESTO ───────────────────────── */

const manifesto =
  "Готвим на бинчотан — японски бял въглен, който гори на хиляда градуса без пламък и без дим. Огънят е готвачът. Ние само слушаме кога месото е готово, кога бульонът е станал кадифе, кога рибата е поела мисото.";

function Manifesto() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-word]",
        { opacity: 0.12 },
        { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: true } },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative mx-auto max-w-[1400px] px-5 py-[18vh] md:px-10">
      <p className="eyebrow">01 — Философия</p>
      <p className="mt-10 font-display text-[clamp(2rem,1.1rem+3.4vw,4.6rem)] font-light leading-[1.08]">
        {manifesto.split(" ").map((w, i) => (
          <span key={i} data-word className={`inline-block pr-[0.25em] ${["хиляда", "градуса", "готвачът."].includes(w) ? "italic text-ember-soft" : ""}`}>
            {w}
          </span>
        ))}
      </p>
      <div className="mt-16 grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
        {[
          ["Робата", "Шишове, риба и зеленчуци над бял въглен — пред очите ти."],
          ["Суши и риба", "Нигири, сашими и риба на въглен — от улов, който пристига всяка сутрин."],
          ["Салати и предястия", "Свежо, хрупкаво и лютиво — за началото на вечерта."],
        ].map(([t, d]) => (
          <div key={t}>
            <h3 className="font-display text-3xl">{t}</h3>
            <p className="mt-3 text-bone/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── EVENING ───────────────────────── */

const steps = [
  { n: "18:00", t: "Саке на бара", d: "Вратата се отваря, робатата вече е запалена. Започни с чаша студено саке и нещо хрупкаво." },
  { n: "19:00", t: "Огънят", d: "Шефът готви пред теб — шишове, риба и зеленчуци минават през жарта един по един." },
  { n: "20:30", t: "Омакасе или а ла карт", d: "Остави шефа да избира или подреди вечерта сам от петте части на менюто." },
  { n: "22:00", t: "Чай и тишина", d: "Матча от Уджи, нещо сладко и последните въгленчета в робатата." },
];

function Evening() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-step-line]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-steps]", start: "top 70%", end: "bottom 60%", scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%" } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-x-clip bg-coal py-[16vh]">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-5 md:px-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="lg:sticky lg:top-[20vh] lg:self-start">
          <p className="eyebrow">02 — Вечерта</p>
          <h2 className="mt-6 font-display text-heading font-normal">
            Една вечер
            <br />
            <em>в Цукиби</em>
          </h2>
          <p className="mt-6 max-w-md text-lead text-bone/65">Без бързане. Масите не се въртят — вечерта е твоя, от първата чаша до последната жар.</p>
        </div>
        <ol data-steps className="relative space-y-14 pl-10 md:pl-14">
          <span data-step-line aria-hidden="true" className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-gradient-to-b from-ember via-ember/40 to-transparent md:left-[11px]" />
          {steps.map((s) => (
            <li key={s.n} data-step className="relative">
              <span aria-hidden="true" className="absolute -left-10 top-2 h-4 w-4 rounded-full border border-ember bg-ink md:-left-14 md:h-6 md:w-6">
                <span className="absolute inset-1 rounded-full bg-ember" />
              </span>
              <p className="font-display text-xl tabular-nums text-ember-soft">{s.n}</p>
              <h3 className="mt-1 font-display text-title">{s.t}</h3>
              <p className="mt-3 max-w-md text-bone/65">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── GALLERY ───────────────────────── */

const shots = [
  { src: "/img/scenes/interior.webp", alt: "Барът с кръглата лампа", w: "w-[78vw] md:w-[46vw]", a: "aspect-[16/10]" },
  { src: "/img/scenes/chef.webp", alt: "Готвач подрежда чиния", w: "w-[56vw] md:w-[24vw]", a: "aspect-[4/5]" },
  { src: "/img/scenes/noren.webp", alt: "Входът с норен вечер", w: "w-[56vw] md:w-[24vw]", a: "aspect-[4/5]" },
  { src: "/img/scenes/embers.webp", alt: "Въглени бинчотан", w: "w-[78vw] md:w-[40vw]", a: "aspect-[16/10]" },
  { src: "/img/scenes/cocktail.webp", alt: "Коктейл на бара", w: "w-[56vw] md:w-[24vw]", a: "aspect-[4/5]" },
];

function Gallery() {
  const root = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      // Без закачане: редът просто се плъзга, докато минаваш покрай него.
      gsap.fromTo(row.current, { xPercent: 0 }, { xPercent: -38, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={root} className="overflow-hidden py-[12vh]" aria-label="Пространството">
      <div className="mx-auto mb-10 flex max-w-[1600px] items-end justify-between gap-6 px-5 md:px-10">
        <h2 className="font-display text-title">Пространството</h2>
        <p className="max-w-xs text-right text-sm text-muted">Опушено дърво, една кръгла лампа като луна и десет места пред огъня.</p>
      </div>
      <div ref={row} className="flex w-max items-center gap-4 pl-5 md:gap-6 md:pl-10">
        {shots.map((s) => (
          <figure key={s.src} className={`${s.w} ${s.a} shrink-0 overflow-hidden rounded-[1.5rem]`}>
            <img src={s.src} alt={s.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out-expo hover:scale-105" />
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── FIRE ───────────────────────── */

function Fire() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amt = Number(el.dataset.parallax);
        gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-count-to]").forEach((el) => {
        const to = Number(el.dataset.countTo);
        const o = { v: 0 };
        gsap.to(o, { v: to, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("bg-BG")) });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const facts = [
    { n: 1000, unit: "°C", t: "гори бинчотанът — без пламък, без дим, само чиста жар." },
    { n: 18, unit: "часа", t: "вари бульонът за тонкоцу, докато стане като кадифе." },
    { n: 90, unit: "дни", t: "отлежава нашият таре — сосът, с който лакираме всеки шиш." },
  ];

  return (
    <section id="ogan" ref={root} className="relative mx-auto max-w-[1600px] px-5 py-[16vh] md:px-10">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:sticky lg:top-[18vh] lg:self-start">
          <p className="eyebrow">03 — Огънят</p>
          <h2 className="mt-6 font-display text-heading font-normal">
            Огънят
            <br />
            <em>е готвачът</em>
          </h2>
          <p className="mt-6 max-w-md text-lead text-bone/65">
            В центъра на кухнята стои дълга робата. Всичко, което може да мине през жарта, минава — дори десертите получават дъх на дим.
          </p>
          <dl className="mt-12 space-y-8">
            {facts.map((f) => (
              <div key={f.unit} className="flex items-baseline gap-6 border-t border-line pt-6">
                <dt className="w-44 shrink-0 font-display text-6xl leading-none">
                  <span data-count-to={f.n}>{f.n.toLocaleString("bg-BG")}</span>
                  <span className="ml-2 text-xl text-ember">{f.unit}</span>
                </dt>
                <dd className="text-bone/65">{f.t}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <figure data-reveal className="col-span-2 aspect-[16/10] overflow-hidden rounded-[2rem]">
            <img data-parallax="8" src="/img/scenes/embers.webp" alt="Бинчотан въглени отблизо" loading="lazy" className="h-[120%] w-full object-cover" />
          </figure>
          <figure data-reveal className="mt-16 aspect-[4/5] overflow-hidden rounded-[2rem]">
            <img data-parallax="10" src="/img/scenes/chef.webp" alt="Готвач подрежда чиния с пинсета" loading="lazy" className="h-[120%] w-full object-cover" />
          </figure>
          <figure data-reveal className="aspect-[4/5] overflow-hidden rounded-[2rem]">
            <img data-parallax="10" src="/img/scenes/grill.webp" alt="Шишове над жарта на робата" loading="lazy" className="h-[120%] w-full object-cover" />
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── OMAKASE ───────────────────────── */

function Omakase() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 } });
      tl.fromTo("[data-moon-mask]", { clipPath: "circle(16% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", ease: "none" }, 0)
        .fromTo("[data-moon-img]", { scale: 1.5 }, { scale: 1, ease: "none" }, 0)
        .fromTo("[data-omakase-title]", { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.3, ease: "none", duration: 0.35 }, 0)
        .fromTo("[data-omakase-text]", { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: "none", duration: 0.3 }, 0.55);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="omakase" ref={root} className="relative h-[260vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-moon-mask className="absolute inset-0" style={{ clipPath: "circle(16% at 50% 50%)" }}>
          <img data-moon-img src="/img/scenes/interior.webp" alt="Барът за омакасе с десет места и кръгла лампа като луна" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        </div>
        <div data-omakase-title className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="eyebrow">04 — Омакасе</p>
            <p className="mt-4 font-display text-[clamp(4rem,2rem+10vw,13rem)] italic leading-none mix-blend-difference">おまかせ</p>
          </div>
        </div>
        <div data-omakase-text className="absolute inset-x-0 bottom-0 px-5 pb-[10vh] opacity-0 md:px-10">
          <div className="mx-auto grid max-w-[1600px] items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="eyebrow">Омакасе на бара</p>
              <h2 className="mt-5 font-display text-heading font-normal">
                Довери се
                <br />
                <em>на шефа</em>
              </h2>
            </div>
            <div className="rounded-[2rem] border border-line bg-ink/60 p-7 backdrop-blur-xl">
              <p className="text-bone/75">
                Десет места пред робата. Без меню — четиринадесет малки сервирания, които шефът решава според сутрешния пазар.
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-6 text-center">
                {[["10", "места"], ["14", "сервирания"], ["2", "сеанса"]].map(([n, l]) => (
                  <div key={l}>
                    <dt className="font-display text-4xl">{n}</dt>
                    <dd className="text-xs uppercase tracking-[0.2em] text-muted">{l}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  18:30 и 21:00 · <span className="text-bone">95 € на човек</span>
                </p>
                <a href="#poseti" onClick={(e) => goTo(e, "/#poseti")} className="btn-ember !py-3">
                  <span>Запази място</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── BAR ───────────────────────── */

const drinks = [
  { name: "Луна над Кобе", d: "Японско уиски, юзу, шисо, димна сфера лед" },
  { name: "Бинчотан негрони", d: "Джин, вермут и биттер, опушени на въглен" },
  { name: "Сакура хайбол", d: "Шочу, черешов цвят, газирана вода" },
  { name: "Дзунмай гинджо", d: "Саке по чаша, сервирано студено" },
];

function Bar() {
  const img = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    gsap.to(img.current, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 14, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 14, duration: 0.8, ease: "power3.out" });
  };
  return (
    <section className="mx-auto grid max-w-[1600px] items-center gap-14 px-5 py-[16vh] md:px-10 lg:grid-cols-2">
      <div onMouseMove={onMove} onMouseLeave={() => gsap.to(img.current, { rotateX: 0, rotateY: 0, duration: 1 })} style={{ perspective: "1000px" }}>
        <div ref={img} className="relative aspect-[4/5] overflow-hidden rounded-[2rem]" style={{ transformStyle: "preserve-3d" }}>
          <img src="/img/scenes/cocktail.webp" alt="Коктейл с уиски, юзу и сфера лед" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <p className="absolute bottom-6 left-6 font-jp text-sm tracking-[0.4em] text-bone/70">酒 · バー</p>
        </div>
      </div>
      <div>
        <p className="eyebrow">05 — Барът</p>
        <h2 className="mt-6 font-display text-heading font-normal">
          Дим в чашата
        </h2>
        <p className="mt-6 max-w-md text-lead text-bone/65">Коктейли с японски спиртни напитки и подправки от кухнята, кратка листа саке и чай от Уджи.</p>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {drinks.map((d) => (
            <li key={d.name} className="group flex items-baseline justify-between gap-6 py-5 transition-[padding] duration-500 hover:pl-3">
              <div>
                <p className="font-display text-2xl transition-colors group-hover:text-ember-soft">{d.name}</p>
                <p className="mt-1 text-sm text-muted">{d.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────── VISIT ───────────────────────── */

function Visit() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  const field = "w-full rounded-2xl border border-line bg-coal px-4 py-3.5 text-bone placeholder:text-faint focus:border-bone/50 focus:outline-none";

  return (
    <section id="poseti" className="mx-auto max-w-[1600px] px-5 py-[16vh] md:px-10">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <figure className="relative min-h-[28rem] overflow-hidden rounded-[2rem]">
          <img src="/img/scenes/noren.webp" alt="Входът с тъмносиня завеса норен вечер" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 grid gap-6 p-7 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Адрес</p>
              <p className="mt-2 font-display text-2xl leading-tight">ул. „Луна“ 13<br />София 1000</p>
            </div>
            <div>
              <p className="eyebrow">Работно време</p>
              <p className="mt-2 font-display text-2xl leading-tight">Вт–Нд · 18:00–24:00<br /><span className="text-muted">Понеделник почиваме</span></p>
            </div>
          </figcaption>
        </figure>

        <div>
          <p className="eyebrow">06 — Посети ни</p>
          <h2 className="mt-6 font-display text-heading font-normal">
            Маса
            <br />
            <em>за тази вечер</em>
          </h2>
          {sent ? (
            <div className="mt-10 rounded-[2rem] border border-line bg-coal p-8">
              <LogoMark className="h-12 w-12 text-bone" />
              <p className="mt-5 font-display text-3xl">Благодарим!</p>
              <p className="mt-3 text-bone/70">
                Това е концептуален сайт, затова резервацията не се изпраща. В истинския сайт тук идва потвърждение със SMS и календар със свободните часове.
              </p>
              <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-ember underline-offset-4 hover:underline">
                Нова резервация
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-10 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Име</span>
                <input required name="name" autoComplete="name" className={field} placeholder="Как да те запишем" />
              </label>
              <label>
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Дата</span>
                <input required type="date" name="date" className={field} />
              </label>
              <label>
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Час</span>
                <select name="time" className={field} defaultValue="20:00">
                  {["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Гости</span>
                <select name="guests" className={field} defaultValue="2">
                  {Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Къде</span>
                <select name="area" className={field} defaultValue="Маса">
                  <option>Маса</option>
                  <option>Бар пред робата</option>
                  <option>Омакасе</option>
                </select>
              </label>
              <button type="submit" className="btn-ember mt-2 justify-center sm:col-span-2">
                <span>Запази маса</span>
              </button>
              <p className="text-xs text-faint sm:col-span-2">Концептуален сайт — формата не изпраща данни.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line pt-20">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="font-display text-4xl leading-tight">
            Луна и огън.
            <br />
            <em className="text-muted">Всяка вечер от шест.</em>
          </p>
        </div>
        <div className="text-sm text-bone/70">
          <p className="eyebrow mb-3">Страници</p>
          <ul className="space-y-2">
            <li><Link to="/menu" onClick={(e) => goTo(e, "/menu")} className="hover:text-bone">Меню</Link></li>
            <li><a href="#ogan" onClick={(e) => goTo(e, "/#ogan")} className="hover:text-bone">Огънят</a></li>
            <li><a href="#omakase" onClick={(e) => goTo(e, "/#omakase")} className="hover:text-bone">Омакасе</a></li>
            <li><a href="#poseti" onClick={(e) => goTo(e, "/#poseti")} className="hover:text-bone">Резервация</a></li>
          </ul>
        </div>
        <div className="text-sm text-bone/70">
          <p className="eyebrow mb-3">Контакт</p>
          <p>ул. „Луна“ 13, София</p>
          <p className="mt-1">Вт–Нд · 18:00–24:00</p>
        </div>
      </div>
      <p aria-hidden="true" className="mt-16 select-none text-center font-display text-[24vw] leading-[0.75] tracking-[0.04em] text-transparent [-webkit-text-stroke:1px_rgb(241_233_219/0.18)]">
        TSUKIBI
      </p>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 border-t border-line px-5 py-6 text-xs text-faint md:flex-row md:justify-between md:px-10">
        <p>Концептуален проект на 13:33 Digital Studio. Ресторантът, менюто, цените и адресът са измислени.</p>
        <p>Снимките са генерирани за концепцията.</p>
      </div>
    </footer>
  );
}
