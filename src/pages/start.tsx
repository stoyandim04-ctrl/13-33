// /zapochni - starting a project is one chat, like a messaging app:
// the assistant asks, the client writes in their own words (or taps an
// answer), adds pictures if they help, leaves a name and an e-mail in the same
// chat and lands in their private room, where the founder answers with the
// price, the deadline and the deposit.
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { site } from "@/data/content";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { BriefCard, Bubble, Chip, Composer, DepositNote } from "@/components/inquiry/parts";
import { askAi, createInquiry, errorText, getReady, newDraftId, store, uploadFile } from "@/lib/inquiry-api";
import {
  emptyBrief,
  PROJECT_TYPES,
  type AiTurn,
  type Answers,
  type Brief,
  type ChatFile,
} from "@/lib/inquiry-shared";

const DRAFT_KEY = "1333-chat";
export const ROOMS_KEY = "1333-rooms";

/** Without the assistant the chat still works: these are asked one by one. */
const FALLBACK: { key: keyof Brief; text: string }[] = [
  { key: "business", text: "Здравей! Асистентът ни почива в момента, но можем и така. С какво се занимаваш и какво предлагаш?" },
  { key: "goal", text: "Какво трябва да постигне проектът? Повече клиенти, онлайн продажби, записване на час…" },
  { key: "style", text: "Има ли сайтове или профили, които харесваш? Линк или снимка — по желание." },
  { key: "extra", text: "Нещо друго, което да знаем? Ако не — просто напиши „не“." },
];

const OPENER =
  "Здравей! Разкажи ми с няколко думи какво искаш да направим. Може да е сайт, магазин, бранд, приложение или нещо, за което още нямаш дума.";

interface Draft {
  draftId: string;
  answers: Answers;
  conversation: AiTurn[];
  quick: string[];
  askFiles: boolean;
  done: boolean;
  brief: Brief;
  /** Paths of every file added before sending, with display names. */
  files: ChatFile[];
  /** How many fallback questions have been answered (fallback mode only). */
  fallbackStep: number;
  /** The client asked to finish early - show the contact card. */
  contact: boolean;
  name: string;
  email: string;
  phone: string;
}

const fresh = (): Draft => ({
  draftId: newDraftId(),
  answers: { projectType: "", hasSite: "", siteUrl: "", when: "", budget: "" },
  conversation: [],
  quick: [],
  askFiles: false,
  done: false,
  brief: emptyBrief(),
  files: [],
  fallbackStep: 0,
  contact: false,
  name: "",
  email: "",
  phone: "",
});

export default function StartPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = React.useState<Draft>(() => {
    const saved = store<Draft>(DRAFT_KEY);
    return saved?.draftId
      ? { ...fresh(), ...saved, files: (saved.files ?? []).map((f) => ({ ...f, url: undefined })) }
      : fresh();
  });
  const [ready, setReady] = React.useState<{ ready: boolean; ai: boolean } | null>(null);
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState("");
  const end = React.useRef<HTMLDivElement>(null);
  const urls = React.useMemo(() => new Map(draft.files.map((f) => [f.path, f])), [draft.files]);

  React.useEffect(() => {
    document.title = "Започни проект — 13:33";
    getReady()
      .then(setReady)
      .catch(() => setReady({ ready: false, ai: false }));
  }, []);

  React.useEffect(() => {
    store(DRAFT_KEY, draft);
  }, [draft]);

  const update = React.useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);

  // The assistant is on unless the server says otherwise.
  const ai = ready === null ? true : ready.ai;

  const ask = React.useCallback(
    async (conversation: AiTurn[], answers: Answers) => {
      setThinking(true);
      setError("");
      try {
        const r = await askAi(draft.draftId, answers, conversation);
        update({
          conversation: [...conversation, { role: "ai", text: r.reply }],
          quick: r.quickReplies,
          askFiles: r.askFiles,
          done: r.done,
          brief: r.brief,
        });
      } catch (e) {
        update({ conversation });
        setError(errorText(e));
      } finally {
        setThinking(false);
      }
    },
    [draft.draftId, update],
  );

  /** One client message, from the box or a tapped chip. */
  const send = async (text: string, files: ChatFile[] = []) => {
    const turn: AiTurn = { role: "client", text, files: files.map((f) => f.path) };
    const conversation = [...draft.conversation, turn];
    // A tapped project type is also kept as a step answer for the brief.
    const typed = PROJECT_TYPES.find((p) => p.label === text);
    const answers: Answers =
      typed && !draft.answers.projectType ? { ...draft.answers, projectType: typed.id } : draft.answers;

    if (!ai) {
      // Scripted questions, one at a time.
      const q = FALLBACK[draft.fallbackStep];
      const brief = q ? { ...draft.brief, [q.key]: text } : draft.brief;
      const next = Math.min(draft.fallbackStep + 1, FALLBACK.length);
      const finished = next >= FALLBACK.length;
      update({
        conversation: finished
          ? conversation
          : [...conversation, { role: "ai", text: FALLBACK[next].text }],
        answers,
        brief: { ...brief, summary: brief.summary || brief.goal || brief.business },
        files: [...draft.files, ...files],
        fallbackStep: next,
        quick: [],
        done: finished,
      });
      return;
    }

    update({ conversation, answers, quick: [], files: [...draft.files, ...files] });
    await ask(conversation, answers);
  };

  // Scroll to the newest message.
  React.useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [draft.conversation.length, thinking, draft.done, draft.contact]);

  // Fallback mode opens with its own first question.
  React.useEffect(() => {
    if (ready && !ready.ai && !draft.conversation.length) {
      update({ conversation: [{ role: "ai", text: FALLBACK[0].text }], fallbackStep: 0 });
    }
  }, [ready, draft.conversation.length, update]);

  const clientTurns = draft.conversation.filter((t) => t.role === "client").length;
  const lastIsClient = draft.conversation[draft.conversation.length - 1]?.role === "client";
  const showContact = draft.done || draft.contact;
  const chips = draft.conversation.length ? draft.quick : PROJECT_TYPES.map((p) => p.label);

  const restart = () => {
    if (window.confirm("Да започнем отначало? Разговорът ще се изтрие.")) {
      setDraft(fresh());
      setError("");
    }
  };

  return (
    <div className="flex min-h-svh flex-col px-5 pt-24 sm:px-8 md:pt-28">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-3.5" /> Започни проект
            </p>
            <h1 className="font-display mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] leading-[1.08] font-[300] tracking-[-0.035em] text-balance">
              Разкажи ни идеята си
            </h1>
          </div>
          {draft.conversation.length ? (
            <button type="button" onClick={restart} className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors">
              <RotateCcw aria-hidden="true" className="size-3.5" /> Отначало
            </button>
          ) : null}
        </header>

        <div className="flex-1" aria-live="polite">
          {/* The opener is static: no request until the client writes. */}
          {ai ? <Bubble mine={false} who="Асистентът на 13:33" message={{ sender: "studio", body: OPENER, files: [], created_at: "" }} /> : null}

          {draft.conversation.map((t, i) => (
            <Bubble
              key={i}
              mine={t.role === "client"}
              who={t.role === "ai" && draft.conversation[i - 1]?.role !== "ai" ? "Асистентът на 13:33" : undefined}
              message={{
                sender: t.role === "client" ? "client" : "studio",
                body: t.text,
                files: (t.files ?? []).map((p) => urls.get(p) ?? { path: p, name: p.split("/").pop() ?? p }),
                created_at: "",
              }}
            />
          ))}

          {thinking ? (
            <div className="bg-surface-2 my-2 inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3" aria-label="Асистентът пише">
              {[0, 1, 2].map((i) => (
                <span key={i} className="bg-muted-foreground size-1.5 animate-pulse rounded-full" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="border-destructive/40 my-4 rounded-2xl border p-4 text-sm">
              <p>{error}</p>
              {lastIsClient ? (
                <div className="mt-3">
                  <Chip onClick={() => void ask(draft.conversation, draft.answers)}>Опитай пак</Chip>
                </div>
              ) : null}
            </div>
          ) : null}

          {!thinking && chips.length && !showContact ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((q) => (
                <Chip key={q} onClick={() => void send(q)}>
                  {q}
                </Chip>
              ))}
            </div>
          ) : null}

          {draft.done ? <BriefCard brief={draft.brief} className="mt-6" /> : null}

          {showContact ? (
            <ContactCard
              draft={draft}
              update={update}
              disabled={ready !== null && !ready.ready}
              onSent={(token) => {
                const rooms = store<string[]>(ROOMS_KEY) ?? [];
                store(ROOMS_KEY, [token, ...rooms.filter((t) => t !== token)].slice(0, 10));
                store(DRAFT_KEY, null);
                navigate(`/zapitvane/${token}`);
              }}
            />
          ) : null}

          <div ref={end} className="h-4" />
        </div>

        {/* The box stays within reach at the bottom, like in a chat app. */}
        <div className="bg-background/85 sticky bottom-0 z-10 -mx-5 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:-mx-8 sm:px-8">
          <Composer
            placeholder={showContact ? "Искаш да добавиш нещо?" : "Напиши съобщение…"}
            disabled={thinking}
            highlightAttach={draft.askFiles}
            upload={ready?.ready ? (file) => uploadFile(file, { draftId: draft.draftId }) : undefined}
            onSend={(text, files) => send(text, files)}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
            <p className="text-muted-foreground text-xs">Асистентът не казва цени и срокове. Тях ти ги пише основателят, лично.</p>
            {!showContact && clientTurns >= 2 ? (
              <button type="button" onClick={() => update({ contact: true, brief: { ...draft.brief, summary: draft.brief.summary || lastClientText(draft) } })} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors">
                Достатъчно, към контакт <ArrowRight aria-hidden="true" className="size-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const lastClientText = (d: Draft) => [...d.conversation].reverse().find((t) => t.role === "client")?.text ?? "";

// ---- contact, inside the chat -----------------------------------------------

function ContactCard({
  draft,
  update,
  disabled,
  onSent,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  disabled: boolean;
  onSent: (token: string) => void;
}) {
  const [consent, setConsent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim());
  const ok = draft.name.trim().length > 1 && emailOk && consent;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ok || pending) return;
    setPending(true);
    setError("");
    try {
      const r = await createInquiry({
        draftId: draft.draftId,
        answers: draft.answers,
        brief: draft.brief,
        transcript: draft.conversation,
        files: draft.files.map((f) => f.path),
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        consent,
      });
      onSent(r.token);
    } catch (e) {
      setError(errorText(e));
      setPending(false);
    }
  };

  return (
    <section aria-label="Контакт" className="border-border bg-surface ww-rise mt-6 rounded-3xl border p-6">
      <p className="eyebrow mb-3">Последно</p>
      <h2 className="font-display text-title font-[500] tracking-[-0.025em]">Как да ти пишем?</h2>
      <p className="text-muted-foreground mt-2 text-[0.9375rem] text-pretty">
        Ще получиш личен чат на сайта. Там основателят ти пише цената, срока и капарото.
      </p>

      <form onSubmit={send} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Име</span>
            <input value={draft.name} onChange={(e) => update({ name: e.target.value })} autoComplete="name" className="field mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Имейл</span>
            <input
              type="email"
              inputMode="email"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
              autoComplete="email"
              aria-invalid={Boolean(draft.email) && !emailOk}
              className="field mt-2"
            />
            {draft.email && !emailOk ? <span className="text-destructive mt-1 block text-sm">Провери имейла.</span> : null}
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Телефон</span>
          <span className="text-muted-foreground text-sm"> · по желание</span>
          <input type="tel" inputMode="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} autoComplete="tel" className="field mt-2" />
        </label>

        <ul className="text-muted-foreground space-y-2 text-[0.9375rem]">
          {[
            "Основателят преглежда разговора.",
            "Пише ти в личния чат: крайна цена, срок и капаро.",
            "Приемаш офертата, плащаш капарото и започваме.",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <DepositNote />

        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-primary mt-1 size-4 shrink-0" />
          <span className="text-muted-foreground">Съгласен/на съм 13:33 да използва тези данни и файлове, за да отговори на запитването ми.</span>
        </label>

        {disabled ? (
          <p className="text-destructive text-sm">
            Онлайн запитванията още не са включени.
            {site.contactEmail ? (
              <>
                {" "}Пиши ни на <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
              </>
            ) : null}
          </p>
        ) : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <RainbowButton type="submit" disabled={!ok || pending || disabled}>
            {pending ? "Изпращане…" : "Изпрати и отвори чата"}
            {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
          </RainbowButton>
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Към началото
          </Link>
        </div>
      </form>
    </section>
  );
}
