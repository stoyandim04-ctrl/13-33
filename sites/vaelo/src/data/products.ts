/*
  Колекция 001 — „Безтегловност“. Брандът, дрехите и цените са измислени
  (концепция на 13:33); снимките и завъртанията са генерирани с Higgsfield.

  img     — /img/p/<slug>.webp, прозрачен фон, лице
  spin    — брой кадри в /img/spin/<slug>/NN.webp: един пълен оборот, 00 = лице,
            spin/2 = гръб (0 = няма завъртане, показва се снимката с лек наклон)
*/
export type Product = {
  slug: string;
  name: string;
  kind: string;
  color: string;
  swatch: string;
  price: number;
  fabric: string;
  fit: string;
  note: string;
  spin: number;
};

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

export const products: Product[] = [
  {
    slug: "graphite-hoodie",
    name: "Graphite",
    kind: "Суитшърт с качулка",
    color: "Графит",
    swatch: "#3a3a3b",
    price: 140,
    fabric: "Памучен френски тери, 480 г/м², гладко отвътре",
    fit: "Свободна, ниско рамо. Ако си между два размера — по-малкия.",
    note: "Тежък, мек и тих. Логото е избродирано в същия цвят — вижда се само отблизо.",
    spin: 48,
  },
  {
    slug: "bone-tee",
    name: "Bone",
    kind: "Тениска",
    color: "Слонова кост",
    swatch: "#ece6da",
    price: 65,
    fabric: "Плътно плетен памук, 300 г/м², предварително свит",
    fit: "Кутийна кройка, къса талия, широки ръкави.",
    note: "Основата на гардероба. Дебело рипсено деколте, което не се разтегля.",
    spin: 48,
  },
  {
    slug: "olive-overshirt",
    name: "Olive",
    kind: "Риза-яке",
    color: "Маслина",
    swatch: "#4a5130",
    price: 210,
    fabric: "Вълнено мелтон сукно, 70% вълна, копчета от рог",
    fit: "Права, кутийна. Носи се върху тениска или под палто.",
    note: "Между риза и яке — за дните, в които не знаеш кое от двете.",
    spin: 48,
  },
  {
    slug: "midnight-bomber",
    name: "Midnight",
    kind: "Бомбър",
    color: "Полунощно синьо",
    swatch: "#1d2747",
    price: 260,
    fabric: "Сатен с лек блясък, ватирана подплата, метален цип",
    fit: "Обемна, къса до кръста, рипсени маншети.",
    note: "Сатенът хваща светлината различно от всеки ъгъл — затова го завъртай.",
    spin: 48,
  },
  {
    slug: "oat-cable",
    name: "Oat Cable",
    kind: "Плетен пуловер",
    color: "Овес",
    swatch: "#e2d8c4",
    price: 190,
    fabric: "Вълна и алпака, ръчно довършена плетка „въже“",
    fit: "Свободна, удължени ръкави.",
    note: "Плетката е дълбока и обемна — светлината пада по нея като по релеф.",
    spin: 48,
  },
  {
    slug: "jersey-13",
    name: "Jersey Nº13",
    kind: "Футболна фланелка",
    color: "Черно / кърваво",
    swatch: "#111111",
    price: 120,
    fabric: "Жакардова мрежа с тонално райе, бродерия отпред",
    fit: "Отпусната, малко по-дълга отзад.",
    note: "Фланелка за трибуните на града, не за терена. Номер 13 на гърба.",
    spin: 48,
  },
  {
    slug: "stone-cargo",
    name: "Stone",
    kind: "Карго панталон",
    color: "Камък",
    swatch: "#cfc3ad",
    price: 160,
    fabric: "Тежък памучен туил, 340 г/м²",
    fit: "Широк крачол до земята, висока талия.",
    note: "Джобовете са там, където ръката ги търси — и нищо повече.",
    spin: 48,
  },
  {
    slug: "camel-coat",
    name: "Camel",
    kind: "Двуредно палто",
    color: "Камилска вълна",
    swatch: "#b8865a",
    price: 420,
    fabric: "Вълна и кашмир, 80/20, сатенена подплата",
    fit: "Обемна, до коляното, ниско рамо.",
    note: "Палтото, около което се строи цялата зима.",
    spin: 48,
  },
];

export const euro = (n: number) => `€${n.toLocaleString("bg-BG")}`;
