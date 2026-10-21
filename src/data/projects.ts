// Portfolio data for the 3D gallery on the home page.
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
// The list was confirmed on 21.10.2026 (Notion: „Новият сайт на 13:33 — 3D
// галерия от проекти“): these five, no client or fitness sites. A new
// project is one more entry here plus `npm run media:gallery <slug>`.

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

/** What it is, in one word: shown on the gallery wall. */
export type ProjectKind = "landing" | "site" | "store" | "platform" | "portal";

export const KIND_LABEL: Record<ProjectKind, string> = {
  landing: "Лендинг",
  site: "Сайт",
  store: "Магазин",
  platform: "Платформа",
  portal: "Портал",
};

export interface ProjectVideo {
  mp4?: string;
  webm?: string;
}

export interface Project {
  /** Display name. */
  name: string;
  /** English display name, when it differs. */
  nameEn?: string;
  /** URL segment: /proekti/<slug>. */
  slug: string;
  /** What kind of solution it is. */
  category: string;
  categoryEn?: string;
  kind: ProjectKind;
  /** Windows in the 3D gallery: clips recorded from the site
      (scripts/build-gallery-media.mjs) as public/gallery/<slug>-<n>.*,
      n = 1…windows. The last one is the phone view. */
  windows: number;
  /** Sector / type of business it is for. */
  sector: string;
  /** One or two sentences. */
  summary: string;
  summaryEn?: string;
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
  poster: `/gallery/${slug}-1.webp`,
  video: {
    mp4: `/gallery/${slug}-1.mp4`,
    webm: `/gallery/${slug}-1.webm`,
  },
});

/** Poster and clip of one window of a project in the gallery (n from 1). */
export const windowMedia = (slug: string, n: number) => ({
  poster: `/gallery/${slug}-${n}.webp`,
  mp4: `/gallery/${slug}-${n}.mp4`,
  webm: `/gallery/${slug}-${n}.webm`,
});

export const projects: Project[] = [
  {
    // Real site of ours (branch `varovik`, varovik.vercel.app). Building, homes and areas are
    // invented; frames and photos generated for the concept.
    name: "Варовик",
    nameEn: "Varovik",
    slug: "varovik",
    kind: "site",
    windows: 4,
    category: "Сайт с филм при скрол",
    categoryEn: "Scroll-driven film website",
    sector: "Жилищна сграда",
    summary:
      "Концепция за жилищна сграда, в която скролът ви разхожда: от басейна пред сградата през входа и лобито до вътрешния двор.",
    summaryEn:
      "A concept for a residential building where the scroll walks you through: from the pool in front, through the entrance and the lobby, to the inner courtyard.",
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
    // Built as a real site in sites/tsukibi; poster and preview are recorded
    // from it (scripts/build-tsukibi-media.mjs). Restaurant, menu and prices
    // are invented for the concept.
    name: "Цукиби 月火",
    nameEn: "Tsukibi 月火",
    slug: "tsukibi",
    kind: "site",
    windows: 4,
    category: "Сайт с интерактивно меню",
    categoryEn: "Interactive menu website",
    sector: "Азиатски ресторант",
    summary:
      "Анимиран сайт за измислен азиатски ресторант: кинематографично начало и меню, в което всяко ястие се разглежда отблизо — с натискане чинията се накланя и показва съставките си в 3D.",
    summaryEn:
      "An animated site for an invented Asian restaurant: a cinematic opening and a menu where every dish can be seen up close — tap it and the plate tilts to show its ingredients in 3D.",
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
  {
    // Real site of ours (separate repo/Vercel project). Brand, notes and the
    // demo prices on it are invented; nothing is sold.
    name: "OBSIDIAN No. 01",
    slug: "obsidian",
    kind: "landing",
    windows: 4,
    category: "Кинематографична продуктова страница",
    categoryEn: "Cinematic product page",
    sector: "Парфюмен бранд",
    summary:
      "Сайт за измислен парфюм в тъмно стъкло: флаконът се разглежда при скрол — стъклото, месинговият пръстен, пулверизаторът — до избор на размер.",
    summaryEn:
      "A site for an invented perfume in dark glass: the bottle is explored as you scroll — the glass, the brass ring, the atomiser — down to choosing a size.",
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
    // Real site of ours (separate repo/Vercel project). Visuals made for the
    // presentation; the product and the order form are a concept.
    name: "Black Clove",
    slug: "black-clove",
    kind: "landing",
    windows: 4,
    category: "Продуктова страница",
    categoryEn: "Product page",
    sector: "Храна — черен чесън",
    summary:
      "Сайт за черен чесън в крафт кутия: при скрол кутията се отваря, скилидките се изсипват и страницата разказва процеса, вкуса и как се готви с него.",
    summaryEn:
      "A site for black garlic in a kraft box: as you scroll the box opens, the cloves pour out and the page tells the process, the taste and how to cook with it.",
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
    // Our own product (separate repo, velion-lab.com).
    name: "VELION LAB",
    slug: "velion",
    kind: "platform",
    windows: 4,
    category: "Продукт с онлайн програма",
    categoryEn: "Online programme product",
    sector: "Онлайн програма",
    summary: "Собствен продукт на 13:33: 60-дневна онлайн програма — продуктова страница, която разказва метода, и вход за членовете.",
    summaryEn:
      "Our own product: a 60-day online programme — a product page that tells the method, and a members' login.",
    role: ["Бранд", "Продуктова страница", "Вход за членове"],
    status: "own-product",
    ...media("velion"),
    liveUrl: "https://velion-lab.com",
    need: "Програмата трябва да обясни деликатна тема спокойно и ясно и да доведе до записване.",
    approach: ["Разказ на части — истината, методът, един ден вътре, сравнение.", "Една цена и един бутон за начало."],
    year: 2026,
  },
];

export const getProject = (slug: string | undefined) =>
  projects.find((p) => p.slug === slug);
