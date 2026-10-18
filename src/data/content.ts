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
    { label: "Услуги", href: "#uslugi" },
    { label: "Процес", href: "#proces" },
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
    { label: "Services", href: "#uslugi" },
    { label: "Process", href: "#proces" },
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
