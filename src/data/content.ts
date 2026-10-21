// Site copy, Bulgarian and English. No invented results, clients or prices;
// the one promise is the studio's own: the first version within 4 working days. Components read it through useContent() (src/lib/i18n.tsx).
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
  /** The first screen: the name as large as the page (`title.before`), one
      line (`title.accent`), the place (`eyebrow`), two actions. */
  hero: {
    eyebrow: string;
    title: { before: string; accent: string };
    description: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
  works: { heading: string; subheading: string; label: string; action: string };
  /** The 3D gallery on the home page (components/gallery). */
  gallery: {
    /** The two big lines of the first screen. */
    title: [string, string];
    small: string;
    scroll: string;
    wallHint: string;
    open: string;
    aboutLabel: string;
    /** The first words of the about text, in the colours of the logo. */
    aboutLead: string;
    aboutBody: string;
    aboutNote: string;
    ctaTitle: string;
    ctaLead: string;
    cta: string;
  };
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
  footer: { tagline: string };
}

const bg: Content = {
  nav: [
    { label: "Проекти", href: "#proekti" },
    { label: "За нас", href: "#za-nas" },
    { label: "Контакт", href: "#kontakt" },
  ],
  hero: {
    eyebrow: "Digital Studio — България",
    title: { before: "13:33", accent: "Дигитални услуги на следващо ниво." },
    description:
      "Екип от дизайнери и разработчици. Изслушваме те, разбираме бизнеса ти и до 4 работни дни ти показваме първата версия.",
    primary: { label: "Започни проект", href: "/zapochni" },
    secondary: { label: "Виж проектите", href: "#proekti" },
  },
  works: {
    heading: "Избрани проекти",
    subheading: "Концепции на студиото. Истински сайтове, които можеш да отвориш.",
    label: "ПРОЕКТИ",
    action: "Отвори сайта",
  },
  gallery: {
    title: ["Превръщаме идеите", "в дигитални продукти"],
    small: "Уеб приложения, платформи и сайтове — със силен дизайн и функции, съобразени с бизнеса ти.",
    scroll: "Скролни",
    wallHint: "Посочи прозорец. Натисни, за да отвориш сайта.",
    open: "Виж",
    aboutLabel: "За нас · Нашият подход",
    aboutLead: "Идеята е твоя.",
    aboutBody:
      "Ние я превръщаме в продукт: уеб приложения, платформи и сайтове. Ясен обхват, преглед преди публикуване и първа версия до 4 работни дни след капарото.",
    aboutNote: "Всеки прозорец е истински сайт, който можеш да отвориш. Концепциите са означени.",
    ctaTitle: "Обсъди идеята си",
    ctaLead: "Разкажи на консултанта. Цената виждаш веднага.",
    cta: "Обсъди идеята си",
  },
  manifest: [
    "Слушаме повече, отколкото говорим.",
    "Първата версия е при теб до 4 работни дни.",
    "После изглаждаме всеки детайл, докато стане твой.",
  ],
  services: {
    label: "Услуги",
    title: "Какво правим.",
    lead: "Всеки проект се прави на ръка, от нулата.",
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
    title: "От идея до пускане.",
    steps: [
      { name: "Разговор", body: "Разказваш ни идеята. Разбираме бизнеса, клиентите и целта ти." },
      { name: "Първа версия", body: "До 4 работни дни: истински сайт на имейла ти, не скица." },
      { name: "Изглаждане", body: "Променяме всеки детайл по твой вкус, докато стане твой." },
      { name: "Пускане", body: "Домейн, плащания и форми. Тест на телефон и компютър, после поддръжка." },
    ],
  },
  contact: {
    label: "Започни проект",
    title: "Да започнем.",
    lead: "Разкажи го на консултанта. Цената виждаш веднага, първата версия идва до 4 работни дни.",
    cta: "Започни проект",
    myChat: "Моят проект",
    steps: [
      { title: "Разказваш", body: "Със свои думи, на консултанта. Снимки, лого и примери са добре дошли." },
      { title: "Цена и капаро", body: "Веднага виждаш цената на проекта на лична страница. Капарото плащаш онлайн и то се приспада от цената." },
      { title: "Първа версия", body: "До 4 работни дни я получаваш на имейла си. После я изглаждаме заедно и пускаме." },
    ],
  },
  footer: {
    tagline: "Digital Studio · България",
  },
};

const en: Content = {
  nav: [
    { label: "Work", href: "#proekti" },
    { label: "About", href: "#za-nas" },
    { label: "Contact", href: "#kontakt" },
  ],
  hero: {
    eyebrow: "Digital Studio — Bulgaria",
    title: { before: "13:33", accent: "Digital services at the next level." },
    description:
      "A team of designers and developers. We listen, get to know your business and show you the first version within 4 working days.",
    primary: { label: "Start a project", href: "/zapochni" },
    secondary: { label: "See the work", href: "#proekti" },
  },
  works: {
    heading: "Selected work",
    subheading: "The studio's concepts. Real sites you can open.",
    label: "WORK",
    action: "Open the site",
  },
  gallery: {
    title: ["We turn ideas", "into digital products"],
    small: "Web apps, platforms and websites — strong design, and features shaped around your business.",
    scroll: "Scroll",
    wallHint: "Point at a window. Click to open the site.",
    open: "See",
    aboutLabel: "About · Our approach",
    aboutLead: "The idea is yours.",
    aboutBody:
      "We turn it into a product: web apps, platforms and websites. A clear scope, a review before launch, and the first version within 4 working days of the deposit.",
    aboutNote: "Every window is a real site you can open. Concepts are labelled.",
    ctaTitle: "Talk through your idea",
    ctaLead: "Tell the consultant. You see the price right away.",
    cta: "Talk through your idea",
  },
  manifest: [
    "We listen more than we talk.",
    "The first version is with you within 4 working days.",
    "Then we refine every detail until it is yours.",
  ],
  services: {
    label: "Services",
    title: "What we do.",
    lead: "Every project is made by hand, from scratch.",
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
      { name: "Conversation", body: "You tell us the idea. We learn your business, clients and goal." },
      { name: "First version", body: "Within 4 working days: a real site in your inbox, not a sketch." },
      { name: "Refining", body: "We adjust every detail to your taste until it is yours." },
      { name: "Launch", body: "Domain, payments and forms. Tested on phone and desktop, then support." },
    ],
  },
  contact: {
    label: "Start a project",
    title: "Let's begin.",
    lead: "Tell the consultant. You see the price right away; the first version arrives within 4 working days.",
    cta: "Start a project",
    myChat: "My project",
    steps: [
      { title: "You tell us", body: "In your own words, to the consultant. Pictures, logo and examples are welcome." },
      { title: "Price and deposit", body: "You see the project's price right away on a private page. Pay the deposit online; it is deducted from the price." },
      { title: "First version", body: "It reaches your inbox within 4 working days. Then we refine it together and launch." },
    ],
  },
  footer: {
    tagline: "Digital Studio · Bulgaria",
  },
};

export const content = { bg, en };

export const useContent = () => useCopy(content);
