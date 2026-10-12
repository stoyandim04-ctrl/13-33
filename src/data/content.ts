// Site copy. Bulgarian first. No invented results, clients, prices or deadlines.

export const site = {
  name: "13:33",
  descriptor: "Digital Studio",
  /** Public contact e-mail. Not decided yet (see master pack: domain/e-mail).
      Set VITE_CONTACT_EMAIL once the business address exists. */
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || undefined,
};

export const nav = [
  { label: "Проекти", href: "#proekti" },
  { label: "Услуги", href: "#uslugi" },
  { label: "Процес", href: "#proces" },
  { label: "Контакт", href: "#kontakt" },
] as const;

/** The first screen. The sentence is the founder's reference, in Bulgarian;
    `lilac` and `peach` are the words that carry the gradients. */
export const hero = {
  pill: "Добре дошъл в 13:33",
  title: { before: "Превръщаме идеите ти в", lilac: "красиви дигитални", peach: "изживявания" },
  description: "Сайтове, онлайн магазини, брандове и платформи. От първата идея до работещия продукт.",
  primary: { label: "Започни проект", href: "/zapochni" },
  secondary: { label: "Виж проектите", href: "#proekti" },
};

export const works = {
  heading: "Нашата работа",
  subheading: "Различни бизнеси. Решения с характер.",
  label: "ПРОЕКТИ",
  action: "Отвори сайта",
};

/** Three statements instead of paragraphs. Lit word by word by the scroll. */
export const manifest = [
  "Без шаблони. Всеки проект започва от бял лист.",
  "Работи на телефон, преди да работи на десктоп.",
  "Виждаш работеща версия, не презентация.",
];

export interface Service {
  id: string;
  name: string;
  /** What we actually build, in one sentence. */
  body: string;
  includes: string[];
}

export const services: Service[] = [
  {
    id: "sites",
    name: "Сайтове",
    body: "Представя ясно какво предлагаш и води посетителя към запитване.",
    includes: ["структура и текстове", "индивидуален дизайн", "SEO основа", "форми за запитване"],
  },
  {
    id: "stores",
    name: "Онлайн магазини",
    body: "Подреден каталог, силни продуктови страници и кратък път до плащане.",
    includes: ["каталог и колекции", "плащания и доставки", "продуктови страници", "администрация"],
  },
  {
    id: "funnels",
    name: "Фунии и запитвания",
    body: "Лендинги, въпросници и записвания, които превръщат интереса в разговор.",
    includes: ["лендинг страници", "въпросници", "записване на час", "проследяване"],
  },
  {
    id: "portals",
    name: "Клиентски портали",
    body: "Защитено място, в което клиентът вижда програмата, документите или поръчките си.",
    includes: ["вход и роли", "табла", "документи и съобщения", "абонаменти"],
  },
  {
    id: "apps",
    name: "Уеб приложения",
    body: "MVP или вътрешен инструмент, изграден около реалния процес.",
    includes: ["прототип", "MVP", "интеграции", "бази данни"],
  },
  {
    id: "automation",
    name: "Автоматизации",
    body: "Формите, таблиците и имейлите ти, свързани така, че информацията да тече сама.",
    includes: ["обработка на заявки", "известия", "синхронизация", "отчети"],
  },
  {
    id: "ai",
    name: "AI интерфейси",
    body: "Асистенти, свързани с твоята информация, с ясни граници и човешки контрол.",
    includes: ["асистенти за запитвания", "структуриране на заявки", "вътрешни инструменти"],
  },
];

/** A real sequence: four words, one line. */
export const process = [
  { name: "Разбиране", body: "Целите, клиентите и процесът ти." },
  { name: "Дизайн", body: "Структура и визия. Одобряваш преди кода." },
  { name: "Разработка", body: "Работеща версия на етапи, не изненада в края." },
  { name: "Пускане", body: "Тест на телефон и компютър, после поддръжка." },
];
