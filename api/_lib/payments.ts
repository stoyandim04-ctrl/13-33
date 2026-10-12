import Stripe from "stripe";

import { db, env, HttpError } from "./env.js";
import { layout, sendMail } from "./mail.js";
import { notify, studioLink } from "./notify.js";
import type { Brief, InquiryStatus } from "../../src/lib/inquiry-shared.js";

export const TOKEN_RE = /^[a-f0-9]{48}$/;

export interface InquiryRow {
  id: string;
  number: number;
  token: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string;
  status: InquiryStatus;
  brief: Brief;
  answers: Record<string, string>;
  files: string[];
  deposit: number;
  deposit_paid_at: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!env.stripeKey) throw new HttpError(503, "pay-not-configured");
  client ??= new Stripe(env.stripeKey);
  return client;
}

/**
 * The deposit went through: remember it, tell the founder, thank the client.
 * Idempotent - Stripe may deliver the same event twice, and the page may
 * reconcile the session before the webhook arrives.
 */
export async function markPaid(session: Stripe.Checkout.Session) {
  const id = session.metadata?.inquiry_id;
  if (!id) return;
  const { data } = await db()
    .from("inquiries")
    .update({
      status: "deposit_paid",
      deposit_paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
    })
    .eq("id", id)
    .is("deposit_paid_at", null)
    .select("number, name, email, deposit, token")
    .maybeSingle();
  if (!data) return;
  const row = data as { number: number; name: string; email: string; deposit: number; token: string };
  await notify(`№${row.number} ${row.name} плати капарото: ${row.deposit} €.\n${studioLink(row.number)}`);
  await sendMail(
    row.email,
    `Капарото е получено — проект №${row.number}`,
    layout(
      `Благодарим, ${row.name}!`,
      [
        `Получихме капарото от <strong>${row.deposit} €</strong> за проект №${row.number}. То се приспада от крайната цена.`,
        `${env.studioName} вече преглежда брифа ти и ще ти пише на този имейл с точна цена, план и първите стъпки.`,
        "Брифът ти остава на личния ти линк, ако искаш да го погледнеш пак.",
      ],
      { label: "Виж проекта си", href: `${env.siteUrl}/zapitvane/${row.token}` },
    ),
  );
}

/**
 * The client came back from Stripe before the webhook (or without one):
 * ask Stripe about the session and settle it.
 */
export async function reconcile(row: InquiryRow): Promise<InquiryRow> {
  if (row.deposit_paid_at || !row.stripe_session_id || !env.stripeKey) return row;
  try {
    const session = await stripe().checkout.sessions.retrieve(row.stripe_session_id);
    if (session.payment_status === "paid") {
      await markPaid(session);
      return { ...row, status: "deposit_paid", deposit_paid_at: new Date().toISOString() };
    }
  } catch (error) {
    console.error("stripe reconcile", error);
  }
  return row;
}
