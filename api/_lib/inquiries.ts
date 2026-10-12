// Creating an inquiry - from the questionnaire, the description or the
// consultant's own call at the end of the conversation. One place, so the
// founder's Telegram, the client's e-mail and the deposit are always the same.
import { db, env, HttpError } from "./env.js";
import { adopt } from "./files.js";
import { cleanPaths, isEmail, str } from "./http.js";
import { layout, sendMail } from "./mail.js";
import { notify, notifyFiles, studioLink } from "./notify.js";
import {
  BRIEF_LABELS,
  CONCRETE_TYPES,
  depositFor,
  emptyBrief,
  projectTypeLabel,
  PROJECT_TYPES,
  type AiTurn,
  type Answers,
  type Brief,
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
}

export const isConcreteType = (v: string) => (CONCRETE_TYPES as readonly string[]).includes(v);

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
  const deposit = depositFor(projectType);

  // A light brake on repeated sends from one address.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db().from("inquiries").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", hourAgo);
  if ((count ?? 0) >= 3) throw new HttpError(429, "too-many");

  const { data, error } = await db()
    .from("inquiries")
    .insert({ name, email, phone: phone || null, project_type: projectType, answers, brief, transcript, deposit })
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
      `${projectTypeLabel(projectType)} · капаро ${deposit > 0 ? `${deposit} €` : "не е зададено"}`,
      brief.summary,
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
        deposit > 0
          ? `Следващата стъпка е капарото от <strong>${deposit} €</strong> - плаща се онлайн на същата страница и се приспада от крайната цена. След него ${env.studioName} ти пише на този имейл с точна цена и план.`
          : `${env.studioName} ще прегледа брифа и ще ти пише на този имейл.`,
      ],
      { label: deposit > 0 ? "Виж брифа и плати капарото" : "Виж брифа си", href: link },
    ),
  );

  return { token: data.token as string, number: data.number as number, deposit };
}
