// /api/studio - the founder's panel. Every call except login needs the token
// issued for STUDIO_PASSWORD.
//
//   POST {action:"login", password}         -> { token }
//   GET  ?list                              -> all inquiries, newest activity first
//   GET  ?n=<number>                        -> one inquiry with chat, files, meetings
//   GET  ?calendar                          -> availability + upcoming meetings
//   POST {action:"message"|"upload"|"offer"|"status"|"meet"|"cancel"|"availability", …}
import { db, HttpError } from "./_lib/env.js";
import { issueToken, requireStudio } from "./_lib/auth.js";
import { uploadUrl, withUrls } from "./_lib/files.js";
import { body, cleanPaths, handle, json, str } from "./_lib/http.js";
import { availability, bookingsOf, messagesOf, postMessage, when } from "./_lib/rooms.js";
import { cleanAvailability } from "./_lib/slots.js";
import type { AiTurn, InquiryStatus, Offer } from "../src/lib/inquiry-shared.js";

const STATUSES: InquiryStatus[] = ["new", "offer", "accepted", "deposit_paid", "in_progress", "done", "archived"];

const STATUS_NOTE: Partial<Record<InquiryStatus, string>> = {
  deposit_paid: "Капарото е получено. Започваме работа по проекта.",
  in_progress: "Проектът е в работа.",
  done: "Проектът е готов. Благодарим ти!",
};

async function byNumber(n: unknown) {
  const number = Number(n);
  if (!Number.isInteger(number)) throw new HttpError(400, "number");
  const { data } = await db().from("inquiries").select("*").eq("number", number).maybeSingle();
  if (!data) throw new HttpError(404, "not-found");
  return data as Record<string, unknown> & { id: string; number: number; name: string; status: InquiryStatus; token: string; offer: Offer | null };
}

export function GET(request: Request) {
  return handle(async () => {
    requireStudio(request);
    const q = new URL(request.url).searchParams;

    if (q.has("list")) {
      const { data } = await db()
        .from("inquiries")
        .select("id, number, name, email, project_type, status, created_at, last_message_at, studio_seen_at, brief")
        .order("last_message_at", { ascending: false })
        .limit(200);
      const rows = data ?? [];
      // Unread: the client wrote after the studio last opened the inquiry.
      const { data: lastClient } = await db()
        .from("inquiry_messages")
        .select("inquiry_id, created_at")
        .eq("sender", "client")
        .order("created_at", { ascending: false })
        .limit(1000);
      const latest = new Map<string, string>();
      for (const m of lastClient ?? []) if (!latest.has(m.inquiry_id as string)) latest.set(m.inquiry_id as string, m.created_at as string);
      return json(
        rows.map((r) => {
          const seen = r.studio_seen_at as string | null;
          const last = latest.get(r.id as string);
          return {
            number: r.number,
            name: r.name,
            email: r.email,
            projectType: r.project_type,
            status: r.status,
            createdAt: r.created_at,
            lastMessageAt: r.last_message_at,
            summary: (r.brief as { summary?: string })?.summary ?? "",
            unread: !seen || Boolean(last && last > seen),
          };
        }),
      );
    }

    if (q.has("calendar")) {
      const { data } = await db()
        .from("bookings")
        .select("id, starts_at, minutes, status, meet_url, inquiries(number, name)")
        .eq("status", "booked")
        .gte("starts_at", new Date(Date.now() - 3600_000).toISOString())
        .order("starts_at", { ascending: true });
      return json({ availability: await availability(), bookings: data ?? [] });
    }

    const row = await byNumber(q.get("n"));
    await db().from("inquiries").update({ studio_seen_at: new Date().toISOString() }).eq("id", row.id);
    const transcript = (row.transcript as AiTurn[]) ?? [];
    const files = await withUrls([...((row.files as string[]) ?? []), ...transcript.flatMap((t) => t.files ?? [])]);
    const { token, ...rest } = row;
    return json({
      ...rest,
      roomPath: `/zapitvane/${token}`,
      files,
      messages: await messagesOf(row.id),
      bookings: await bookingsOf(row.id),
    });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const input = await body<Record<string, unknown>>(request);
    if (input.action === "login") return json({ token: issueToken(str(input.password, 200)) });
    requireStudio(request);

    switch (input.action) {
      case "upload": {
        const row = await byNumber(input.n);
        return json(await uploadUrl(row.id, str(input.name, 120), str(input.type, 60)));
      }

      case "message": {
        const row = await byNumber(input.n);
        const text = str(input.body, 4000);
        const files = cleanPaths(input.files, [`${row.id}/`]);
        if (!text && !files.length) throw new HttpError(400, "empty");
        await postMessage(row.id, "studio", text, files);
        await db().from("inquiries").update({ studio_seen_at: new Date().toISOString() }).eq("id", row.id);
        return json({ ok: true });
      }

      case "offer": {
        const row = await byNumber(input.n);
        const price = Number(input.price);
        const deposit = Number(input.deposit);
        const offer: Offer = {
          price: Math.round(price),
          deposit: Math.round(deposit),
          deadline: str(input.deadline, 120),
          note: str(input.note, 2000),
          payment: str(input.payment, 600),
        };
        if (!(offer.price > 0) || !(offer.deposit > 0) || offer.deposit > offer.price) throw new HttpError(400, "offer");
        if (!offer.deadline) throw new HttpError(400, "deadline");
        await db()
          .from("inquiries")
          .update({ offer, status: "offer", offer_sent_at: new Date().toISOString() })
          .eq("id", row.id);
        await postMessage(row.id, "system", `Офертата е готова: ${offer.price} €, срок ${offer.deadline}, капаро ${offer.deposit} €.`);
        return json({ ok: true });
      }

      case "status": {
        const row = await byNumber(input.n);
        const status = str(input.status, 20) as InquiryStatus;
        if (!STATUSES.includes(status)) throw new HttpError(400, "status");
        await db().from("inquiries").update({ status }).eq("id", row.id);
        const note = STATUS_NOTE[status];
        if (note && status !== row.status) await postMessage(row.id, "system", note);
        return json({ ok: true });
      }

      case "meet": {
        const id = Number(input.id);
        const url = str(input.url, 400);
        if (!/^https:\/\//.test(url)) throw new HttpError(400, "url");
        const { data } = await db().from("bookings").update({ meet_url: url }).eq("id", id).select("inquiry_id, starts_at").maybeSingle();
        if (!data) throw new HttpError(404, "booking");
        const a = await availability();
        await postMessage(data.inquiry_id as string, "studio", `Линк за срещата (${when(data.starts_at as string, a.timeZone)}): ${url}`);
        return json({ ok: true });
      }

      case "cancel": {
        const id = Number(input.id);
        const { data } = await db()
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", id)
          .eq("status", "booked")
          .select("inquiry_id, starts_at")
          .maybeSingle();
        if (!data) throw new HttpError(404, "booking");
        const a = await availability();
        await postMessage(data.inquiry_id as string, "system", `Срещата за ${when(data.starts_at as string, a.timeZone)} е отменена. Избери друг час, когато ти е удобно.`);
        return json({ ok: true });
      }

      case "availability": {
        const next = cleanAvailability((input.availability ?? {}) as never, await availability());
        await db().from("studio_settings").update({ availability: next }).eq("id", 1);
        return json(next);
      }
    }
    throw new HttpError(400, "action");
  });
}
