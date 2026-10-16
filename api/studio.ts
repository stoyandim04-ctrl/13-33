// /api/studio - the founder's panel. Every call except login needs the token
// issued for STUDIO_PASSWORD.
//
//   POST {action:"login", password}   -> { token }
//   GET  ?list                        -> all inquiries, newest first
//   GET  ?n=<number>                  -> one inquiry: brief, files, the conversation, the deposit
//   POST {action:"status", n, status} -> move the project along
import { db, HttpError } from "./_lib/env.js";
import { issueToken, requireStudio } from "./_lib/auth.js";
import { withUrls } from "./_lib/files.js";
import { body, handle, json, str } from "./_lib/http.js";
import type { AiTurn, InquiryStatus } from "../src/lib/inquiry-shared.js";

const STATUSES: InquiryStatus[] = ["new", "deposit_paid", "in_progress", "done", "archived"];

async function byNumber(n: unknown) {
  const number = Number(n);
  if (!Number.isInteger(number)) throw new HttpError(400, "number");
  const { data } = await db().from("inquiries").select("*").eq("number", number).maybeSingle();
  if (!data) throw new HttpError(404, "not-found");
  return data as Record<string, unknown> & { id: string; number: number; name: string; status: InquiryStatus; token: string };
}

export function GET(request: Request) {
  return handle(async () => {
    requireStudio(request);
    const q = new URL(request.url).searchParams;

    if (q.has("list")) {
      const { data } = await db()
        .from("inquiries")
        .select("number, name, email, project_type, status, created_at, studio_seen_at, deposit, deposit_paid_at, brief")
        .order("created_at", { ascending: false })
        .limit(200);
      return json(
        (data ?? []).map((r) => ({
          number: r.number,
          name: r.name,
          email: r.email,
          projectType: r.project_type,
          status: r.status,
          createdAt: r.created_at,
          deposit: r.deposit,
          paidAt: r.deposit_paid_at,
          summary: (r.brief as { summary?: string })?.summary ?? "",
          unread: !r.studio_seen_at,
        })),
      );
    }

    const row = await byNumber(q.get("n"));
    await db().from("inquiries").update({ studio_seen_at: new Date().toISOString() }).eq("id", row.id);
    const transcript = (row.transcript as AiTurn[]) ?? [];
    const files = await withUrls([...((row.files as string[]) ?? []), ...transcript.flatMap((t) => t.files ?? [])]);
    const { token, ...rest } = row;
    return json({ ...rest, roomPath: `/zapitvane/${token}`, files });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const input = await body<Record<string, unknown>>(request);
    if (input.action === "login") return json({ token: issueToken(str(input.password, 200)) });
    requireStudio(request);

    if (input.action === "status") {
      const row = await byNumber(input.n);
      const status = str(input.status, 20) as InquiryStatus;
      if (!STATUSES.includes(status)) throw new HttpError(400, "status");
      await db().from("inquiries").update({ status }).eq("id", row.id);
      return json({ ok: true });
    }
    throw new HttpError(400, "action");
  });
}
