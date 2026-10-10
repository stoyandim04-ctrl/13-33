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
import { dishes, formatPrice } from "../data/menu";

gsap.registerPlugin(ScrollTrigger);

const signature = ["wagyu", "ramen", "nigiri", "duck", "cod"].map((s) => dishes.find((d) => d.slug === s)!);

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
      <Signature />
      <Fire />
      <Omakase />
      <Bar />
      <div className="border-y border-line">
        <Marquee items={["Луна", "Огън", "Бинчотан", "Рамен", "Омакасе", "Саке"]} />
      </div>
      <Visit />
      <Footer />
    </main>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);

  // Влизане след интрото.
  useLayoutEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo("[data-hero-bg]", { scale: 1.35, opacity: 0 }, { scale: 1.12, opacity: 1, duration: 2.4 }, 0)
        .fromTo("[data-hero-char]", { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.04 }, 0.15)
        .fromTo("[data-hero-fade]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 0.6)
        .fromTo("[data-hero-plate]", { yPercent: 40, rotate: -120, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 2.2 }, 0.3);
    }, root);
    return () => ctx.revert();
  }, [ready]);

  // Скрол: заглавието се вдига, чинията изплува и се завърта в центъра.
  useLayoutEffect(() => {
    if (reduce()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 },
      });
      tl.to("[data-hero-title]", { yPercent: -40, opacity: 0, ease: "none" }, 0)
                .to("[data-hero-bg]", { scale: 1.3, filter: "brightness(0.35)", ease: "none" }, 0)
        .to("[data-hero-plate-wrap]", { y: () => -window.innerHeight * 0.42, scale: 1.25, ease: "none" }, 0)
        .to("[data-hero-plate]", { rotate: 200, ease: "none" }, 0)
        .fromTo("[data-hero-ring]", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, ease: "none" }, 0.35)
        .fromTo("[data-hero-after]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "none" }, 0.55);
    }, root);
    return () => ctx.revert();
  }, []);

  const title1 = "Луна";
  const title2 = "и огън";

  return (
    <section ref={root} className="relative h-[220vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-hero-bg className="absolute inset-0 opacity-0">
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster="/img/scenes/grill.webp" aria-hidden="true">
            <source src="/img/scenes/grill.webm" type="video/webm" />
            <source src="/img/scenes/grill.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/30 to-ink" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 30%, rgb(11 10 9 / 0.85) 80%)" }} />
        <Embers />

        {/* вертикален знак */}
        <p data-hero-fade className="absolute left-5 top-1/2 hidden -translate-y-1/2 font-jp text-sm tracking-[1em] text-bone/40 [writing-mode:vertical-rl] md:block md:left-10">
          月火 · 炭火料理
        </p>
        <p data-hero-fade className="absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-180 text-[0.6rem] uppercase tracking-[0.5em] text-bone/40 [writing-mode:vertical-rl] md:block md:right-10">
          София · от 18:00
        </p>

        <div data-hero-title className="relative z-10 flex h-full flex-col items-center justify-center px-5 pb-[14vh] pt-16 text-center">
          <p data-hero-fade className="eyebrow opacity-0">Азиатска кухня на живи въглища</p>
          <h1 className="mt-6 font-display font-normal leading-[0.8] tracking-[-0.02em]">
            <span className="block overflow-hidden text-display">
              {title1.split("").map((c, i) => (
                <span key={i} data-hero-char className="inline-block">{c}</span>
              ))}
            </span>
            <span className="block overflow-hidden pb-[0.1em] text-display italic text-bone/90">
              {title2.split("").map((c, i) => (
                <span key={i} data-hero-char className="inline-block whitespace-pre">{c}</span>
              ))}
            </span>
          </h1>
            <div data-hero-ui className="relative z-20 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link data-hero-fade to="/menu" onClick={(e) => goTo(e, "/menu")} className="btn-ember opacity-0">
                <span>Разгледай менюто</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a data-hero-fade href="#poseti" onClick={(e) => goTo(e, "/#poseti")} className="btn-ghost bg-ink/30 opacity-0 backdrop-blur">
                Резервирай маса
              </a>
            </div>
        </div>

        {/* чинията */}
        <div data-hero-plate-wrap className="pointer-events-none absolute left-1/2 top-[100%] z-[5] w-[min(88vw,46rem)] -translate-x-1/2 -translate-y-[30%]">
          <div data-hero-ring className="absolute -inset-[16%] opacity-0">
            <svg viewBox="0 0 200 200" className="h-full w-full animate-[spin-slow_40s_linear_infinite]">
              <defs>
                <path id="ring" d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
              </defs>
              <text className="fill-bone/50 font-sans text-[6.4px] uppercase tracking-[0.42em]">
                <textPath href="#ring">Бинчотан · 1000 °C · Без пламък · Без дим · Луна и огън · 月火 · </textPath>
              </text>
            </svg>
          </div>
          <img data-hero-plate src="/img/dishes/wagyu.webp" alt="Уагю татаки на черна чиния, поглед отгоре" className="relative w-full opacity-0 drop-shadow-[0_60px_80px_rgba(0,0,0,0.8)]" />
        </div>

        <div data-hero-after className="absolute inset-x-0 top-[16vh] z-10 px-5 text-center opacity-0">
          <p className="eyebrow">Подписът на кухнята</p>
          <p className="mt-3 font-display text-title">Уагю татаки · 34 €</p>
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
          ["Рамен и купи", "Бульони, които се варят от сутринта, и нудли с характер."],
          ["Суров бар", "Нигири и чираши от риба, която пристига всяка сутрин."],
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

/* ───────────────────────── SIGNATURE (хоризонтален скрол) ───────────────────────── */

function Signature() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth;
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: 1, pin: true, invalidateOnRefresh: true },
      });
      gsap.utils.toArray<HTMLElement>("[data-sig-plate]").forEach((p) => {
        gsap.fromTo(p, { rotate: -90 }, {
          rotate: 90, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-coal">
      <div ref={track} className="flex flex-col gap-20 py-24 md:h-svh md:w-max md:flex-row md:items-center md:gap-0 md:py-0">
        <div className="shrink-0 px-5 md:w-[42vw] md:pl-10 md:pr-16">
          <p className="eyebrow">02 — Подписите</p>
          <h2 className="mt-6 font-display text-heading font-normal">
            Пет чинии,
            <br />
            <em className="text-bone/80">заради които</em>
            <br />
            ще се върнеш
          </h2>
          <p className="mt-6 max-w-sm text-lead text-bone/65">Скролни — огънят ги върти. Всяка води към менюто, където можеш да я разгледаш отблизо.</p>
        </div>
        {signature.map((d, i) => (
          <article key={d.slug} className="group relative shrink-0 px-5 md:flex md:h-full md:w-[56vw] md:items-center md:gap-10 md:px-10 lg:w-[48vw]">
            <span className="pointer-events-none absolute left-5 top-0 font-display text-[9rem] leading-none text-bone/[0.05] md:left-10 md:top-[12%] md:text-[16rem]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link to={`/menu?dish=${d.slug}`} onClick={(e) => goTo(e, `/menu?dish=${d.slug}`)} className="relative block md:w-[55%] md:shrink-0">
              <img data-sig-plate src={d.image} alt={`${d.name}, поглед отгоре`} loading="lazy" className="w-full transition-transform duration-700 ease-out-expo drop-shadow-[0_40px_50px_rgba(0,0,0,0.7)] group-hover:scale-105" />
            </Link>
            <div className="relative mt-6 md:mt-0">
              <p className="font-jp text-sm tracking-[0.35em] text-muted">{d.native}</p>
              <h3 className="mt-2 font-display text-title">{d.name}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone/65">{d.description}</p>
              <div className="mt-5 flex items-center gap-5">
                <span className="font-display text-2xl">{formatPrice(d.price)}</span>
                <Link to={`/menu?dish=${d.slug}`} onClick={(e) => goTo(e, `/menu?dish=${d.slug}`)} className="text-sm font-semibold text-ember underline-offset-4 hover:underline">
                  Виж в менюто →
                </Link>
              </div>
            </div>
          </article>
        ))}
        <div className="flex shrink-0 items-center px-5 md:w-[40vw] md:justify-center">
          <Link to="/menu" onClick={(e) => goTo(e, "/menu")} className="group relative grid aspect-square w-56 place-items-center rounded-full border border-line transition-colors duration-500 hover:border-ember md:w-72">
            <span className="absolute inset-3 scale-0 rounded-full bg-ember transition-transform duration-700 ease-out-expo group-hover:scale-100" />
            <span className="relative text-center font-display text-3xl transition-colors group-hover:text-ink">
              Цялото
              <br />
              меню →
            </span>
          </Link>
        </div>
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
  { name: "Луна над Кобе", d: "Японско уиски, юзу, шисо, димна сфера лед", p: 16 },
  { name: "Бинчотан негрони", d: "Джин, вермут и биттер, опушени на въглен", p: 15 },
  { name: "Сакура хайбол", d: "Шочу, черешов цвят, газирана вода", p: 13 },
  { name: "Дзунмай гинджо", d: "Саке по чаша, сервирано студено", p: 12 },
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
              <span className="font-display text-xl tabular-nums">{formatPrice(d.p)}</span>
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
