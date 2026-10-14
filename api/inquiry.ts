// /api/inquiry - everything the client does. The client is identified only by
// the secret token in their private link; there are no accounts.
//
//   GET  ?ready              -> which parts are configured (database, AI, Telegram, payment, e-mail)
//   GET  ?token=…            -> the client's page (brief, deposit, status)
//   POST {action:"upload"}   -> signed URL to upload one file (before sending)
//   POST {action:"create"}   -> send the inquiry (questionnaire / description), returns the token
import { db, env, HttpError } from "./_lib/env.js";
import { uploadUrl, withUrls } from "./_lib/files.js";
import { body, DRAFT_RE, handle, json, str } from "./_lib/http.js";
import { createInquiry, type NewInquiry } from "./_lib/inquiries.js";
import { reconcile, TOKEN_RE, type InquiryRow } from "./_lib/payments.js";
import { emptyBrief, type Room } from "../src/lib/inquiry-shared.js";

async function byToken(token: unknown): Promise<InquiryRow> {
  const t = str(token, 64);
  if (!TOKEN_RE.test(t)) throw new HttpError(404, "not-found");
  const { data } = await db().from("inquiries").select("*").eq("token", t).maybeSingle();
  if (!data) throw new HttpError(404, "not-found");
  return data as InquiryRow;
}

export function GET(request: Request) {
  return handle(async () => {
    const q = new URL(request.url).searchParams;
    if (q.has("ready")) {
      return json({
        ready: Boolean(env.supabaseUrl && env.supabaseKey),
        ai: Boolean(env.anthropicKey),
        telegram: Boolean(env.telegramToken && env.telegramChat),
        pay: Boolean(env.stripeKey),
        mail: Boolean(env.resendKey && env.mailFrom),
      });
    }
    let row = await byToken(q.get("token"));
    // Back from Stripe: settle the payment even if the webhook is late or missing.
    if (q.has("paid")) row = await reconcile(row);
    await db().from("inquiries").update({ client_seen_at: new Date().toISOString() }).eq("id", row.id);
    const room: Room = {
      number: row.number,
      name: row.name,
      email: row.email,
      projectType: row.project_type,
      status: row.status,
      brief: { ...emptyBrief(), ...row.brief },
      answers: { projectType: "", hasSite: "", siteUrl: "", when: "", budget: "", ...row.answers },
      files: await withUrls(row.files ?? []),
      deposit: row.deposit,
      estimate: row.offer && typeof row.offer.price === "number" ? row.offer : null,
      paidAt: row.deposit_paid_at,
      canPay: Boolean(env.stripeKey),
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
        const draftId = str(input.draftId, 64);
        if (!DRAFT_RE.test(draftId)) throw new HttpError(400, "draft");
        return json(await uploadUrl(`drafts/${draftId}`, str(input.name, 120), str(input.type, 60)));
      }

      case "create": {
        const draftId = str(input.draftId, 64);
        if (!DRAFT_RE.test(draftId)) throw new HttpError(400, "draft");
        if (input.consent !== true) throw new HttpError(400, "consent");
        const payload: NewInquiry = {
          draftId,
          answers: (input.answers ?? {}) as NewInquiry["answers"],
          brief: (input.brief ?? {}) as NewInquiry["brief"],
          transcript: (Array.isArray(input.transcript) ? input.transcript : []) as NewInquiry["transcript"],
          files: input.files,
          name: str(input.name, 120),
          email: str(input.email, 200),
          phone: str(input.phone, 40),
        };
        const r = await createInquiry(payload);
        return json({ token: r.token, number: r.number });
      }
    }
    throw new HttpError(400, "action");
  });
}
