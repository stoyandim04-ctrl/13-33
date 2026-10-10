// All copy in one place. Варовик is a made-up building - a 13:33 concept -
// so nothing here may read as a real offer: no prices, no dates, no investor.

export const site = {
  name: "Варовик",
  studio: "13:33 Digital Studio",
  conceptNote: "Измислен проект — концепция на студио 13:33. Няма инвеститор, цени или срокове.",
};

export const nav = [
  { href: "#den", label: "Денят" },
  { href: "#zhilishta", label: "Жилища" },
  { href: "#materiali", label: "Материали" },
];

/** One chapter per story beat in scene/day.ts, same order. */
export const chapters = [
  {
    eyebrow: "Концепция · жилищна сграда",
    title: "Варовик",
    lead: "Пет етажа камък, стъкло и тераси в полите на планината. Скролнете — ще ви покажем един ден тук.",
  },
  {
    eyebrow: "Утро",
    title: "Светлината влиза първо в спалните",
    lead: "Спалните гледат на изток. Денят започва с мека светлина, не с будилник.",
  },
  {
    eyebrow: "Обед",
    title: "Сянка точно когато трябва",
    lead: "Дълбоките тераси спират високото лятно слънце, а ниското зимно пускат навътре.",
  },
  {
    eyebrow: "Залез",
    title: "Водата удвоява небето",
    lead: "Басейнът стои на оста на сградата. Привечер в него се оглеждат терасите и планината.",
  },
  {
    eyebrow: "Вечер",
    title: "Къщата светва отвътре",
    lead: "Топла светлина зад камъка и тишина, която се чува.",
  },
];

export type Room = { x: number; y: number; w: number; h: number; label?: string; outdoor?: boolean };

export interface Residence {
  id: string;
  name: string;
  floors: string;
  note: string;
  area: number;
  outdoor: number;
  outdoorLabel: string;
  bedrooms: number;
  /** Plan in a 100 × 64 box; outdoor rooms are drawn dashed. */
  plan: Room[];
}

// Areas are part of the concept's design brief, not a sales offer.
export const residences: Residence[] = [
  {
    id: "gradinski",
    name: "Градински",
    floors: "Партер",
    note: "Дневната излиза направо в собствена градина с маслини.",
    area: 118,
    outdoor: 90,
    outdoorLabel: "Градина",
    bedrooms: 2,
    plan: [
      { x: 4, y: 4, w: 30, h: 22, label: "Спалня" },
      { x: 34, y: 4, w: 14, h: 11, label: "Баня" },
      { x: 34, y: 15, w: 14, h: 11, label: "Килер" },
      { x: 48, y: 4, w: 22, h: 22, label: "Спалня" },
      { x: 70, y: 4, w: 26, h: 22, label: "Кухня" },
      { x: 4, y: 26, w: 92, h: 16, label: "Дневна" },
      { x: 4, y: 42, w: 92, h: 18, label: "Градина", outdoor: true },
    ],
  },
  {
    id: "terasov",
    name: "Терасов",
    floors: "Етажи 2–4",
    note: "Терасата е широка колкото цялото жилище и дълбока над три метра.",
    area: 146,
    outdoor: 42,
    outdoorLabel: "Тераса",
    bedrooms: 3,
    plan: [
      { x: 4, y: 4, w: 24, h: 22, label: "Спалня" },
      { x: 28, y: 4, w: 14, h: 11, label: "Баня" },
      { x: 28, y: 15, w: 14, h: 11, label: "Баня" },
      { x: 42, y: 4, w: 24, h: 22, label: "Спалня" },
      { x: 66, y: 4, w: 30, h: 22, label: "Спалня" },
      { x: 4, y: 26, w: 56, h: 20, label: "Дневна" },
      { x: 60, y: 26, w: 36, h: 20, label: "Кухня" },
      { x: 4, y: 46, w: 92, h: 14, label: "Тераса", outdoor: true },
    ],
  },
  {
    id: "penthaus",
    name: "Пентхаус",
    floors: "Последен етаж",
    note: "Терасата обикаля жилището от три страни. Планината е в дневната.",
    area: 210,
    outdoor: 120,
    outdoorLabel: "Тераса",
    bedrooms: 3,
    plan: [
      { x: 14, y: 4, w: 26, h: 20, label: "Спалня" },
      { x: 40, y: 4, w: 16, h: 20, label: "Баня" },
      { x: 56, y: 4, w: 30, h: 20, label: "Спалня" },
      { x: 14, y: 24, w: 20, h: 18, label: "Спалня" },
      { x: 34, y: 24, w: 52, h: 18, label: "Дневна и кухня" },
      { x: 4, y: 4, w: 10, h: 38, outdoor: true },
      { x: 86, y: 4, w: 10, h: 38, outdoor: true },
      { x: 4, y: 42, w: 92, h: 18, label: "Тераса", outdoor: true },
    ],
  },
];

export const materials = [
  {
    id: "travertine" as const,
    name: "Травертин",
    use: "Фасада и тераси",
    text: "Порест, топъл и матов. С годините става по-мек, не по-стар.",
  },
  {
    id: "oak" as const,
    name: "Дъб",
    use: "Подове и дограма",
    text: "Масив с маслено покритие. Под бос крак е топъл и през зимата.",
  },
  {
    id: "linen" as const,
    name: "Лен",
    use: "Завеси и тапицерия",
    text: "Пропуска светлината, спира погледа. Вечер прави прозорците да светят меко.",
  },
];
