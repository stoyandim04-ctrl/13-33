// Project inquiry + Project Brief.
//
// The master pack calls for an "AI Project Brief" that turns a free description
// into a structured brief. That needs a backend and an AI provider, neither of
// which exists yet, so:
//
// 1. `ProjectBrief` is the structured shape the master pack lists. The
//    questionnaire fills it directly - no AI, nothing pre-written pretending to
//    be one.
// 2. `submitInquiry` sends the inquiry to VITE_INQUIRY_ENDPOINT (your own
//    backend / form service). Without it, NOTHING is sent and the UI says so.
// 3. `AiBriefClient` is the contract for the future assistant. It is enabled
//    only when VITE_AI_BRIEF_ENDPOINT points at a server route that holds the
//    provider key. Keys never go in this client bundle.

export interface Inquiry {
  name: string;
  contact: string;
  business: string;
  solution: string[];
  description: string;
  budget?: string;
  timeline?: string;
  consent: boolean;
  /** Optional - filled when the visitor used the detailed brief. */
  brief?: ProjectBrief;
}

/** Structured output, as defined in the master pack. Fields the visitor did not
    give stay empty - never guessed. Lead quality and next step are internal and
    left for the team (or the future assistant) to fill. */
export interface ProjectBrief {
  name: string;
  business: string;
  industry: string;
  currentWebsite: string;
  currentProblem: string;
  desiredOutcome: string;
  requestedSolution: string[];
  requiredFeatures: string[];
  existingAssets: string[];
  timeline: string;
  budgetSignal: string;
  urgency: string;
  summary: string;
  leadQuality: null;
  recommendedNextStep: null;
  source: "questionnaire" | "ai-assistant";
}

export const emptyBrief = (): ProjectBrief => ({
  name: "",
  business: "",
  industry: "",
  currentWebsite: "",
  currentProblem: "",
  desiredOutcome: "",
  requestedSolution: [],
  requiredFeatures: [],
  existingAssets: [],
  timeline: "",
  budgetSignal: "",
  urgency: "",
  summary: "",
  leadQuality: null,
  recommendedNextStep: null,
  source: "questionnaire",
});

const FIELD_LABELS: [keyof ProjectBrief, string][] = [
  ["name", "Име"],
  ["business", "Бизнес"],
  ["industry", "Сфера"],
  ["currentWebsite", "Настоящ сайт"],
  ["currentProblem", "Текущ проблем"],
  ["desiredOutcome", "Желан резултат"],
  ["requestedSolution", "Търсено решение"],
  ["requiredFeatures", "Страници / функции"],
  ["existingAssets", "Налични материали"],
  ["timeline", "Срок"],
  ["budgetSignal", "Бюджет"],
  ["urgency", "Спешност"],
  ["summary", "Свободно описание"],
];

/** Plain-text brief for copying or e-mail. Empty fields are marked, not filled. */
export function briefToText(brief: ProjectBrief, contact?: string) {
  const lines = ["ПРОЕКТЕН БРИФ — 13:33", ""];
  for (const [key, label] of FIELD_LABELS) {
    const value = brief[key];
    const text = Array.isArray(value) ? value.join(", ") : (value ?? "");
    lines.push(`${label}: ${text || "—"}`);
  }
  if (contact) lines.push(`Контакт: ${contact}`);
  return lines.join("\n");
}

export function inquiryToText(inquiry: Inquiry) {
  const lines = [
    "ЗАПИТВАНЕ — 13:33",
    "",
    `Име: ${inquiry.name}`,
    `Контакт: ${inquiry.contact}`,
    `Бизнес / сайт: ${inquiry.business}`,
    `Решение: ${inquiry.solution.join(", ") || "—"}`,
    `Бюджет: ${inquiry.budget || "—"}`,
    `Срок: ${inquiry.timeline || "—"}`,
    "",
    inquiry.description,
  ];
  if (inquiry.brief) lines.push("", briefToText(inquiry.brief));
  return lines.join("\n");
}

// ---- sending ------------------------------------------------------------

const INQUIRY_ENDPOINT = import.meta.env.VITE_INQUIRY_ENDPOINT as string | undefined;

export const isInquiryConfigured = () => Boolean(INQUIRY_ENDPOINT);

export type SubmitResult =
  | { status: "sent" }
  | { status: "not-configured" }
  | { status: "error"; message: string };

export async function submitInquiry(inquiry: Inquiry): Promise<SubmitResult> {
  if (!INQUIRY_ENDPOINT) return { status: "not-configured" };
  try {
    const res = await fetch(INQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...inquiry, submittedAt: new Date().toISOString() }),
    });
    if (!res.ok) return { status: "error", message: `Сървърът отговори с ${res.status}.` };
    return { status: "sent" };
  } catch {
    return { status: "error", message: "Няма връзка със сървъра." };
  }
}

// ---- future AI assistant ------------------------------------------------

export interface AiBriefTurn {
  role: "visitor" | "assistant";
  text: string;
}

export interface AiBriefResponse {
  /** Next follow-up question, or null once the brief is complete. */
  reply: string | null;
  /** The brief as understood so far. Missing information stays empty. */
  brief: Partial<ProjectBrief>;
  done: boolean;
}

/** Contract for the server route behind VITE_AI_BRIEF_ENDPOINT. The route keeps
    the provider key, runs the conversation and returns `AiBriefResponse`. */
export interface AiBriefClient {
  next(conversation: AiBriefTurn[]): Promise<AiBriefResponse>;
}

const AI_ENDPOINT = import.meta.env.VITE_AI_BRIEF_ENDPOINT as string | undefined;

export function getAiBriefClient(): AiBriefClient | null {
  if (!AI_ENDPOINT) return null;
  return {
    async next(conversation) {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation }),
      });
      if (!res.ok) throw new Error(`AI brief: ${res.status}`);
      return (await res.json()) as AiBriefResponse;
    },
  };
}
