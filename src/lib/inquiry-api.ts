// Browser side of /api/inquiry, /api/ai and /api/studio. Same origin, no keys.
import type { AiReply, AiTurn, Answers, Brief, Room } from "@/lib/inquiry-shared";

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
  if (code === "busy" || status === 429) return "Твърде много заявки наведнъж. Изчакай малко и опитай пак.";
  if (code === "slot-taken") return "Този час току-що беше зает. Избери друг.";
  if (code === "file-type") return "Този файл не се поддържа. Пробвай снимка (JPG, PNG) или PDF.";
  if (code === "email") return "Провери имейла.";
  if (code === "wrong-password") return "Грешна парола.";
  return "Нещо се обърка. Опитай пак.";
}

// ---- client ----

export const getReady = () => call<{ ready: boolean; ai: boolean }>("/api/inquiry?ready");

export const askAi = (draftId: string, answers: Answers, conversation: AiTurn[]) =>
  call<AiReply>("/api/ai", { method: "POST", json: { draftId, answers, conversation } });

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

export const getRoom = (token: string) => call<Room>(`/api/inquiry?token=${encodeURIComponent(token)}`);

export const getSlots = (token: string) =>
  call<{ timeZone: string; minutes: number; slots: string[] }>(`/api/inquiry?token=${encodeURIComponent(token)}&slots`);

export const roomAction = (token: string, action: string, extra: Record<string, unknown> = {}) =>
  call<{ ok: true }>("/api/inquiry", { method: "POST", json: { action, token, ...extra } });

// ---- files ----

export const MAX_FILE = 10 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf";

/** Uploads one file straight to storage through a signed URL; returns its path. */
export async function uploadFile(file: File, target: { draftId?: string; token?: string; studio?: { n: number; auth: string } }) {
  if (file.size > MAX_FILE) throw new ApiError(413, "too-large");
  const signed = target.studio
    ? await call<{ path: string; url: string }>(
        "/api/studio",
        { method: "POST", json: { action: "upload", n: target.studio.n, name: file.name, type: file.type } },
        target.studio.auth,
      )
    : await call<{ path: string; url: string }>("/api/inquiry", {
        method: "POST",
        json: { action: "upload", draftId: target.draftId, token: target.token, name: file.name, type: file.type },
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
