/**
 * FERAL — вкусовете. Всичко е измислено за концепцията на 13:33: марка, вкусове,
 * състав и цени. Кофеинът е 32 мг/100 мл (= 160 мг в кенче 500 мл) — нормалното
 * за енергийна напитка, затова етикетът носи и задължителното предупреждение.
 */
export type Flavour = {
  id: string;
  /** Име на кенчето (главни букви — рисува се и върху етикета). */
  name: string;
  /** Плодът, кратко. */
  fruit: string;
  line: string;
  /** Фон на сцената и цвят на етикета. */
  bg: string;
  /** Цвят на кенчето (етикетът). */
  can: string;
  /** Текст върху етикета и върху фона. */
  ink: string;
  /** Акцент — капачката, резенчетата, ивицата. */
  accent: string;
  /** Цветът на плода в експлозията: кора и месо. */
  rind: string;
  flesh: string;
  sugar: string;
  kcal: number;
};

export const FLAVOURS: Flavour[] = [
  {
    id: "yarost",
    name: "RAGE",
    fruit: "Blood orange",
    line: "Blood orange and red grapefruit. Bitter at first, sweet at the end.",
    bg: "#ff2b1c",
    can: "#ff2b1c",
    ink: "#0a0a0a",
    accent: "#ffd400",
    rind: "#ff6a00",
    flesh: "#d0121b",
    sugar: "0 g",
    kcal: 4,
  },
  {
    id: "kiselina",
    name: "ACID",
    fruit: "Lime & yuzu",
    line: "Lime, yuzu and a pinch of salt. Locks your jaw from the first sip.",
    bg: "#c8ff00",
    can: "#c8ff00",
    ink: "#0a0a0a",
    accent: "#0a0a0a",
    rind: "#3f9b0b",
    flesh: "#d8ff5c",
    sugar: "0 g",
    kcal: 3,
  },
  {
    id: "noshtna-smyana",
    name: "NIGHT SHIFT",
    fruit: "Blackberry & cassis",
    line: "Blackberry, cassis and a hint of lavender. For the shift nobody wants.",
    bg: "#6a1bff",
    can: "#6a1bff",
    ink: "#f4f1ea",
    accent: "#ff3df2",
    rind: "#2a0a52",
    flesh: "#b02bd6",
    sugar: "0 g",
    kcal: 5,
  },
  {
    id: "grum",
    name: "THUNDER",
    fruit: "Mango & passion fruit",
    line: "Ripe mango and passion fruit, seeds and all. Tropical, with a fist.",
    bg: "#ff8a00",
    can: "#ff8a00",
    ink: "#0a0a0a",
    accent: "#ff2b1c",
    rind: "#e05a00",
    flesh: "#ffc21a",
    sugar: "0 g",
    kcal: 6,
  },
  {
    id: "led",
    name: "ICE",
    fruit: "Blueberry & mint",
    line: "Blueberry and frozen mint. Burns like cold does.",
    bg: "#16c8ff",
    can: "#16c8ff",
    ink: "#0a0a0a",
    accent: "#f4f1ea",
    rind: "#1b3fff",
    flesh: "#8fe9ff",
    sugar: "0 g",
    kcal: 4,
  },
  {
    id: "nula",
    name: "ZERO",
    fruit: "Black cherry",
    line: "Black cherry and nothing else. No sugar, no colour, no apologies.",
    bg: "#141414",
    can: "#0c0c0c",
    ink: "#f4f1ea",
    accent: "#ff2b1c",
    rind: "#4a0010",
    flesh: "#9c0a2a",
    sugar: "0 g",
    kcal: 2,
  },
];

export const PACKS = [
  { size: 4, price: 13.9 },
  { size: 12, price: 37.9 },
  { size: 24, price: 69.9 },
] as const;

export const CLAIMS = [
  {
    big: "160",
    unit: "mg",
    title: "Caffeine from green coffee",
    text: "Two espressos' worth in one 500 ml can. No taurine, no synthetic boosters.",
  },
  {
    big: "0",
    unit: "g",
    title: "Sugar. None.",
    text: "Sweetened with erythritol and stevia. The taste comes from real juice, not syrup.",
  },
  {
    big: "12",
    unit: "%",
    title: "Real fruit juice",
    text: "If the can says orange, there's orange in the can. Squeezed, not flavoured.",
  },
  {
    big: "B",
    unit: "6 · 12",
    title: "Vitamins, not promises",
    text: "B3, B6 and B12 — what you need for the day. Nothing you can't pronounce.",
  },
];

export const FAQ = [
  {
    q: "How much caffeine is in a can?",
    a: "160 mg in 500 ml — about two cups of espresso. Don't drink more than two cans a day.",
  },
  {
    q: "Who is it not for?",
    a: "Children, pregnant and breastfeeding women — it says so on the can too. High caffeine content.",
  },
  {
    q: "No sugar, so why is it sweet?",
    a: "Erythritol and stevia. They don't spike blood sugar and, in the right ratio, leave no metallic aftertaste.",
  },
  {
    q: "Can I mix it with alcohol?",
    a: "We don't recommend it. Caffeine hides tiredness, not alcohol.",
  },
  {
    q: "When does my order arrive?",
    a: "This is a concept — nothing is sold or shipped. The cart is here so you can see how it would work.",
  },
];
