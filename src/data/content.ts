// All copy in one place. Варовик is a made-up building - a 13:33 concept -
// so nothing here may read as a real offer: no prices, no dates, no investor.

export const site = {
  name: "Варовик",
  tagline: "Резиденции",
  studio: "13:33 Digital Studio",
  conceptNote: "Измислен проект — концепция на студио 13:33. Няма инвеститор, цени или срокове.",
};

export const nav = [
  { href: "#pristigane", label: "Сградата" },
  { href: "#zhilishta", label: "Жилища" },
  { href: "#materiali", label: "Материали" },
];

/** The scroll walk. `from`/`to` are scroll windows (0..1) for each caption;
 *  they line up with the holds in components/arrival.tsx. */
export const arrival = {
  chapters: [
    {
      place: "Пристигане",
      eyebrow: "Резиденции в полите на планината",
      title: "Варовик",
      lead: "Камък, светлина и тишина. Елате — ще ви разведем.",
      from: -1,
      to: 0.06,
    },
    {
      place: "Алеята",
      eyebrow: "Към входа",
      title: "Пътят минава по водата",
      lead: "Пътят до вкъщи минава покрай басейна и стари маслини. Градът остава зад вас.",
      from: 0.12,
      to: 0.26,
    },
    {
      place: "Входът",
      eyebrow: "Порталът",
      title: "Камък, който ви посреща",
      lead: "Двоен по височина вход от травертин и стъкло. Вечер светлината отвътре се вижда от алеята.",
      from: 0.295,
      to: 0.4,
    },
    {
      place: "Лобито",
      eyebrow: "Лоби",
      title: "Топло, тихо, високо",
      lead: "Травертин, дъб и мека светлина. Тук не чакате — тук пристигате.",
      from: 0.5,
      to: 0.66,
    },
    {
      place: "Дворът",
      eyebrow: "Вътрешен двор",
      title: "Градина само за живущите",
      lead: "Басейн, маслини и кипариси зад стената, а над тях — планината.",
      from: 0.87,
      to: 2,
    },
  ],
  /** Points on the lobby frame (0..1 of the film frame). */
  hotspots: [
    { label: "Стъкло към градината", x: 0.14, y: 0.32 },
    { label: "Висящи лампи", x: 0.53, y: 0.24 },
    { label: "Към двора", x: 0.5, y: 0.6 },
    { label: "Рецепция", x: 0.8, y: 0.63 },
  ],
};

export type Room = { x: number; y: number; w: number; h: number; label?: string; outdoor?: boolean };

export interface Residence {
  id: string;
  name: string;
  floors: string;
  note: string;
  image: string;
  imageAlt: string;
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
    image: "/media/residence-garden.webp",
    imageAlt: "Дневна с травертинов под, отворена към градина с маслини",
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
    image: "/media/residence-terrace.webp",
    imageAlt: "Дневна и трапезария с дъбов под и тераса към планината по залез",
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
    note: "Терасата обикаля жилището от три страни, с басейн и планината отпред.",
    image: "/media/residence-penthouse.webp",
    imageAlt: "Покривна тераса с басейн и изглед към планината в синия час",
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
    id: "travertine",
    name: "Травертин",
    use: "Фасада и тераси",
    text: "Порест, топъл и матов. С годините става по-мек, не по-стар.",
    image: "/media/material-travertine.webp",
  },
  {
    id: "oak",
    name: "Дъб",
    use: "Подове и дограма",
    text: "Масив с маслено покритие. Под бос крак е топъл и през зимата.",
    image: "/media/material-oak.webp",
  },
  {
    id: "linen",
    name: "Лен",
    use: "Завеси и тапицерия",
    text: "Пропуска светлината, спира погледа. Вечер прави прозорците да светят меко.",
    image: "/media/material-linen.webp",
  },
];
