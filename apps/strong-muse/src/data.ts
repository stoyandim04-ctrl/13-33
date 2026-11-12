export type Program = {
  id: string;
  name: string;
  subtitle: string;
  duration?: string;
  category: string;
  status: "planned";
  /** Display word on the card cover — typography only, not a claim. */
  word: string;
  /** Cover photo Anna chose and its crop focus; none yet shows the plain cover. */
  photo?: string;
  focus?: string;
};

// Names, durations and subtitles are confirmed in the supplied Notion export;
// BIKINI PREP and its subtitle come from Anna's message of 2026-11-12.
// No item is confirmed commercially available. Do not add prices or purchase CTAs.
export const programs: Program[] = [
  {
    id: "start",
    name: "MUSE START",
    subtitle: "Влез в ритъм",
    duration: "4 седмици",
    category: "Предизвикателство",
    status: "planned",
    word: "START",
    photo: "/anna/anna-start.webp",
    focus: "50% 2%",
  },
  {
    id: "strong",
    name: "MUSE STRONG",
    subtitle: "Надгради силата и навиците си",
    duration: "6 седмици",
    category: "Предизвикателство",
    status: "planned",
    word: "STRONG",
    photo: "/anna/anna-strong.webp",
    focus: "50% 28%",
  },
  {
    id: "hiit",
    name: "HIIT VIBES AT HOME",
    subtitle: "Твоята тренировка. На твоя терен.",
    category: "Домашни HIIT тренировки",
    status: "planned",
    word: "HIIT",
  },
  {
    id: "coaching",
    name: "STRONG MUSE COACHING",
    subtitle: "Индивидуален подход с мен",
    category: "Онлайн коучинг",
    status: "planned",
    word: "COACH",
    photo: "/anna/anna-coaching.webp",
    focus: "72% 45%",
  },
  {
    id: "bikini",
    name: "BIKINI PREP",
    subtitle: "Подготовка на бикини състезателки",
    category: "Състезателна подготовка",
    status: "planned",
    word: "PREP",
    photo: "/anna/anna-bikini-prep.webp",
    focus: "50% 30%",
  },
];

// Covers are the first pages of the PDFs Anna supplied. The PDFs themselves
// are not in the repo or the site until the brief's review is done.
export const nutrition = [
  {
    title: "Методът на чинията",
    subtitle: "Материал за хранене",
    type: "PDF · 7 страници",
    number: "01",
    cover: "/nutrition/metodat-na-chiniyata-cover.webp",
  },
  {
    title: "7-дневен хранителен план",
    subtitle: "Материал за хранене",
    type: "PDF · 8 страници",
    number: "02",
    cover: "/nutrition/7-dneven-plan-cover.webp",
  },
];
