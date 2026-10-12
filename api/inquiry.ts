// /api/inquiry - everything the client does. The client is identified only by
// the secret token in their private link; there are no accounts.
//
//   GET  ?ready              -> which parts are configured (database, AI, Telegram)
//   GET  ?token=…            -> the room (chat, offer, meetings)
//   GET  ?token=…&slots      -> free meeting times
//   POST {action:"upload"}   -> signed URL to upload one file
//   POST {action:"create"}   -> send the inquiry, returns the token
//   POST {action:"message"}  -> a chat message
//   POST {action:"accept"}   -> accept the offer
//   POST {action:"book"} / {action:"cancel"} -> online meeting
import { db, env, HttpError } from "./_lib/env.js";
import { adopt, uploadUrl } from "./_lib/files.js";
import { availability, bookingsOf, messagesOf, postMessage, when } from "./_lib/rooms.js";
import { body, cleanPaths, DRAFT_RE, handle, isEmail, json, str } from "./_lib/http.js";
import { notify, notifyFiles, studioLink } from "./_lib/notify.js";
import { freeSlots } from "./_lib/slots.js";
import {
  BRIEF_LABELS,
  emptyBrief,
  projectTypeLabel,
  PROJECT_TYPES,
  type AiTurn,
  type Answers,
  type Brief,
  type Room,
} from "../src/lib/inquiry-shared.js";

const TOKEN_RE = /^[a-f0-9]{48}$/;

interface InquiryRow {
  id: string;
  number: number;
  name: string;
  email: string;
  project_type: string;
  status: Room["status"];
  offer: Room["offer"];
  brief: Brief;
  answers: Answers;
}

async function byToken(token: unknown): Promise<InquiryRow> {
  const t = str(token, 64);
  if (!TOKEN_RE.test(t)) throw new HttpError(404, "not-found");
  const { data } = await db()
    .from("inquiries")
    .select("id, number, name, email, project_type, status, offer, brief, answers")
    .eq("token", t)
    .maybeSingle();
  if (!data) throw new HttpError(404, "not-found");
  return data as InquiryRow;
}

export function GET(request: Request) {
  return handle(async () => {
    const q = new URL(request.url).searchParams;
    if (q.has("ready")) {
      return json({ ready: Boolean(env.supabaseUrl && env.supabaseKey), ai: Boolean(env.anthropicKey), telegram: Boolean(env.telegramToken && env.telegramChat) });
    }
    const row = await byToken(q.get("token"));
    if (q.has("slots")) {
      const a = await availability();
      const { data } = await db().from("bookings").select("starts_at").eq("status", "booked").gte("starts_at", new Date().toISOString());
      const taken = new Set((data ?? []).map((b) => new Date(b.starts_at as string).toISOString()));
      return json({ timeZone: a.timeZone, minutes: a.minutes, slots: freeSlots(a, taken) });
    }
    await db().from("inquiries").update({ client_seen_at: new Date().toISOString() }).eq("id", row.id);
    const room: Room = {
      number: row.number,
      name: row.name,
      projectType: projectTypeLabel(row.project_type),
      status: row.status,
      offer: row.offer,
      brief: { ...emptyBrief(), ...row.brief },
      answers: row.answers,
      messages: await messagesOf(row.id),
      bookings: await bookingsOf(row.id),
      studioName: env.studioName,
    };
    return json(room);
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const input = await body<Record<string, unknown>>(request);
    switch (input.action) {
      case "upload": {
        // Before sending: the draft's folder. After: the inquiry's folder.
        let folder: string;
        if (input.token) folder = (await byToken(input.token)).id;
        else {
          const draftId = str(input.draftId, 64);
          if (!DRAFT_RE.test(draftId)) throw new HttpError(400, "draft");
          folder = `drafts/${draftId}`;
        }
        return json(await uploadUrl(folder, str(input.name, 120), str(input.type, 60)));
      }

      case "create": {
        const draftId = str(input.draftId, 64);
        if (!DRAFT_RE.test(draftId)) throw new HttpError(400, "draft");
        const name = str(input.name, 80);
        const email = str(input.email, 120).toLowerCase();
        const phone = str(input.phone, 40);
        if (!name) throw new HttpError(400, "name");
        if (!isEmail(email)) throw new HttpError(400, "email");
        if (input.consent !== true) throw new HttpError(400, "consent");
        const a = (input.answers ?? {}) as Partial<Answers>;
        const projectType = PROJECT_TYPES.some((p) => p.id === a.projectType) ? (a.projectType as string) : "unsure";
        const answers: Answers = {
          projectType: projectType as Answers["projectType"],
          hasSite: str(a.hasSite, 60),
          siteUrl: str(a.siteUrl, 300),
          when: str(a.when, 60),
          budget: str(a.budget, 60),
        };
        const b = (input.brief ?? {}) as Partial<Brief>;
        const brief = emptyBrief();
        for (const k of Object.keys(brief) as (keyof Brief)[]) brief[k] = str(b[k], 1500);
        const transcript = (Array.isArray(input.transcript) ? (input.transcript as AiTurn[]) : [])
          .slice(-40)
          .map((t) => ({ role: t.role === "ai" ? "ai" : "client", text: str(t.text, 3000), files: cleanPaths(t.files, [`drafts/${draftId}/`]) }));

        // A light brake on repeated sends from one address.
        const hourAgo = new Date(Date.now() - 3600_000).toISOString();
        const { count } = await db().from("inquiries").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", hourAgo);
        if ((count ?? 0) >= 3) throw new HttpError(429, "too-many");

        const { data, error } = await db()
          .from("inquiries")
          .insert({ name, email, phone: phone || null, project_type: projectType, answers, brief, transcript })
          .select("id, number, token")
          .single();
        if (error || !data) throw new HttpError(500, "create");

        const files = await adopt(cleanPaths(input.files, [`drafts/${draftId}/`]), data.id);
        if (files.length) await db().from("inquiries").update({ files }).eq("id", data.id);

        await postMessage(
          data.id,
          "system",
          `Здравей, ${name}! Брифът ти е получен. ${env.studioName} ще го прегледа и ще ти пише тук с цена, срок и капаро. Можеш да пишеш, да добавяш снимки или да си запазиш онлайн среща.`,
          files,
        );
        const lines = BRIEF_LABELS.map(([k, l]) => (brief[k] ? `${l}: ${brief[k]}` : "")).filter(Boolean);
        await notify(
          [
            `Ново запитване №${data.number} — ${name}`,
            [email, phone].filter(Boolean).join(" · "),
            projectTypeLabel(projectType),
            brief.summary,
            ...lines,
            files.length ? `Файлове: ${files.length}` : "",
            studioLink(data.number),
          ]
            .filter(Boolean)
            .join("\n"),
        );
        notifyFiles(files, `№${data.number} ${name}`);
        return json({ token: data.token, number: data.number });
      }

      case "message": {
        const row = await byToken(input.token);
        const text = str(input.body, 4000);
        const files = cleanPaths(input.files, [`${row.id}/`]);
        if (!text && !files.length) throw new HttpError(400, "empty");
        await postMessage(row.id, "client", text, files);
        await notify(`№${row.number} ${row.name}: ${text || "(файлове)"}\n${studioLink(row.number)}`);
        notifyFiles(files, `№${row.number} ${row.name}`);
        return json({ ok: true });
      }

      case "accept": {
        const row = await byToken(input.token);
        if (row.status !== "offer" || !row.offer) throw new HttpError(409, "no-offer");
        await db().from("inquiries").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", row.id);
        await postMessage(row.id, "system", `${row.name} прие офертата. Следва капаро от ${row.offer.deposit} €.`);
        await notify(`№${row.number} ${row.name} прие офертата (${row.offer.price} €, капаро ${row.offer.deposit} €).\n${studioLink(row.number)}`);
        return json({ ok: true });
      }

      case "book": {
        const row = await byToken(input.token);
        const a = await availability();
        const startsAt = new Date(str(input.startsAt, 40));
        if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, "time");
        const iso = startsAt.toISOString();
        const { data: taken } = await db().from("bookings").select("starts_at").eq("status", "booked").gte("starts_at", new Date().toISOString());
        const free = freeSlots(a, new Set((taken ?? []).map((t) => new Date(t.starts_at as string).toISOString())));
        if (!free.includes(iso)) throw new HttpError(409, "slot-taken");
        const existing = (await bookingsOf(row.id)).filter((b) => b.status === "booked" && new Date(b.starts_at) > new Date());
        if (existing.length >= 2) throw new HttpError(409, "too-many-bookings");
        const { error } = await db().from("bookings").insert({ inquiry_id: row.id, starts_at: iso, minutes: a.minutes });
        if (error) throw new HttpError(409, "slot-taken");
        const label = when(iso, a.timeZone);
        await postMessage(row.id, "system", `Запазена онлайн среща: ${label} (${a.minutes} мин). Линкът за срещата ще дойде тук в чата.`);
        await notify(`№${row.number} ${row.name} запази среща: ${label}\n${studioLink(row.number)}`);
        return json({ ok: true });
      }

      case "cancel": {
        const row = await byToken(input.token);
        const id = Number(input.id);
        const { data } = await db()
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", id)
          .eq("inquiry_id", row.id)
          .eq("status", "booked")
          .select("starts_at")
          .maybeSingle();
        if (!data) throw new HttpError(404, "booking");
        const a = await availability();
        const label = when(data.starts_at as string, a.timeZone);
        await postMessage(row.id, "system", `Срещата за ${label} е отказана.`);
        await notify(`№${row.number} ${row.name} отказа срещата за ${label}.`);
        return json({ ok: true });
      }
    }
    throw new HttpError(400, "action");
  });
}

