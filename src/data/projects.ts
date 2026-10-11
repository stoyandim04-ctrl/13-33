// Portfolio data for the WorksWheel and the project pages.
//
// IMPORTANT - honesty rules (from the 13:33 master pack):
// - Never present a concept as a finished client project.
// - Never use another studio's or a client's site as ours without permission.
// - Every entry below is a CONCEPT created by 13:33 and built as a real site.
//   The posters and recordings in /public/projects/<slug>/ are recorded from
//   those sites (scripts/build-live-media.mjs, scripts/build-tsukibi-media.mjs)
//   - no stock, no third party sites.
//
// To add a real project: copy an entry, set `status`, drop `poster.webp`
// (1450×1000) and `preview.mp4` + `preview.webm`, ~6–10 s, muted,
// no audio track; `npm run media` shows the ffmpeg settings) into /public/projects/<slug>/, and set `liveUrl` if the site
// is public and the client agreed to be shown.
//
// Candidates waiting for confirmation (link, recording, status, permission) -
// see Notion "Проекти в спиралата": VELION LAB (own product), INTNS / FitCheck.
// Not listed here until those are confirmed. The older mock-up concepts
// (scripts/concept-mocks.mjs) are no longer in the wheel.

export type ProjectStatus =
  | "concept" // our own exploration, no client
  | "prototype" // working demo, not in production
  | "in-progress" // real project, still being built
  | "live" // real project, launched
  | "own-product"; // our own product

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  concept: "Концепция",
  prototype: "Прототип",
  "in-progress": "В процес",
  live: "Реализиран",
  "own-product": "Собствен продукт",
};

export const STATUS_NOTE: Record<ProjectStatus, string> = {
  concept:
    "Концептуален проект на 13:33 — създаден, за да покаже подход и възможности. Не е клиентска поръчка.",
  prototype: "Работещ прототип. Все още не е в реална употреба.",
  "in-progress": "Проектът е в разработка.",
  live: "Реализиран и публично достъпен проект.",
  "own-product": "Собствен продукт на 13:33.",
};

export interface ProjectVideo {
  mp4?: string;
  webm?: string;
}

export interface Project {
  /** Display name. */
  name: string;
  /** URL segment: /proekti/<slug>. */
  slug: string;
  /** What kind of solution it is. */
  category: string;
  /** Sector / type of business it is for. */
  sector: string;
  /** One or two sentences. */
  summary: string;
  /** What 13:33 did (or, for a concept, what the concept covers). */
  role: string[];
  status: ProjectStatus;
  /** Poster frame shown in the wheel and on the project page. */
  poster: string;
  /** Short muted loop of the site in use. Optional - the poster stays without
      it. Give MP4 (H.264) for Safari and WebM (VP9) for browsers without H.264. */
  video?: ProjectVideo;
  /** Public URL, only when the site is live and may be shown. */
  liveUrl?: string;
  /** Project page: the business need it answers. */
  need: string;
  /** Project page: how the solution answers it. */
  approach: string[];
  year?: number;
}

const media = (slug: string) => ({
  poster: `/projects/${slug}/poster.webp`,
  video: {
    mp4: `/projects/${slug}/preview.mp4`,
    webm: `/projects/${slug}/preview.webm`,
  },
});

export const projects: Project[] = [
  {
    // Real site of ours (separate repo/Vercel project). Brand, notes and the
    // demo prices on it are invented; nothing is sold.
    name: "Obsidian",
    slug: "obsidian",
    category: "Кинематографична продуктова страница",
    sector: "Парфюмен бранд",
    summary:
      "Сайт за измислен парфюм в тъмно стъкло: флаконът се разглежда при скрол — стъклото, месинговият пръстен, пулверизаторът — до избор на размер.",
    role: ["Бранд и визуална концепция", "3D рендери и анимация при скрол", "Продуктова страница", "Работещ прототип"],
    status: "concept",
    ...media("obsidian"),
    liveUrl: "https://obsidian-sigma-mocha.vercel.app",
    need:
      "Парфюмът се купува с усещане, а онлайн обикновено е снимка и цена. Страницата трябва да предаде материала и характера на продукта, преди посетителят да го е помирисал.",
    approach: [
      "Флаконът води разказа: при скрол се приближават стъклото, капачката с месинговия пръстен и пулверизаторът.",
      "Ароматът е разказан в три акта — начало, сърце и база — вместо като списък със съставки.",
      "Избор на размер и количка в края на разказа; на сайта ясно пише, че е демо и нищо не се продава.",
    ],
    year: 2026,
  },
  {
    // Design concept for review, made for the brand's owner; programmes and
    // materials on it are marked as not yet offered.
    name: "Strong Muse",
    slug: "strong-muse",
    category: "Сайт за фитнес бранд",
    sector: "Фитнес и коучинг",
    summary:
      "Дизайн концепция за фитнес и коучинг бранд: енергично начало, четири посоки за тренировка, хранителни материали и въпроси преди първата стъпка.",
    role: ["Визуална концепция", "Структура на сайта", "Анимация", "Прототип за преглед"],
    status: "concept",
    ...media("strong-muse"),
    liveUrl: "https://strong-muse.vercel.app",
    need:
      "Бранд, който се гради около човек, има нужда от място, което звучи като него — и което по-нататък да събере програмите, храненето и записването на едно място.",
    approach: [
      "Първият екран носи характера на бранда: голяма типография, движение и ясен призив.",
      "Четири посоки — Start, Strong, HIIT у дома и индивидуален коучинг — всяка с карта и продължителност.",
      "Хранене и въпроси в отделни части; на сайта е ясно отбелязано, че програмите и материалите още не се предлагат.",
    ],
    year: 2026,
  },
  {
    // Real site of ours (branch `varovik`, varovik.vercel.app). Building, homes and areas are
    // invented; frames and photos generated for the concept.
    name: "Варовик",
    slug: "varovik",
    category: "Сайт с филм при скрол",
    sector: "Жилищна сграда",
    summary:
      "Концепция за жилищна сграда, в която скролът ви разхожда: от басейна пред сградата през входа и лобито до вътрешния двор.",
    role: ["Визуална концепция", "Генерирани кадри и филм", "Филм, рисуван според скрола", "Работещ прототип"],
    status: "concept",
    ...media("varovik"),
    liveUrl: "https://varovik.vercel.app",
    need:
      "Жилище в строеж се продава с усещане за място, което още не съществува. Посетителят трябва да „пристигне“ там, преди да види планове и площи.",
    approach: [
      "Филм, разрязан на кадри и рисуван според скрола — пристигане, алея, вход, лоби, двор, с надписи за всяка спирка.",
      "Три вида жилища — градински, терасов и пентхаус — със снимка и план, който се рисува сам.",
      "Материалите на сградата и заявка за оглед в края; формата е демо и не изпраща данни.",
    ],
    year: 2026,
  },
  {
    // Real site of ours (separate repo/Vercel project). Visuals made for the
    // presentation; the product and the order form are a concept.
    name: "Black Clove",
    slug: "black-clove",
    category: "Продуктова страница",
    sector: "Храна — черен чесън",
    summary:
      "Сайт за черен чесън в крафт кутия: при скрол кутията се отваря, скилидките се изсипват и страницата разказва процеса, вкуса и как се готви с него.",
    role: ["Бранд и опаковка", "Визуална концепция", "Анимация при скрол", "Работещ прототип"],
    status: "concept",
    ...media("black-clove"),
    liveUrl: "https://black-clove-rho.vercel.app",
    need:
      "Черният чесън е непознат за повечето хора. Преди да го поръчат, те трябва да разберат какво е, какъв вкус има и какво да правят с него.",
    approach: [
      "Кутията води разказа: отвори, изсипи, намажи — три стъпки при скрол.",
      "Процесът, вкусът и четири начина да се използва в кухнята, всяко в своя част.",
      "Поръчка в края, с количество и бележка, без излишни стъпки.",
    ],
    year: 2026,
  },
  {
    // Built as a real site in sites/tsukibi; poster and preview are recorded
    // from it (scripts/build-tsukibi-media.mjs). Restaurant, menu and prices
    // are invented for the concept.
    name: "Цукиби 月火",
    slug: "tsukibi",
    category: "Сайт с интерактивно меню",
    sector: "Азиатски ресторант",
    summary:
      "Анимиран сайт за измислен азиатски ресторант: кинематографично начало и меню, в което всяко ястие се разглежда отблизо — с натискане чинията се накланя и показва съставките си в 3D.",
    role: ["Бранд и лого", "Визуална концепция и анимация", "Интерактивно меню", "Работещ прототип"],
    status: "concept",
    ...media("tsukibi"),
    liveUrl: "https://tsukibi.vercel.app",
    need:
      "Ресторантът продава атмосфера и вкус, а повечето менюта са PDF или дълъг списък. Гостът трябва да види чинията и да разбере какво има в нея, преди да дойде.",
    approach: [
      "Начало с огън, искри и чиния, която се завърта при скрол — усещането за мястото идва преди текста.",
      "Меню в пет части — салати, предястия, робата, риби, суши — чиния по чиния; един скрол сменя едно ястие.",
      "С натискане чинията ляга в 3D и над всяка съставка се изправя табелка с името ѝ.",
    ],
    year: 2026,
  },
];

export const getProject = (slug: string | undefined) =>
  projects.find((p) => p.slug === slug);
