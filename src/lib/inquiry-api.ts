// Browser side of /api/inquiry, /api/ai, /api/pay and /api/studio. Same origin, no keys.
import type { AiTurn, Answers, Brief, Room } from "@/lib/inquiry-shared";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function call<T>(url: string, init?: RequestInit & { json?: unknown }, auth?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init?.json !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${auth}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new ApiError(0, "offline");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error");
  return data as T;
}

/** Human message for an ApiError. */
export function errorText(error: unknown): string {
  const code = error instanceof ApiError ? error.code : "";
  const status = error instanceof ApiError ? error.status : 0;
  if (code === "offline") return "Няма връзка. Провери интернета и опитай пак.";
  if (code === "not-configured" || code === "ai-not-configured" || status === 404 && code === "error")
    return "Тази част още не е включена. Опитай по-късно.";
  if (code === "pay-not-configured") return "Плащането онлайн още не е включено. Ще ти пишем на имейл.";
  if (code === "already-paid") return "Капарото вече е платено.";
  if (code === "busy" || status === 429) return "Твърде много заявки наведнъж. Изчакай малко и опитай пак.";
  if (code === "file-type") return "Този файл не се поддържа. Пробвай снимка (JPG, PNG) или PDF.";
  if (code === "email") return "Провери имейла.";
  if (code === "wrong-password") return "Грешна парола.";
  return "Нещо се обърка. Опитай пак.";
}

// ---- client ----

export interface Ready {
  ready: boolean;
  ai: boolean;
  pay: boolean;
}

export const getReady = () => call<Ready>("/api/inquiry?ready");

/** The server ends the stream with this line once the consultant has sent the inquiry. */
const SENT = /\n\[\[inquiry:([a-f0-9]{48})\]\]\s*$/;
const SENT_PREFIX = "\n[[inquiry:";

/**
 * The consultant's reply, streamed as plain text. `onText` gets the whole
 * visible reply so far. Resolves with the final text and, when the consultant
 * sent the inquiry itself, the token of the client's page.
 */
export async function streamAi(
  draftId: string,
  answers: Answers,
  conversation: AiTurn[],
  lang: "bg" | "en",
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; token?: string }> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      body: JSON.stringify({ draftId, lang, answers, conversation }),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "offline");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, data.error ?? "error");
  }
  if (!res.body) throw new ApiError(502, "ai-error");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(visible(full));
  }
  if (full.endsWith("[грешка]")) throw new ApiError(502, "ai-error");
  const sent = SENT.exec(full);
  const text = full.replace(SENT, "").trim();
  onText(text);
  return sent ? { text, token: sent[1] } : { text };
}

/** The reply without the (possibly half-arrived) sent line at its end. */
function visible(full: string) {
  const at = full.lastIndexOf("\n[[");
  if (at >= 0 && SENT_PREFIX.startsWith(full.slice(at, at + SENT_PREFIX.length))) return full.slice(0, at);
  return full.replace(SENT, "");
}

export const createInquiry = (payload: {
  draftId: string;
  answers: Answers;
  brief: Brief;
  transcript: AiTurn[];
  files: string[];
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}) => call<{ token: string; number: number }>("/api/inquiry", { method: "POST", json: { action: "create", ...payload } });

export const getRoom = (token: string, paid = false) =>
  call<Room>(`/api/inquiry?token=${encodeURIComponent(token)}${paid ? "&paid" : ""}`);

/** Stripe Checkout for the deposit; the page goes to the returned address. */
export const startPayment = (token: string) => call<{ url: string }>("/api/pay", { method: "POST", json: { token } });

// ---- files ----

export const MAX_FILE = 10 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf";

/** Uploads one file straight to storage through a signed URL; returns its path. */
export async function uploadFile(file: File, target: { draftId: string }) {
  if (file.size > MAX_FILE) throw new ApiError(413, "too-large");
  const signed = await call<{ path: string; url: string }>("/api/inquiry", {
    method: "POST",
    json: { action: "upload", draftId: target.draftId, name: file.name, type: file.type },
  });
  const res = await fetch(signed.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } }).catch(() => null);
  if (!res?.ok) throw new ApiError(res?.status ?? 0, "upload");
  return signed.path;
}

// ---- studio ----

export const studioLogin = (password: string) =>
  call<{ token: string }>("/api/studio", { method: "POST", json: { action: "login", password } });

export const studioGet = <T,>(auth: string, query: string) => call<T>(`/api/studio?${query}`, undefined, auth);

export const studioPost = <T = { ok: true },>(auth: string, action: string, extra: Record<string, unknown> = {}) =>
  call<T>("/api/studio", { method: "POST", json: { action, ...extra } }, auth);

// ---- small helpers ----

export const newDraftId = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export function store<T>(key: string, value?: T): T | null {
  try {
    if (value === undefined) {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the flow still works, it just won't resume.
  }
  return value ?? null;
}

export const fmtDateTime = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat("bg-BG", { timeZone: "Europe/Sofia", ...opts }).format(new Date(iso));
