// /api/pay - the deposit, paid online through Stripe Checkout.
//
//   POST {token}             -> { url } - the Checkout page for this inquiry
//   POST ?webhook            -> Stripe tells us the payment went through
//
// Keys stay here: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET. If the webhook
// is not set up, the client's page still reconciles the session on its own
// (see _lib/payments.ts).
import Stripe from "stripe";

import { db, env, HttpError } from "./_lib/env.js";
import { body, handle, json, str } from "./_lib/http.js";
import { markPaid, stripe, TOKEN_RE, type InquiryRow } from "./_lib/payments.js";

export function POST(request: Request) {
  return handle(async () => {
    const url = new URL(request.url);
    if (url.searchParams.has("webhook")) return webhook(request);

    const client = stripe();
    const input = await body<{ token?: unknown }>(request, 2000);
    const token = str(input.token, 64);
    if (!TOKEN_RE.test(token)) throw new HttpError(404, "not-found");
    const { data } = await db().from("inquiries").select("*").eq("token", token).maybeSingle();
    const row = data as InquiryRow | null;
    if (!row) throw new HttpError(404, "not-found");
    if (row.deposit_paid_at) throw new HttpError(409, "already-paid");
    if (!(row.deposit > 0)) throw new HttpError(400, "no-deposit");

    const session = await client.checkout.sessions.create({
      mode: "payment",
      customer_email: row.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: row.deposit * 100,
            product_data: {
              name: `Капаро — проект №${row.number}`,
              description: "13:33 Digital Studio. Приспада се от крайната цена на проекта.",
            },
          },
        },
      ],
      metadata: { inquiry_id: row.id, number: String(row.number) },
      success_url: `${env.siteUrl}/zapitvane/${token}?paid=1`,
      cancel_url: `${env.siteUrl}/zapitvane/${token}`,
      locale: "auto",
    });
    await db().from("inquiries").update({ stripe_session_id: session.id }).eq("id", row.id);
    if (!session.url) throw new HttpError(502, "stripe");
    return json({ url: session.url });
  });
}

async function webhook(request: Request) {
  if (!env.stripeWebhookSecret) throw new HttpError(503, "not-configured");
  const client = stripe();
  const signature = request.headers.get("stripe-signature") ?? "";
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = await client.webhooks.constructEventAsync(raw, signature, env.stripeWebhookSecret);
  } catch {
    throw new HttpError(400, "signature");
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") await markPaid(session);
  }
  return json({ received: true });
}
