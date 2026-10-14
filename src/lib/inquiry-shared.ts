// Shapes shared by the site and the server routes in /api. No DOM, no path
// aliases - the server imports this file directly.

export const PROJECT_TYPES = [
  { id: "site", label: "Сайт за бизнеса", hint: "Представяне, услуги, контакт" },
  { id: "shop", label: "Онлайн магазин", hint: "Продукти, количка, плащане" },
  { id: "landing", label: "Страница за реклама", hint: "Една страница, една цел" },
  { id: "brand", label: "Бранд и лого", hint: "Име, лого, цветове" },
  { id: "system", label: "Система или портал", hint: "Вход, табла, автоматизации" },
  { id: "unsure", label: "Още не знам", hint: "Ще го измислим заедно" },
] as const;
export type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];

/** The concrete kinds a deposit is set for (the consultant picks one of these). */
export const CONCRETE_TYPES = ["site", "shop", "landing", "brand", "system"] as const satisfies readonly ProjectTypeId[];
export type ConcreteTypeId = (typeof CONCRETE_TYPES)[number];

/**
 * The deposit, in euro, by kind of project, for an inquiry without a computed
 * price (the questionnaire). 0 means "not set" - the client then sees the
 * brief without a payment step. Deducted from the final price.
 */
export const DEPOSITS: Record<ConcreteTypeId, number> = {
  landing: 60,
  site: 100,
  brand: 100,
  shop: 180,
  system: 180,
};

export const depositFor = (type: string): number => DEPOSITS[type as ConcreteTypeId] ?? 0;

/**
 * The consultant's price guide: the whole project, in euro, by kind. Kept low
 * on purpose. The consultant prices the project item by item inside this
 * range; the server keeps the total inside [from, 2 × to].
 */
export const PRICE_GUIDE: Record<ConcreteTypeId, { from: number; to: number }> = {
  landing: { from: 150, to: 400 },
  site: { from: 300, to: 900 },
  brand: { from: 150, to: 500 },
  shop: { from: 600, to: 1800 },
  system: { from: 900, to: 3500 },
};

/** The deposit is this share of the price, rounded to 10 € (at least 30 €). */
export const DEPOSIT_SHARE = 0.3;
export const depositFromPrice = (price: number): number => Math.max(30, Math.round((price * DEPOSIT_SHARE) / 10) * 10);

/** What the project costs, as the consultant computed it. */
export interface Estimate {
  price: number;
  items: { name: string; price: number }[];
  /** One or two sentences: what the price includes. */
  note: string;
}

/** Working days from the deposit to the first version in the client's inbox. */
export const FIRST_VERSION_DAYS = 4;

export const HAS_SITE = ["Нямам", "Имам, искам нов", "Имам, искам промени"] as const;
export const WHEN = ["Няма бързане", "До месец", "Възможно най-скоро"] as const;
export const BUDGET = ["Не знам още", "До 500 €", "500 – 1 500 €", "1 500 – 5 000 €", "Над 5 000 €"] as const;

export interface Answers {
  projectType: ProjectTypeId | "";
  hasSite: string;
  siteUrl: string;
  when: string;
  budget: string;
}

/** What the AI (or the questionnaire) understood. Unknown stays empty. */
export interface Brief {
  business: string;
  goal: string;
  audience: string;
  pages: string;
  features: string;
  style: string;
  materials: string;
  extra: string;
  summary: string;
}

export const emptyBrief = (): Brief => ({
  business: "",
  goal: "",
  audience: "",
  pages: "",
  features: "",
  style: "",
  materials: "",
  extra: "",
  summary: "",
});

export const BRIEF_LABELS: [keyof Brief, string][] = [
  ["business", "Бизнесът"],
  ["goal", "Целта"],
  ["audience", "За кого е"],
  ["pages", "Страници / части"],
  ["features", "Функции"],
  ["style", "Стил и усещане"],
  ["materials", "Налични материали"],
  ["extra", "Друго"],
];

/** One turn of the AI conversation. `files` are storage paths. */
export interface AiTurn {
  role: "client" | "ai";
  text: string;
  files?: string[];
}

export type InquiryStatus = "new" | "deposit_paid" | "in_progress" | "done" | "archived";

export const STATUS_STEPS: { status: InquiryStatus[]; label: string }[] = [
  { status: ["new"], label: "Получено" },
  { status: ["deposit_paid"], label: "Капаро" },
  { status: ["in_progress"], label: "В работа" },
  { status: ["done"], label: "Готово" },
];

export interface ChatFile {
  path: string;
  name: string;
  url?: string;
}

/** The client's page, as the server returns it. */
export interface Room {
  number: number;
  name: string;
  email: string;
  projectType: string;
  status: InquiryStatus;
  brief: Brief;
  answers: Answers;
  files: ChatFile[];
  /** Euro; 0 when no deposit is set for this kind of project. */
  deposit: number;
  /** The computed price; null when the inquiry came without one. */
  estimate: Estimate | null;
  paidAt: string | null;
  /** Online payment is configured on the server. */
  canPay: boolean;
  studioName: string;
}

export const projectTypeLabel = (id: string) =>
  PROJECT_TYPES.find((p) => p.id === id)?.label ?? id;
