// Portfolio data for the WorksWheel and the project pages.
//
// IMPORTANT - honesty rules (from the 13:33 master pack):
// - Never present a concept as a finished client project.
// - Never use another studio's or a client's site as ours without permission.
// - Every entry below is a CONCEPT created by 13:33 to show range. The posters
//   and recordings in /public/projects/<slug>/ are rendered from our own
//   concept mock-ups (scripts/build-concept-media.mjs) - no stock, no third
//   party sites.
//
// To add a real project: copy an entry, set `status`, drop `poster.webp`
// (1450×1000) and `preview.mp4` + `preview.webm`, ~6–10 s, muted,
// no audio track; `npm run media` shows the ffmpeg settings) into /public/projects/<slug>/, and set `liveUrl` if the site
// is public and the client agreed to be shown.
//
// Candidates waiting for confirmation (link, recording, status, permission) -
// see Notion "Проекти в спиралата": VELION LAB (own product), INTNS / FitCheck,
// Strong Muse. Not listed here until those are confirmed.

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
    name: "Линия Архитекти",
    slug: "liniya-arhitekti",
    category: "Сайт-портфолио",
    sector: "Архитектурно студио",
    summary:
      "Сайт за архитектурно студио, в който обектите водят разказа, а запитването е на един клик от всеки проект.",
    role: ["Информационна архитектура", "Визуална концепция", "Прототип"],
    status: "concept",
    ...media("liniya-arhitekti"),
    need:
      "Студиото продава с доверие и усещане за качество. Посетителят трябва бързо да види подходящи обекти и да разбере как започва работата с тях.",
    approach: [
      "Обектите са организирани по тип и мащаб, с големи кадри и кратки технически данни.",
      "Всеки обект завършва с ясна стъпка към запитване, без да прекъсва разглеждането.",
      "Спокойна типография и много въздух — сайтът не спори с архитектурата.",
    ],
    year: 2026,
  },
  {
    name: "Глина & Огън",
    slug: "glina-i-ogan",
    category: "Онлайн магазин",
    sector: "Ръчно изработена керамика",
    summary:
      "Онлайн магазин за малка керамична работилница: продуктите се виждат отблизо, а поръчката минава без излишни стъпки.",
    role: ["Структура на каталога", "Продуктови страници", "Поток на поръчката"],
    status: "concept",
    ...media("glina-i-ogan"),
    need:
      "Ръчно изработените продукти губят стойност, когато изглеждат като в обикновен каталог. Магазинът трябва да предаде материала и да улесни покупката.",
    approach: [
      "Продуктова страница с близки кадри, размери и грижа за изделието на едно място.",
      "Колекции вместо безкрайни филтри — по-лесен избор за подарък или комплект.",
      "Кратък път до плащане и ясни срокове за изработка и доставка.",
    ],
    year: 2026,
  },
  {
    name: "Ритъм",
    slug: "ritam-kouching",
    category: "Фуния за записвания",
    sector: "Онлайн коучинг",
    summary:
      "Фуния за онлайн коуч: от рекламата до кратък въпросник и записване за първи разговор.",
    role: ["Стратегия на фунията", "Лендинг страница", "Въпросник и записване"],
    status: "concept",
    ...media("ritam-kouching"),
    need:
      "Запитванията идват разпръснато в съобщения и са трудни за проследяване. Нужен е един път, който подготвя клиента още преди разговора.",
    approach: [
      "Една страница с ясно обещание, програма и отговори на най-честите възражения.",
      "Въпросник, който подрежда целите и опита на клиента преди разговора.",
      "Записване в свободен час и автоматично потвърждение.",
    ],
    year: 2026,
  },
  {
    name: "Сфера",
    slug: "sfera-portal",
    category: "Клиентски портал",
    sector: "Консултантска практика",
    summary:
      "Портал, в който клиентите на консултантска практика виждат етапите, документите и съобщенията си на едно място.",
    role: ["UX на портала", "Интерфейс", "Прототип на основните екрани"],
    status: "concept",
    ...media("sfera-portal"),
    need:
      "Информацията за всеки клиент е пръсната в имейли и папки. Клиентите питат едно и също, а екипът губи време в търсене.",
    approach: [
      "Табло с текущия етап, следващата стъпка и отговорния човек.",
      "Документи и съобщения, вързани към конкретния проект, а не към пощата.",
      "Достъп по роли — клиентът вижда само своето.",
    ],
    year: 2026,
  },
  {
    name: "Обсидиан",
    slug: "obsidian-lampa",
    category: "Продуктова страница",
    sector: "Продуктов бранд",
    summary:
      "Кинематографично представяне на един продукт — настолна лампа — с детайли, материали и директна поръчка.",
    role: ["Визуална концепция", "Сценарий на страницата", "Анимация и прототип"],
    status: "concept",
    ...media("obsidian-lampa"),
    need:
      "Един продукт с висока цена трябва да се усети, преди да се купи. Страницата замества витрината.",
    approach: [
      "Сцени, които показват формата, светлината и материала един по един.",
      "Технически данни и комплектация без да се губи атмосферата.",
      "Поръчка от всяка точка на страницата.",
    ],
    year: 2026,
  },
  {
    name: "Поток",
    slug: "potok-zayavki",
    category: "Система и автоматизация",
    sector: "Сервизна фирма",
    summary:
      "Вътрешна система за заявки: заявката влиза, разпределя се към техник и клиентът получава известие на всяка стъпка.",
    role: ["Анализ на процеса", "Интерфейс", "Автоматизации"],
    status: "concept",
    ...media("potok-zayavki"),
    need:
      "Заявките идват по телефон, имейл и съобщения. Част от тях се губят, а клиентите не знаят кога ще бъдат обслужени.",
    approach: [
      "Една входна точка за всички заявки, с приоритет и статус.",
      "Автоматично разпределение според района и натовареността.",
      "Известия към клиента при приемане, насрочване и приключване.",
    ],
    year: 2026,
  },
];

export const getProject = (slug: string | undefined) =>
  projects.find((p) => p.slug === slug);
