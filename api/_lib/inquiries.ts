// Creating an inquiry - from the questionnaire, the description or the
// consultant's own call at the end of the conversation. One place, so the
// studio's Telegram, the client's e-mail, the price and the deposit always agree.
import { db, env, HttpError } from "./env.js";
import { adopt } from "./files.js";
import { cleanPaths, isEmail, str } from "./http.js";
import { layout, sendMail } from "./mail.js";
import { notify, notifyFiles, studioLink } from "./notify.js";
import {
  BRIEF_LABELS,
  CONCRETE_TYPES,
  depositFor,
  depositFromPrice,
  emptyBrief,
  FIRST_VERSION_DAYS,
  PRICE_GUIDE,
  projectTypeLabel,
  PROJECT_TYPES,
  type AiTurn,
  type Answers,
  type Brief,
  type ConcreteTypeId,
  type Estimate,
} from "../../src/lib/inquiry-shared.js";

export interface NewInquiry {
  draftId: string;
  answers: Partial<Answers>;
  brief: Partial<Brief>;
  transcript: AiTurn[];
  files: unknown;
  name: string;
  email: string;
  phone: string;
  /** The consultant's choice, when the questionnaire did not say. */
  projectType?: string;
  /** The consultant's price, item by item. */
  estimate?: unknown;
}

export const isConcreteType = (v: string) => (CONCRETE_TYPES as readonly string[]).includes(v);

/**
 * The consultant's price, checked: whole euro items, a total inside the guide
 * for the kind of project ([from, 2 × to]). Anything else is no price at all -
 * the inquiry then falls back to the fixed deposit.
 */
export function cleanEstimate(raw: unknown, type: string): Estimate | null {
  if (!isConcreteType(type) || !raw || typeof raw !== "object") return null;
  const r = raw as { items?: unknown; note?: unknown };
  const items = (Array.isArray(r.items) ? r.items : [])
    .slice(0, 12)
    .map((i) => ({ name: str((i as { name?: unknown })?.name, 120), price: Math.round(Number((i as { price?: unknown })?.price)) }))
    .filter((i) => i.name && Number.isFinite(i.price) && i.price > 0);
  if (!items.length) return null;
  const price = items.reduce((sum, i) => sum + i.price, 0);
  const guide = PRICE_GUIDE[type as ConcreteTypeId];
  if (price < guide.from || price > guide.to * 2) return null;
  return { price, items, note: str(r.note, 400) };
}

export async function createInquiry(input: NewInquiry): Promise<{ token: string; number: number; deposit: number }> {
  const draftId = str(input.draftId, 64);
  const name = str(input.name, 120);
  const email = str(input.email, 200).toLowerCase();
  const phone = str(input.phone, 40);
  if (name.length < 2) throw new HttpError(400, "name");
  if (!isEmail(email)) throw new HttpError(400, "email");

  const a = input.answers ?? {};
  const fromAnswers = str(a.projectType, 20);
  const projectType =
    isConcreteType(str(input.projectType, 20)) ? str(input.projectType, 20)
    : PROJECT_TYPES.some((p) => p.id === fromAnswers) ? fromAnswers
    : "unsure";
  const answers: Answers = {
    projectType: (PROJECT_TYPES.some((p) => p.id === fromAnswers) ? fromAnswers : projectType) as Answers["projectType"],
    hasSite: str(a.hasSite, 60),
    siteUrl: str(a.siteUrl, 300),
    when: str(a.when, 60),
    budget: str(a.budget, 60),
  };
  const b = input.brief ?? {};
  const brief = emptyBrief();
  for (const k of Object.keys(brief) as (keyof Brief)[]) brief[k] = str(b[k], 1500);
  const transcript = (Array.isArray(input.transcript) ? input.transcript : [])
    .slice(-40)
    .map((t) => ({ role: t.role === "ai" ? "ai" : "client", text: str(t.text, 3000), files: cleanPaths(t.files, [`drafts/${draftId}/`]) }));
  const estimate = cleanEstimate(input.estimate, projectType);
  const deposit = estimate ? depositFromPrice(estimate.price) : depositFor(projectType);

  // A light brake on repeated sends from one address.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db().from("inquiries").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", hourAgo);
  if ((count ?? 0) >= 3) throw new HttpError(429, "too-many");

  const { data, error } = await db()
    .from("inquiries")
    .insert({ name, email, phone: phone || null, project_type: projectType, answers, brief, transcript, deposit, offer: estimate })
    .select("id, number, token")
    .single();
  if (error || !data) throw new HttpError(500, "create");

  const wanted = [...cleanPaths(input.files, [`drafts/${draftId}/`]), ...transcript.flatMap((t) => t.files)];
  const files = await adopt([...new Set(wanted)], data.id);
  if (files.length) await db().from("inquiries").update({ files }).eq("id", data.id);

  const lines = BRIEF_LABELS.map(([k, l]) => (brief[k] ? `${l}: ${brief[k]}` : "")).filter(Boolean);
  await notify(
    [
      `Ново запитване №${data.number} — ${name}`,
      [email, phone].filter(Boolean).join(" · "),
      `${projectTypeLabel(projectType)} · ${estimate ? `цена ${estimate.price} € · ` : ""}капаро ${deposit > 0 ? `${deposit} €` : "не е зададено"}`,
      brief.summary,
      ...(estimate ? estimate.items.map((i) => `· ${i.name}: ${i.price} €`) : []),
      ...lines,
      files.length ? `Файлове: ${files.length}` : "",
      studioLink(data.number),
    ]
      .filter(Boolean)
      .join("\n"),
  );
  notifyFiles(files, `№${data.number} ${name}`);

  const link = `${env.siteUrl}/zapitvane/${data.token}`;
  await sendMail(
    email,
    `Брифът ти е при нас — проект №${data.number}`,
    layout(
      `Здравей, ${name}!`,
      [
        `Получихме запитването ти за <strong>${projectTypeLabel(projectType)}</strong>. Брифът е подреден и е на личния ти линк.`,
        estimate ? `Цената на проекта е <strong>${estimate.price} €</strong>; разбивката е на страницата ти.` : "",
        deposit > 0
          ? `Следващата стъпка е капарото от <strong>${deposit} €</strong> - плаща се онлайн на същата страница и се приспада от цената. До ${FIRST_VERSION_DAYS} работни дни след него първата версия е на този имейл.`
          : `${env.studioName} ще прегледа брифа и ще ти пише на този имейл.`,
      ].filter(Boolean),
      { label: deposit > 0 ? "Виж брифа и плати капарото" : "Виж брифа си", href: link },
    ),
  );

  return { token: data.token as string, number: data.number as number, deposit };
}
