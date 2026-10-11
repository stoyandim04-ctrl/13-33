// Shapes shared by the site and the server routes in /api. No DOM, no path
// aliases - the server imports this file directly.

/** Rule the AI states and the studio's offer follows. The studio confirms the
    exact amount in the offer. */
export const DEPOSIT = {
  standard: 50,
  large: 100,
  text: "Капарото е 50 € (при по-голям проект — 100 €) и се приспада от крайната цена. Точната сума потвърждава основателят в офертата.",
} as const;

export const PROJECT_TYPES = [
  { id: "site", label: "Сайт за бизнеса", hint: "Представяне, услуги, контакт" },
  { id: "shop", label: "Онлайн магазин", hint: "Продукти, количка, плащане" },
  { id: "landing", label: "Страница за реклама", hint: "Една страница, една цел" },
  { id: "brand", label: "Бранд и лого", hint: "Име, лого, цветове" },
  { id: "system", label: "Система или портал", hint: "Вход, табла, автоматизации" },
  { id: "unsure", label: "Още не знам", hint: "Ще го измислим заедно" },
] as const;
export type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];

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

export interface AiReply {
  reply: string;
  /** Two to four short answers the client can tap. */
  quickReplies: string[];
  /** The question is best answered with pictures (logo, examples, screenshots). */
  askFiles: boolean;
  /** Enough is known - show the summary and move on to contact. */
  done: boolean;
  brief: Brief;
}

export type InquiryStatus =
  | "new"
  | "offer"
  | "accepted"
  | "deposit_paid"
  | "in_progress"
  | "done"
  | "archived";

export const STATUS_STEPS: { status: InquiryStatus[]; label: string }[] = [
  { status: ["new"], label: "Получено" },
  { status: ["offer"], label: "Оферта" },
  { status: ["accepted"], label: "Капаро" },
  { status: ["deposit_paid", "in_progress"], label: "В работа" },
  { status: ["done"], label: "Готово" },
];

export interface Offer {
  /** Final price in euro. */
  price: number;
  /** Deposit in euro - 50 or 100 by the rule, the studio decides. */
  deposit: number;
  /** Delivery, as the studio writes it ("3 седмици", "до 15 ноември"). */
  deadline: string;
  /** What is included. */
  note: string;
  /** How to pay the deposit (bank details or a payment link). */
  payment: string;
}

export interface ChatFile {
  path: string;
  name: string;
  url?: string;
}

export interface ChatMessage {
  id: number;
  sender: "client" | "studio" | "system";
  body: string;
  files: ChatFile[];
  created_at: string;
}

export interface Booking {
  id: number;
  starts_at: string;
  minutes: number;
  status: "booked" | "cancelled";
  meet_url: string | null;
}

/** The client's room, as the server returns it. */
export interface Room {
  number: number;
  name: string;
  projectType: string;
  status: InquiryStatus;
  offer: Offer | null;
  brief: Brief;
  answers: Answers;
  messages: ChatMessage[];
  bookings: Booking[];
  studioName: string;
}

export interface Availability {
  timeZone: string;
  weekdays: number[];
  start: string;
  end: string;
  minutes: number;
  daysAhead: number;
  noticeHours: number;
}

export const projectTypeLabel = (id: string) =>
  PROJECT_TYPES.find((p) => p.id === id)?.label ?? id;
