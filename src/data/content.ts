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
  /** The first screen: the promise in two lines (the second carries the
      lilac gradient), one paragraph, and the running line of what we make. */
  hero: {
    eyebrow: string;
    title: { before: string; accent: string };
    description: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    ticker: string[];
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
    eyebrow: "Приемаме нови проекти",
    title: { before: "Твоята идея.", accent: "Сайт до 4 работни дни." },
    description:
      "Разказваш ни я, ние разбираме бизнеса ти и ти пращаме първата версия на имейл. После я изглаждаме заедно, докато стане точно твоя.",
    primary: { label: "Започни проект", href: "/zapochni" },
    secondary: { label: "Виж проектите", href: "#proekti" },
    ticker: ["Сайтове", "Онлайн магазини", "Брандове", "Клиентски портали", "Уеб приложения", "Автоматизации", "AI асистенти"],
  },
  works: {
    heading: "Нашата работа",
    subheading: "Различни бизнеси. Решения с характер.",
    label: "ПРОЕКТИ",
    action: "Отвори сайта",
  },
  manifest: [
    "Един разговор и вече знаем какво ти трябва.",
    "Първата версия идва на имейла ти до 4 работни дни.",
    "После я изглаждаме, докато стане точно твоя.",
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
    title: "Какво искаш да създадем?",
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
    eyebrow: "Taking new projects",
    title: { before: "Your idea.", accent: "A site in 4 working days." },
    description:
      "Tell us about it: we get to know your business and send the first version to your inbox. Then we refine it together until it is exactly yours.",
    primary: { label: "Start a project", href: "/zapochni" },
    secondary: { label: "See the work", href: "#proekti" },
    ticker: ["Websites", "Online stores", "Brands", "Client portals", "Web apps", "Automations", "AI assistants"],
  },
  works: {
    heading: "Our work",
    subheading: "Different businesses. Solutions with character.",
    label: "WORK",
    action: "Open the site",
  },
  manifest: [
    "One conversation and we know what you need.",
    "The first version reaches your inbox within 4 working days.",
    "Then we refine it until it is exactly yours.",
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
      { name: "Conversation", body: "You tell us the idea. We learn your business, clients and goal." },
      { name: "First version", body: "Within 4 working days: a real site in your inbox, not a sketch." },
      { name: "Refining", body: "We adjust every detail to your taste until it is yours." },
      { name: "Launch", body: "Domain, payments and forms. Tested on phone and desktop, then support." },
    ],
  },
  contact: {
    label: "Start a project",
    title: "What shall we create?",
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
