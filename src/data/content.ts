// Site copy, Bulgarian and English. No invented results, clients, prices or
// deadlines. Components read it through useContent() (src/lib/i18n.tsx).
import { useCopy } from "@/lib/i18n";

export const site = {
  name: "13:33",
  descriptor: "Digital Studio",
  /** Public contact e-mail. Not decided yet (see master pack: domain/e-mail).
      Set VITE_CONTACT_EMAIL once the business address exists. */
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || undefined,
};

export interface Service {
  id: string;
  name: string;
  /** What we actually build, in one sentence. */
  body: string;
  includes: string[];
}

export interface Content {
  nav: { label: string; href: string }[];
  /** The first screen. The sentence is the founder's reference; `lilac` and
      `peach` are the words that carry the gradients. */
  hero: {
    pill: string;
    title: { before: string; lilac: string; peach: string };
    description: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
  works: { heading: string; subheading: string; label: string; action: string };
  /** Three statements instead of paragraphs. Lit word by word by the scroll. */
  manifest: string[];
  services: { label: string; title: string; lead: string; items: Service[] };
  process: { label: string; title: string; steps: { name: string; body: string }[] };
  contact: {
    label: string;
    title: string;
    lead: string;
    cta: string;
    myChat: string;
    steps: { title: string; body: string }[];
  };
  footer: { tagline: string; note: string };
}

const bg: Content = {
  nav: [
    { label: "Проекти", href: "#proekti" },
    { label: "Услуги", href: "#uslugi" },
    { label: "Процес", href: "#proces" },
    { label: "Контакт", href: "#kontakt" },
  ],
  hero: {
    pill: "Добре дошъл в 13:33",
    title: { before: "Превръщаме идеите ти в", lilac: "красиви дигитални", peach: "изживявания" },
    description: "Сайтове, онлайн магазини, брандове и платформи. От първата идея до работещия продукт.",
    primary: { label: "Започни проект", href: "/zapochni" },
    secondary: { label: "Виж проектите", href: "#proekti" },
  },
  works: {
    heading: "Нашата работа",
    subheading: "Различни бизнеси. Решения с характер.",
    label: "ПРОЕКТИ",
    action: "Отвори сайта",
  },
  manifest: [
    "Без шаблони. Всеки проект започва от бял лист.",
    "Работи на телефон, преди да работи на десктоп.",
    "Виждаш работеща версия, не презентация.",
  ],
  services: {
    label: "Услуги",
    title: "Какво създаваме.",
    lead: "Сайтове, магазини, брандове, платформи. Според нуждата на бизнеса ти.",
    items: [
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
    ],
  },
  process: {
    label: "Процес",
    title: "От идея до реализация.",
    steps: [
      { name: "Разбиране", body: "Целите, клиентите и процесът ти." },
      { name: "Дизайн", body: "Структура и визия. Одобряваш преди кода." },
      { name: "Разработка", body: "Работеща версия на етапи, не изненада в края." },
      { name: "Пускане", body: "Тест на телефон и компютър, после поддръжка." },
    ],
  },
  contact: {
    label: "Започни проект",
    title: "Какво искаш да създадем?",
    lead: "Разкажи го в чата. Без регистрация и без ангажимент.",
    cta: "Започни проект",
    myChat: "Към моя чат",
    steps: [
      { title: "Разказваш", body: "Кратък въпросник или чат с консултанта, със свои думи. Снимки, лого и примери са добре дошли." },
      { title: "Получаваш оферта", body: "Основателят ти пише лично в същия чат: крайна цена, срок и капаро. Можеш да запазиш и онлайн среща." },
      { title: "Започваме", body: "Приемаш офертата, плащаш капарото ({deposit}) и започваме." },
    ],
  },
  footer: {
    tagline: "Digital Studio · България",
    note: "Проектите в портфолиото са означени според статуса си.",
  },
};

const en: Content = {
  nav: [
    { label: "Work", href: "#proekti" },
    { label: "Services", href: "#uslugi" },
    { label: "Process", href: "#proces" },
    { label: "Contact", href: "#kontakt" },
  ],
  hero: {
    pill: "Welcome to 13:33",
    title: { before: "We turn your ideas into", lilac: "beautiful digital", peach: "experiences" },
    description: "Websites, online stores, brands and platforms. From the first idea to the working product.",
    primary: { label: "Start a project", href: "/zapochni" },
    secondary: { label: "See the work", href: "#proekti" },
  },
  works: {
    heading: "Our work",
    subheading: "Different businesses. Solutions with character.",
    label: "WORK",
    action: "Open the site",
  },
  manifest: [
    "No templates. Every project starts from a blank page.",
    "It works on a phone before it works on a desktop.",
    "You see a working version, not a presentation.",
  ],
  services: {
    label: "Services",
    title: "What we make.",
    lead: "Sites, stores, brands, platforms. Whatever your business needs.",
    items: [
      {
        id: "sites",
        name: "Websites",
        body: "Shows clearly what you offer and leads the visitor to an inquiry.",
        includes: ["structure and copy", "custom design", "SEO foundation", "inquiry forms"],
      },
      {
        id: "stores",
        name: "Online stores",
        body: "A tidy catalogue, strong product pages and a short path to checkout.",
        includes: ["catalogue and collections", "payments and shipping", "product pages", "admin"],
      },
      {
        id: "funnels",
        name: "Funnels and inquiries",
        body: "Landing pages, questionnaires and bookings that turn interest into a conversation.",
        includes: ["landing pages", "questionnaires", "booking", "tracking"],
      },
      {
        id: "portals",
        name: "Client portals",
        body: "A protected place where the client sees their programme, documents or orders.",
        includes: ["login and roles", "dashboards", "documents and messages", "subscriptions"],
      },
      {
        id: "apps",
        name: "Web apps",
        body: "An MVP or an internal tool, built around the real process.",
        includes: ["prototype", "MVP", "integrations", "databases"],
      },
      {
        id: "automation",
        name: "Automations",
        body: "Your forms, sheets and e-mails connected so the information flows by itself.",
        includes: ["request handling", "notifications", "sync", "reports"],
      },
      {
        id: "ai",
        name: "AI interfaces",
        body: "Assistants connected to your own information, with clear limits and human control.",
        includes: ["inquiry assistants", "structuring requests", "internal tools"],
      },
    ],
  },
  process: {
    label: "Process",
    title: "From idea to launch.",
    steps: [
      { name: "Understanding", body: "Your goals, clients and process." },
      { name: "Design", body: "Structure and look. You approve before the code." },
      { name: "Build", body: "A working version in stages, not a surprise at the end." },
      { name: "Launch", body: "Tested on phone and desktop, then support." },
    ],
  },
  contact: {
    label: "Start a project",
    title: "What shall we create?",
    lead: "Tell us in the chat. No sign-up, no commitment.",
    cta: "Start a project",
    myChat: "To my chat",
    steps: [
      { title: "You tell us", body: "A short questionnaire or a chat with the consultant, in your own words. Pictures, logo and examples are welcome." },
      { title: "You get an offer", body: "The founder writes you personally in the same chat: final price, timeline and deposit. You can book an online meeting too." },
      { title: "We begin", body: "You accept the offer, pay the deposit ({deposit}) and we begin." },
    ],
  },
  footer: {
    tagline: "Digital Studio · Bulgaria",
    note: "Every project in the portfolio is labelled by its status.",
  },
};

export const content = { bg, en };

export const useContent = () => useCopy(content);
