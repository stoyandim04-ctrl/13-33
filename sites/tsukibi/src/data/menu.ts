// Менюто на Цукиби. Ресторантът е концепция на 13:33 — ястията, цените и
// съставките са измислени за демонстрацията.

export type CategoryId = "cold" | "robata" | "bowls" | "small" | "share" | "sweet";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "cold", label: "Сурово" },
  { id: "robata", label: "От робата" },
  { id: "bowls", label: "Купи" },
  { id: "small", label: "Малки чинии" },
  { id: "share", label: "За споделяне" },
  { id: "sweet", label: "Десерти" },
];

/** Точка от чинията (в % от изображението) и надпис към нея. */
export interface Hotspot {
  x: number;
  y: number;
  kicker: string;
  label: string;
}

export interface Dish {
  slug: string;
  name: string;
  /** Оригиналното име — японски, китайски, тайландски. */
  native: string;
  category: CategoryId;
  description: string;
  price: number;
  image: string;
  /** Пикантност 0–3. */
  heat?: number;
  tags?: string[];
  hotspots: Hotspot[];
}

const img = (slug: string) => `/img/dishes/${slug}.webp`;

export const dishes: Dish[] = [
  {
    slug: "wagyu",
    name: "Уагю татаки",
    native: "和牛たたき",
    category: "robata",
    description:
      "Уагю A5 от Миядзаки, запечено за секунди над бинчотан. Черен трюфел, юзу кошо и тъмен таре, отлежал 90 дни.",
    price: 34,
    image: img("wagyu"),
    tags: ["Подпис на кухнята"],
    hotspots: [
      { x: 45, y: 52, kicker: "Миядзаки A5", label: "Уагю филе" },
      { x: 40, y: 20, kicker: "Настърган", label: "Черен трюфел" },
      { x: 22, y: 42, kicker: "Гарнитура", label: "Микро шисо" },
      { x: 78, y: 45, kicker: "Домашно", label: "Юзу кошо" },
      { x: 85, y: 66, kicker: "Отлежал 90 дни", label: "Таре" },
    ],
  },
  {
    slug: "nigiri",
    name: "Омакасе нигири",
    native: "おまかせ握り",
    category: "cold",
    description:
      "Осем хапки по избор на шефа тази вечер: оторо, сьомга, тай, уни, икура, миди, аками и глазирана унаги.",
    price: 32,
    image: img("nigiri"),
    tags: ["8 хапки"],
    hotspots: [
      { x: 12, y: 52, kicker: "Корем от тон", label: "Оторо" },
      { x: 45, y: 72, kicker: "Маринован", label: "Джинджифил" },
      { x: 42, y: 37, kicker: "Морски таралеж", label: "Уни" },
      { x: 61, y: 71, kicker: "Прясно настъргано", label: "Уасаби" },
      { x: 93, y: 50, kicker: "Глазирана", label: "Унаги" },
    ],
  },
  {
    slug: "ramen",
    name: "Тонкоцу рамен",
    native: "豚骨ラーメン",
    category: "bowls",
    description:
      "Бульон от свински кости, вариран осемнадесет часа. Опърлено чашу, яйце аджитама с кремообразен жълтък и тънки нудли Хаката.",
    price: 16,
    image: img("ramen"),
    tags: ["18 часа бульон"],
    hotspots: [
      { x: 30, y: 52, kicker: "Опърлено", label: "Чашу" },
      { x: 22, y: 30, kicker: "18 часа", label: "Бульон тонкоцу" },
      { x: 52, y: 20, kicker: "Дървесни гъби", label: "Кикураге" },
      { x: 75, y: 12, kicker: "Печено", label: "Нори" },
      { x: 55, y: 35, kicker: "Ситно", label: "Зелен лук" },
      { x: 78, y: 42, kicker: "Мек жълтък", label: "Аджитама" },
    ],
  },
  {
    slug: "cod",
    name: "Черна треска с мисо",
    native: "銀ダラ西京焼き",
    category: "robata",
    description:
      "Черна треска, мариновала три дни в сладко мисо Сайкьо. Карамелизирана над въглените, с юзу бьор блан и маринован джинджифил.",
    price: 29,
    image: img("cod"),
    hotspots: [
      { x: 35, y: 50, kicker: "3 дни в мисо", label: "Черна треска" },
      { x: 25, y: 58, kicker: "Печен", label: "Сусам" },
      { x: 56, y: 30, kicker: "На конци", label: "Шисо" },
      { x: 75, y: 30, kicker: "Сос", label: "Юзу бьор блан" },
      { x: 70, y: 52, kicker: "Маринован", label: "Хаджиками" },
    ],
  },
  {
    slug: "chirashi",
    name: "Чираши купа",
    native: "ちらし丼",
    category: "cold",
    description:
      "Ориз за суши, покрит с риба тон, сьомга, жълтоопашат лефер, сладки скариди, тамагояки и хайвер от сьомга.",
    price: 26,
    image: img("chirashi"),
    hotspots: [
      { x: 25, y: 25, kicker: "Аками", label: "Риба тон" },
      { x: 45, y: 40, kicker: "Хайвер от сьомга", label: "Икура" },
      { x: 20, y: 52, kicker: "Сладък омлет", label: "Тамагояки" },
      { x: 52, y: 8, kicker: "Свеж лист", label: "Шисо" },
      { x: 65, y: 25, kicker: "Сашими", label: "Сьомга" },
      { x: 65, y: 42, kicker: "Ветрило", label: "Авокадо" },
    ],
  },
  {
    slug: "gyoza",
    name: "Гьоза с хрупкава пола",
    native: "焼き餃子",
    category: "small",
    description:
      "Шест ръчно сгънати гьоза със свинско и зеле, запечени заедно в тънка хрупкава „пола“. Чили масло и понзу.",
    price: 11,
    image: img("gyoza"),
    heat: 1,
    hotspots: [
      { x: 25, y: 30, kicker: "Нишесте и вода", label: "Хрупкава пола" },
      { x: 30, y: 60, kicker: "Домашно", label: "Чили масло" },
      { x: 82, y: 15, kicker: "Цитрус и соя", label: "Понзу" },
      { x: 60, y: 42, kicker: "Свинско и зеле", label: "Гьоза" },
    ],
  },
  {
    slug: "yakitori",
    name: "Якитори от бут",
    native: "焼き鳥 もも",
    category: "robata",
    description:
      "Пилешки бут и японски праз на шиш, лакирани с таре на всяко обръщане. Шичими, лимон и настърган дайкон.",
    price: 13,
    image: img("yakitori"),
    heat: 1,
    hotspots: [
      { x: 28, y: 45, kicker: "На шиш", label: "Пилешки бут" },
      { x: 46, y: 50, kicker: "Японски", label: "Праз" },
      { x: 65, y: 18, kicker: "Свеж", label: "Лимон" },
      { x: 77, y: 30, kicker: "Настърган", label: "Дайкон" },
      { x: 62, y: 66, kicker: "Седем подправки", label: "Шичими" },
    ],
  },
  {
    slug: "bao",
    name: "Бао с бавно свинско",
    native: "刈包",
    category: "small",
    description:
      "Пухкави бао на пара, пълнени със свинско бонфиле, задушено шест часа. Хоисин, мариновани краставици, фъстъци и кориандър.",
    price: 12,
    image: img("bao"),
    heat: 1,
    hotspots: [
      { x: 25, y: 60, kicker: "На пара", label: "Бао" },
      { x: 22, y: 38, kicker: "Печени", label: "Фъстъци" },
      { x: 55, y: 25, kicker: "6 часа", label: "Свинско бонфиле" },
      { x: 62, y: 18, kicker: "Пресен", label: "Червен чили" },
      { x: 82, y: 65, kicker: "Свеж", label: "Кориандър" },
    ],
  },
  {
    slug: "duck",
    name: "Пекинска патица",
    native: "北京烤鸭",
    category: "share",
    description:
      "Патица, сушена 48 часа и печена до стъклено хрупкава кожа. Тънки палачинки, краставица, лук и сос хоисин със слива.",
    price: 38,
    image: img("duck"),
    tags: ["За двама"],
    hotspots: [
      { x: 25, y: 20, kicker: "Тънки", label: "Палачинки" },
      { x: 30, y: 62, kicker: "Стъклено хрупкава", label: "Кожа" },
      { x: 75, y: 15, kicker: "Със слива", label: "Хоисин" },
      { x: 52, y: 40, kicker: "На жулиени", label: "Краставица и лук" },
    ],
  },
  {
    slug: "padthai",
    name: "Пад тай с тигрови скариди",
    native: "ผัดไทย",
    category: "bowls",
    description:
      "Оризови нудли, разбъркани в уок на силен огън с тамаринд. Тигрови скариди от робата, кълнове, печени фъстъци и лайм.",
    price: 19,
    image: img("padthai"),
    heat: 2,
    hotspots: [
      { x: 28, y: 15, kicker: "Свеж", label: "Лайм" },
      { x: 15, y: 42, kicker: "Хрупкави", label: "Кълнове" },
      { x: 60, y: 55, kicker: "От робата", label: "Тигрови скариди" },
      { x: 80, y: 30, kicker: "Печени", label: "Фъстъци" },
      { x: 88, y: 46, kicker: "Сушено", label: "Чили" },
    ],
  },
  {
    slug: "matcha",
    name: "Чийзкейк с матча",
    native: "抹茶チーズケーキ",
    category: "sweet",
    description:
      "Баски чийзкейк с церемониална матча от Уджи и карамелизиран връх. Крем от черен сусам и пресни малини.",
    price: 10,
    image: img("matcha"),
    hotspots: [
      { x: 30, y: 30, kicker: "Поръсена", label: "Прах от матча" },
      { x: 45, y: 47, kicker: "От Уджи", label: "Матча" },
      { x: 65, y: 57, kicker: "Крем", label: "Черен сусам" },
      { x: 77, y: 47, kicker: "Пресни", label: "Малини" },
    ],
  },
  {
    slug: "mochi",
    name: "Моти сладолед",
    native: "もち",
    category: "sweet",
    description:
      "Три топки моти: сакура, юзу и черен сусам. Поръсени с кинако и сироп куромицу.",
    price: 9,
    image: img("mochi"),
    hotspots: [
      { x: 32, y: 32, kicker: "Розово", label: "Сакура" },
      { x: 30, y: 66, kicker: "Печена соя", label: "Кинако" },
      { x: 78, y: 42, kicker: "Цитрусово", label: "Юзу" },
      { x: 56, y: 66, kicker: "Тъмно", label: "Черен сусам" },
      { x: 75, y: 82, kicker: "Тъмен сироп", label: "Куромицу" },
    ],
  },
];

export const formatPrice = (n: number) =>
  `${n.toFixed(2).replace(".", ",")} €`;
