export type Program = {
  id: string;
  name: string;
  subtitle: string;
  duration?: string;
  category: string;
  status: "planned";
  color: string;
  symbol: string;
};

// Names, durations and subtitles are confirmed in the supplied Notion export.
// No item is confirmed commercially available. Do not add prices or purchase CTAs.
export const programs: Program[] = [
  {
    id: "start",
    name: "MUSE START",
    subtitle: "Влез в ритъм",
    duration: "4 седмици",
    category: "Предизвикателство",
    status: "planned",
    color: "peach",
    symbol: "01",
  },
  {
    id: "strong",
    name: "MUSE STRONG",
    subtitle: "Надгради силата и навиците си",
    duration: "6 седмици",
    category: "Предизвикателство",
    status: "planned",
    color: "plum",
    symbol: "02",
  },
  {
    id: "hiit",
    name: "HIIT VIBES AT HOME",
    subtitle: "Твоята тренировка. На твоя терен.",
    category: "Домашни HIIT тренировки",
    status: "planned",
    color: "sage",
    symbol: "03",
  },
  {
    id: "coaching",
    name: "STRONG MUSE COACHING",
    subtitle: "Индивидуален подход с мен",
    category: "Онлайн коучинг",
    status: "planned",
    color: "rose",
    symbol: "04",
  },
];

export const nutrition = [
  {
    title: "Методът на чинията",
    subtitle: "Материал за хранене",
    type: "PDF · 7 страници",
    number: "01",
  },
  {
    title: "7-дневен хранителен план",
    subtitle: "Материал за хранене",
    type: "PDF · 8 страници",
    number: "02",
  },
];
