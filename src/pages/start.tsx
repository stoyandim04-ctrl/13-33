// /zapochni - starting a project, one simple step at a time:
// four taps → a short conversation with the assistant (photos welcome) → name
// and e-mail → the client's private room, where the founder answers with the
// price, the deadline and the deposit.
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, MessageCircle, RotateCcw, Sparkles } from "lucide-react";

import { site } from "@/data/content";
import { Button } from "@/components/ui/button";
import { AttachButton, BriefCard, Bubble, Chip, Choice, Composer, DepositNote, Thumbs } from "@/components/inquiry/parts";
import {
  askAi,
  createInquiry,
  errorText,
  getReady,
  newDraftId,
  store,
  uploadFile,
} from "@/lib/inquiry-api";
import {
  BUDGET,
  emptyBrief,
  HAS_SITE,
  PROJECT_TYPES,
  WHEN,
  type AiTurn,
  type Answers,
  type Brief,
  type ChatFile,
} from "@/lib/inquiry-shared";

const DRAFT_KEY = "1333-draft";
export const ROOMS_KEY = "1333-rooms";

interface Draft {
  draftId: string;
  step: number;
  answers: Answers;
  conversation: AiTurn[];
  quick: string[];
  askFiles: boolean;
  done: boolean;
  brief: Brief;
  /** Paths of every file added before sending, with display names. */
  files: ChatFile[];
  mode: "ai" | "form";
  name: string;
  email: string;
  phone: string;
}

const fresh = (): Draft => ({
  draftId: newDraftId(),
  step: 0,
  answers: { projectType: "", hasSite: "", siteUrl: "", when: "", budget: "" },
  conversation: [],
  quick: [],
  askFiles: false,
  done: false,
  brief: emptyBrief(),
  files: [],
  mode: "ai",
  name: "",
  email: "",
  phone: "",
});

const STEPS = ["Проект", "Сайт", "Срок", "Бюджет", "Идеята", "Контакт"];

export default function StartPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = React.useState<Draft>(() => {
    const saved = store<Draft>(DRAFT_KEY);
    return saved?.draftId ? { ...fresh(), ...saved, files: (saved.files ?? []).map((f) => ({ ...f, url: undefined })) } : fresh();
  });
  const [ready, setReady] = React.useState<{ ready: boolean; ai: boolean } | null>(null);
  const top = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    document.title = "Започни проект — 13:33";
    getReady()
      .then(setReady)
      .catch(() => setReady({ ready: false, ai: false }));
  }, []);

  React.useEffect(() => {
    store(DRAFT_KEY, draft);
  }, [draft]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const go = (step: number) => {
    update({ step });
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" }));
  };
  const answer = <K extends keyof Answers>(key: K, value: Answers[K], next?: number) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [key]: value }, step: next ?? d.step }));

  const aiOff = ready !== null && !ready.ai;
  const mode = aiOff ? "form" : draft.mode;
  const { step, answers } = draft;

  return (
    <div ref={top} className="scroll-mt-24 px-5 pt-28 pb-24 sm:px-8 md:pt-36">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (step > 0 ? go(step - 1) : navigate("/"))}
            aria-label={step > 0 ? "Назад" : "Към началната страница"}
            className="border-border hover:border-foreground/40 grid size-10 shrink-0 place-items-center rounded-full border transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="flex-1">
            <div className="bg-border h-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Стъпка {step + 1} от {STEPS.length} · {STEPS[step]}
            </p>
          </div>
        </div>

        {step === 0 ? (
          <Step
            eyebrow="Започни проект"
            title="Какво искаш да направим?"
            lead="Около 3 минути: четири бързи избора, кратък разговор за идеята ти и готово."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((p) => (
                <Choice
                  key={p.id}
                  label={p.label}
                  hint={p.hint}
                  selected={answers.projectType === p.id}
                  onClick={() => answer("projectType", p.id, 1)}
                />
              ))}
            </div>
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title="Имаш ли сайт сега?">
            <div className="grid gap-3">
              {HAS_SITE.map((o) => (
                <Choice key={o} label={o} selected={answers.hasSite === o} onClick={() => answer("hasSite", o, o === HAS_SITE[0] ? 2 : 1)} />
              ))}
            </div>
            {answers.hasSite && answers.hasSite !== HAS_SITE[0] ? (
              <div className="mt-6">
                <label className="block">
                  <span className="text-sm font-medium">Линк към сайта</span>
                  <span className="text-muted-foreground"> · по желание</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={answers.siteUrl}
                    onChange={(e) => answer("siteUrl", e.target.value)}
                    placeholder="www.example.bg"
                    className="field mt-2"
                  />
                </label>
                <Button className="mt-5" onClick={() => go(2)}>
                  Напред <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title="Кога ти трябва?">
            <div className="grid gap-3">
              {WHEN.map((o) => (
                <Choice key={o} label={o} selected={answers.when === o} onClick={() => answer("when", o, 3)} />
              ))}
            </div>
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title="Имаш ли бюджет наум?" lead="Не е задължително — помага ни да предложим подходящото решение.">
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET.map((o) => (
                <Choice key={o} label={o} selected={answers.budget === o} onClick={() => answer("budget", o, 4)} />
              ))}
            </div>
          </Step>
        ) : null}

        {step === 4 ? (
          mode === "ai" && ready ? (
            <AiStep draft={draft} update={update} onNext={() => go(5)} onFallback={() => update({ mode: "form" })} />
          ) : mode === "form" ? (
            <FormStep draft={draft} update={update} onNext={() => go(5)} />
          ) : (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" /> Зареждане…
            </p>
          )
        ) : null}

        {step === 5 ? (
          <ContactStep
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

        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Да започнем отначало? Отговорите ще се изтрият.")) setDraft(fresh());
            }}
            className="text-muted-foreground hover:text-foreground mt-16 inline-flex items-center gap-2 text-sm"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" /> Започни отначало
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Step({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="ww-rise">
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.08] font-[500] tracking-[-0.04em] text-balance">{title}</h1>
      {lead ? <p className="text-muted-foreground mt-4 max-w-[46ch] text-lg text-pretty">{lead}</p> : null}
      <div className="mt-9">{children}</div>
    </section>
  );
}

// ---- the conversation ------------------------------------------------------

function AiStep({
  draft,
  update,
  onNext,
  onFallback,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  onNext: () => void;
  onFallback: () => void;
}) {
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState("");
  const end = React.useRef<HTMLDivElement>(null);
  const urls = React.useMemo(() => new Map(draft.files.map((f) => [f.path, f])), [draft.files]);

  const ask = React.useCallback(
    async (conversation: AiTurn[]) => {
      setThinking(true);
      setError("");
      try {
        const r = await askAi(draft.draftId, draft.answers, conversation);
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
    [draft.draftId, draft.answers, update],
  );

  // Open with the assistant's first question.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (started.current || draft.conversation.length) return;
    started.current = true;
    void ask([]);
  }, [ask, draft.conversation.length]);

  React.useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [draft.conversation.length, thinking]);

  const send = async (text: string, files: ChatFile[] = []) => {
    const turn: AiTurn = { role: "client", text, files: files.map((f) => f.path) };
    const conversation = [...draft.conversation, turn];
    update({ conversation, quick: [], files: [...draft.files, ...files] });
    await ask(conversation);
  };

  const clientTurns = draft.conversation.filter((t) => t.role === "client").length;
  const lastIsClient = draft.conversation[draft.conversation.length - 1]?.role === "client";

  return (
    <section>
      <p className="eyebrow mb-4 flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-3.5" /> Асистентът на 13:33
      </p>
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.08] font-[500] tracking-[-0.04em] text-balance">
        Разкажи ни идеята си
      </h1>
      <p className="text-muted-foreground mt-4 max-w-[48ch] text-pretty">
        Асистентът ще ти зададе няколко кратки въпроса. Отговаряй с думи или с едно докосване. Ако имаш лого, снимки или сайтове, които харесваш — добави ги.
      </p>

      <div className="mt-8" aria-live="polite">
        {draft.conversation.map((t, i) => (
          <Bubble
            key={i}
            mine={t.role === "client"}
            who={t.role === "ai" && (i === 0 || draft.conversation[i - 1].role !== "ai") ? "Асистент" : undefined}
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
            <div className="mt-3 flex flex-wrap gap-2">
              {lastIsClient || !draft.conversation.length ? (
                <Chip onClick={() => void ask(draft.conversation)}>Опитай пак</Chip>
              ) : null}
              <Chip onClick={onFallback}>Продължи с кратък въпросник</Chip>
            </div>
          </div>
        ) : null}
        <div ref={end} />
      </div>

      {draft.done ? (
        <BriefCard brief={draft.brief} className="mt-6" />
      ) : null}

      {!thinking && draft.quick.length && !draft.done ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {draft.quick.map((q) => (
            <Chip key={q} onClick={() => void send(q)}>
              {q}
            </Chip>
          ))}
        </div>
      ) : null}

      {draft.done ? (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button onClick={onNext}>
            Всичко е точно — напред <ArrowRight aria-hidden="true" />
          </Button>
          <span className="text-muted-foreground text-sm">или допиши нещо по-долу</span>
        </div>
      ) : null}

      <div className="mt-6">
        <Composer
          placeholder={draft.done ? "Искаш да добавиш нещо?" : "Напиши отговор…"}
          disabled={thinking}
          highlightAttach={draft.askFiles}
          upload={(file) => uploadFile(file, { draftId: draft.draftId })}
          onSend={(text, files) => send(text, files)}
        />
      </div>

      {!draft.done && clientTurns >= 2 ? (
        <button type="button" onClick={onNext} className="text-muted-foreground hover:text-foreground mt-5 inline-flex items-center gap-1.5 text-sm">
          Достатъчно, продължи към контакт <ArrowRight aria-hidden="true" className="size-3.5" />
        </button>
      ) : null}
    </section>
  );
}

// ---- without the assistant -------------------------------------------------

const FORM_QUESTIONS: { key: keyof Brief; label: string; hint: string }[] = [
  { key: "business", label: "С какво се занимаваш?", hint: "Напр. „Салон за красота в Пловдив“" },
  { key: "goal", label: "Какво трябва да постигне проектът?", hint: "Повече клиенти, онлайн продажби, записване на час…" },
  { key: "style", label: "Има ли сайтове или профили, които харесваш?", hint: "Линк или снимка — по желание" },
  { key: "extra", label: "Нещо друго, което да знаем?", hint: "По желание" },
];

function FormStep({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const set = (key: keyof Brief, value: string) => update({ brief: { ...draft.brief, [key]: value } });
  const ok = draft.brief.business.trim().length > 1 && draft.brief.goal.trim().length > 1;
  return (
    <Step title="Разкажи ни идеята си" lead="Четири кратки въпроса. Пиши както би го казал на приятел.">
      <div className="space-y-7">
        {FORM_QUESTIONS.map((q) => (
          <label key={q.key} className="block">
            <span className="block font-medium">{q.label}</span>
            <span className="text-muted-foreground block text-sm">{q.hint}</span>
            <textarea value={draft.brief[q.key]} onChange={(e) => set(q.key, e.target.value)} rows={3} className="field mt-2 resize-y" />
          </label>
        ))}
        <div>
          <p className="font-medium">Лого, снимки, примери</p>
          <p className="text-muted-foreground text-sm">По желание.</p>
          <Thumbs files={draft.files} onRemove={(p) => update({ files: draft.files.filter((f) => f.path !== p) })} />
          <div className="mt-3">
            <AttachButton
              upload={(file) => uploadFile(file, { draftId: draft.draftId })}
              onUploaded={(f) => update({ files: [...draft.files, f] })}
            />
          </div>
        </div>
        <DepositNote />
        <Button disabled={!ok} onClick={() => {
          update({ brief: { ...draft.brief, summary: draft.brief.summary || draft.brief.goal } });
          onNext();
        }}>
          Напред <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </Step>
  );
}

// ---- contact ---------------------------------------------------------------

function ContactStep({
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
    <Step title="Последно — как да ти пишем?" lead="Ще получиш личен чат на сайта. Там основателят ти пише цената, срока и капарото.">
      <form onSubmit={send} noValidate className="space-y-6">
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
        <label className="block">
          <span className="text-sm font-medium">Телефон</span>
          <span className="text-muted-foreground text-sm"> · по желание</span>
          <input type="tel" inputMode="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} autoComplete="tel" className="field mt-2" />
        </label>

        <ol className="border-border bg-surface space-y-3 rounded-3xl border p-6 text-[0.9375rem]">
          {[
            "Основателят преглежда брифа ти.",
            "Пише ти в личния чат: крайна цена, срок и капаро.",
            "Ако искаш, си запазваш онлайн среща от календара.",
            "Приемаш офертата, плащаш капарото — и започваме.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="text-ice tabular-nums">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
          <li className="pt-1">
            <DepositNote />
          </li>
        </ol>

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

        <Button type="submit" disabled={!ok || pending || disabled} className="w-full sm:w-auto">
          {pending ? "Изпращане…" : "Изпрати и отвори чата"}
          {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <MessageCircle aria-hidden="true" />}
        </Button>
      </form>
    </Step>
  );
}
