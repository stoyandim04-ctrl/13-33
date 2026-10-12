// /zapochni - starting a project. The client picks how to tell us:
//   • the questionnaire - four taps (what, current site, when, budget), then
//     the client's own words (a description with pictures and files) or the
//     assistant;
//   • the assistant - a full chat, like a messaging app: write freely, send
//     pictures and files, tap a ready answer; the assistant asks only what it
//     still needs and keeps a brief.
// Both end with name and e-mail inside the chat and the client's private room,
// where the founder answers with the price, the deadline and the deposit.
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Check,
  FileText,
  ImagePlus,
  ListChecks,
  Loader2,
  Paperclip,
  PenLine,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

import { site } from "@/data/content";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Button } from "@/components/ui/button";
import { BriefCard, Choice, DepositNote } from "@/components/inquiry/parts";
import { ACCEPT, briefAi, createInquiry, errorText, getReady, MAX_FILE, newDraftId, store, streamAi, uploadFile } from "@/lib/inquiry-api";
import {
  BUDGET,
  emptyBrief,
  HAS_SITE,
  PROJECT_TYPES,
  projectTypeLabel,
  WHEN,
  type AiTurn,
  type Answers,
  type Brief,
  type ChatFile,
} from "@/lib/inquiry-shared";

const DRAFT_KEY = "1333-start";
export const ROOMS_KEY = "1333-rooms";

/** Without the assistant the chat still works: these are asked one by one. */
const FALLBACK: { key: keyof Brief; text: string }[] = [
  { key: "business", text: "Здравей! Асистентът ни почива в момента, но можем и така. С какво се занимаваш и какво предлагаш?" },
  { key: "goal", text: "Какво трябва да постигне проектът? Повече клиенти, онлайн продажби, записване на час…" },
  { key: "style", text: "Има ли сайтове или профили, които харесваш? Линк или снимка — по желание." },
  { key: "extra", text: "Нещо друго, което да знаем? Ако не — просто напиши „не“." },
];

const OPENER =
  "Здравей! Аз съм консултантът на 13:33 и мисля само за сайтове и дигитални проекти. Разкажи ми за своя — или ме питай каквото те вълнува: какво да включва, как да изглежда, какво ще ти трябва. Снимки, лого и PDF можеш да пращаш направо тук.";

/** Something to start from when the page is empty. */
const STARTERS = [
  "Искам сайт за бизнеса си, но не знам откъде да започна.",
  "Имам сайт, но не ми носи клиенти. Какво да променя?",
  "Какво трябва да има един онлайн магазин, за да продава?",
];

type Mode = "choose" | "steps" | "describe" | "chat";

interface Draft {
  draftId: string;
  mode: Mode;
  step: number;
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
  /** The idea in the client's own words (the "describe" path). */
  description: string;
  name: string;
  email: string;
  phone: string;
}

const fresh = (): Draft => ({
  draftId: newDraftId(),
  mode: "choose",
  step: 0,
  answers: { projectType: "", hasSite: "", siteUrl: "", when: "", budget: "" },
  conversation: [],
  quick: [],
  askFiles: false,
  done: false,
  brief: emptyBrief(),
  files: [],
  fallbackStep: 0,
  contact: false,
  description: "",
  name: "",
  email: "",
  phone: "",
});

const STEPS = ["Проект", "Сайт", "Срок", "Бюджет"];

export default function StartPage() {
  const navigate = useNavigate();
  const { tr, lang } = useLang();
  // A saved draft is restored, but the page always opens on the choice; the
  // visitor can pick up where they left off from there.
  const [resume] = React.useState<Mode | null>(() => {
    const saved = store<Draft>(DRAFT_KEY);
    if (!saved?.draftId || saved.mode === "choose") return null;
    const started = saved.conversation?.length || saved.answers?.projectType || saved.description;
    return started ? saved.mode : null;
  });
  const [draft, setDraft] = React.useState<Draft>(() => {
    const saved = store<Draft>(DRAFT_KEY);
    return saved?.draftId
      ? { ...fresh(), ...saved, mode: "choose", files: (saved.files ?? []).map((f) => ({ ...f, url: undefined })) }
      : fresh();
  });
  const [ready, setReady] = React.useState<{ ready: boolean; ai: boolean } | null>(null);

  React.useEffect(() => {
    document.title = tr("Започни проект — 13:33");
    getReady()
      .then(setReady)
      .catch(() => setReady({ ready: false, ai: false }));
  }, [lang, tr]);

  React.useEffect(() => {
    store(DRAFT_KEY, draft);
  }, [draft]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [draft.mode, draft.step]);

  const update = React.useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const restart = () => {
    if (window.confirm(tr("Да започнем отначало? Отговорите и разговорът ще се изтрият."))) setDraft(fresh());
  };

  const onSent = (token: string) => {
    const rooms = store<string[]>(ROOMS_KEY) ?? [];
    store(ROOMS_KEY, [token, ...rooms.filter((t) => t !== token)].slice(0, 10));
    store(DRAFT_KEY, null);
    navigate(`/zapitvane/${token}`);
  };

  if (draft.mode === "choose")
    return (
      <Choose
        resume={resume && draft.mode === "choose" ? resume : null}
        onResume={() => update({ mode: resume ?? "chat" })}
        onFresh={() => setDraft(fresh())}
        onPick={(mode) => {
          setDraft({ ...fresh(), mode, step: 0 });
        }}
      />
    );
  if (draft.mode === "steps") return <Steps draft={draft} update={update} onRestart={restart} />;
  if (draft.mode === "describe") return <Describe draft={draft} update={update} ready={ready} onSent={onSent} />;
  return <Chat draft={draft} update={update} ready={ready} onRestart={restart} onSent={onSent} />;
}

// ---- 1. how do you want to tell us? -----------------------------------------

function Choose({
  onPick,
  resume,
  onResume,
  onFresh,
}: {
  onPick: (mode: Mode) => void;
  resume: Mode | null;
  onResume: () => void;
  onFresh: () => void;
}) {
  const { tr } = useLang();
  return (
    <div className="px-5 pt-32 pb-24 sm:px-8 md:pt-40">
      <div className="mx-auto max-w-5xl">
        {resume ? (
          <div className="border-primary/40 bg-primary/[0.06] mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4">
            <p className="text-[0.9375rem]">{tr("Имаш започнато запитване.")}</p>
            <div className="flex items-center gap-4 text-sm">
              <button type="button" onClick={onResume} className="text-ice inline-flex items-center gap-1.5 font-medium">
                {tr("Продължи")} <ArrowRight aria-hidden="true" className="size-3.5" />
              </button>
              <button type="button" onClick={onFresh} className="text-muted-foreground hover:text-foreground transition-colors">
                {tr("Започни ново")}
              </button>
            </div>
          </div>
        ) : null}
        <header className="max-w-[40rem]">
          <p className="eyebrow mb-5">{tr("Започни проект")}</p>
          <h1 className="font-display text-heading font-[300] tracking-[-0.045em] text-balance">{tr("Как искаш да ни разкажеш?")}</h1>
          <p className="text-lead text-muted-foreground mt-6 max-w-[42ch] text-pretty">
            {tr("И по двата пътя накрая получаваш личен чат с основателя: цена, срок и капаро. Без регистрация.")}
          </p>
        </header>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <PathCard
            icon={<ListChecks aria-hidden="true" className="size-6" />}
            title={tr("Въпросник")}
            lead={tr("Четири бързи избора с по едно докосване. Около минута.")}
            points={[tr("Какво искаш, имаш ли сайт, кога, бюджет"), tr("После разказваш с думи или с асистента"), tr("Снимки и файлове и по двата пътя")]}
            action={tr("Попълни въпросника")}
            onClick={() => onPick("steps")}
          />
          <PathCard
            icon={<Sparkles aria-hidden="true" className="size-6" />}
            title={tr("AI консултант")}
            lead={tr("Истински разговор, не въпросник. Мисли само за сайтове и дигитални проекти.")}
            points={[tr("Питай каквото искаш — отговаря и дава идеи"), tr("Снимки, лого, PDF — пращаш ги в чата"), tr("Накрая подрежда всичко в бриф")]}
            action={tr("Говори с консултанта")}
            featured
            onClick={() => onPick("chat")}
          />
        </div>
      </div>
    </div>
  );
}

function PathCard({
  icon,
  title,
  lead,
  points,
  action,
  featured,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  lead: string;
  points: string[];
  action: string;
  featured?: boolean;
  onClick: () => void;
}) {
  const { tr } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group border-border bg-surface relative isolate flex flex-col rounded-[1.75rem] border p-7 text-left transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_30px_80px_-30px_var(--color-primary)] md:p-9",
        featured && "border-primary/40 shadow-[0_30px_80px_-40px_var(--color-primary)]",
      )}
    >
      {featured ? (
        <span className="bg-primary/15 text-ice absolute top-6 right-6 rounded-full px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
          {tr("Препоръчано")}
        </span>
      ) : null}
      <span className="bg-surface-2 text-ice grid size-12 place-items-center rounded-2xl">{icon}</span>
      <span className="font-display mt-7 block text-[1.75rem] leading-none font-[400] tracking-[-0.03em]">{title}</span>
      <span className="text-muted-foreground mt-3 block max-w-[34ch] text-pretty">{lead}</span>
      <ul className="mt-6 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-[0.9375rem]">
            <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <span className="group-hover:text-ice mt-8 inline-flex items-center gap-2 font-medium transition-colors">
        {action}
        <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
      </span>
    </button>
  );
}

// ---- 2. the questionnaire ----------------------------------------------------

function Steps({ draft, update, onRestart }: { draft: Draft; update: (p: Partial<Draft>) => void; onRestart: () => void }) {
  const { tr } = useLang();
  const { step, answers } = draft;
  const answer = <K extends keyof Answers>(key: K, value: Answers[K], next?: number) =>
    update({ answers: { ...answers, [key]: value }, step: next ?? step });
  const back = () => (step > 0 ? update({ step: step - 1 }) : update({ mode: "choose" }));
  const finished = step >= STEPS.length;

  return (
    <div className="px-5 pt-28 pb-24 sm:px-8 md:pt-36">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center gap-4">
          <button
            type="button"
            onClick={back}
            aria-label={step > 0 ? tr("Назад") : tr("Към избора")}
            className="border-border hover:border-foreground/40 grid size-10 shrink-0 place-items-center rounded-full border transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="flex-1">
            <div className="bg-border h-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                style={{ width: `${(Math.min(step + 1, STEPS.length) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {finished ? tr("Готово") : `${tr("{n} от {m}", { n: step + 1, m: STEPS.length })} · ${tr(STEPS[step])}`}
            </p>
          </div>
        </div>

        {step === 0 ? (
          <Step eyebrow={tr("Въпросник")} title={tr("Какво искаш да направим?")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((p) => (
                <Choice key={p.id} label={tr(p.label)} hint={tr(p.hint)} selected={answers.projectType === p.id} onClick={() => answer("projectType", p.id, 1)} />
              ))}
            </div>
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title={tr("Имаш ли сайт сега?")}>
            <div className="grid gap-3">
              {HAS_SITE.map((o) => (
                <Choice key={o} label={tr(o)} selected={answers.hasSite === o} onClick={() => answer("hasSite", o, o === HAS_SITE[0] ? 2 : 1)} />
              ))}
            </div>
            {answers.hasSite && answers.hasSite !== HAS_SITE[0] ? (
              <div className="mt-6">
                <label className="block">
                  <span className="text-sm font-medium">{tr("Линк към сайта")}</span>
                  <span className="text-muted-foreground">{tr(" · по желание")}</span>
                  <input type="url" inputMode="url" value={answers.siteUrl} onChange={(e) => answer("siteUrl", e.target.value)} placeholder="www.example.bg" className="field mt-2" />
                </label>
                <Button className="mt-5" onClick={() => update({ step: 2 })}>
                  {tr("Напред")} <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title={tr("Кога ти трябва?")}>
            <div className="grid gap-3">
              {WHEN.map((o) => (
                <Choice key={o} label={tr(o)} selected={answers.when === o} onClick={() => answer("when", o, 3)} />
              ))}
            </div>
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title={tr("Имаш ли бюджет наум?")} lead={tr("Не е задължително. Помага ни да предложим подходящото решение.")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET.map((o) => (
                <Choice key={o} label={tr(o)} selected={answers.budget === o} onClick={() => answer("budget", o, 4)} />
              ))}
            </div>
          </Step>
        ) : null}

        {finished ? (
          <Step eyebrow={tr("Готово")} title={tr("Как да разкажеш идеята си?")} lead={tr("Със свои думи, снимки и файлове. Или в разговор с асистента, който вече знае отговорите ти.")}>
            <AnswersStrip answers={answers} onEdit={() => update({ step: 0 })} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <SmallPath
                icon={<PenLine aria-hidden="true" className="size-5" />}
                title={tr("Опиши с думи")}
                lead={tr("Пишеш каквото искаш, прикачаш снимки, лого, PDF. Без въпроси.")}
                action={tr("Опиши идеята")}
                onClick={() => update({ mode: "describe" })}
              />
              <SmallPath
                icon={<Sparkles aria-hidden="true" className="size-5" />}
                title={tr("С асистента")}
                lead={tr("Разговор с готови отговори. Пита само за това, което още не знае.")}
                action={tr("Говори с асистента")}
                onClick={() => update({ mode: "chat" })}
              />
            </div>
          </Step>
        ) : null}

        {step > 0 ? (
          <button type="button" onClick={onRestart} className="text-muted-foreground hover:text-foreground mt-16 inline-flex items-center gap-2 text-sm transition-colors">
            <RotateCcw aria-hidden="true" className="size-3.5" /> {tr("Започни отначало")}
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
      <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.08] font-[300] tracking-[-0.04em] text-balance">{title}</h1>
      {lead ? <p className="text-muted-foreground mt-4 max-w-[46ch] text-lg text-pretty">{lead}</p> : null}
      <div className="mt-9">{children}</div>
    </section>
  );
}

function AnswersStrip({ answers, onEdit }: { answers: Answers; onEdit: () => void }) {
  const { tr } = useLang();
  const items = [projectTypeLabel(answers.projectType), answers.hasSite, answers.when, answers.budget].filter(Boolean).map((t) => tr(t));
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((t) => (
        <span key={t} className="border-border rounded-full border px-3.5 py-1.5 text-sm">
          {t}
        </span>
      ))}
      <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-foreground px-2 text-sm transition-colors">
        {tr("Промени")}
      </button>
    </div>
  );
}

function SmallPath({
  icon,
  title,
  lead,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  lead: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-border bg-surface hover:border-primary/60 flex flex-col rounded-3xl border p-6 text-left transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_var(--color-primary)]"
    >
      <span className="bg-surface-2 text-ice grid size-10 place-items-center rounded-xl">{icon}</span>
      <span className="font-display mt-5 block text-[1.375rem] leading-none font-[400] tracking-[-0.02em]">{title}</span>
      <span className="text-muted-foreground mt-2 block text-[0.9375rem] text-pretty">{lead}</span>
      <span className="group-hover:text-ice mt-5 inline-flex items-center gap-2 text-[0.9375rem] font-medium transition-colors">
        {action}
        <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
      </span>
    </button>
  );
}

// ---- files: pick, drop, paste, upload ----------------------------------------

/** Picks files, uploads them one by one and keeps the list. Without `upload`
    (the server not configured) it explains instead of silently doing nothing. */
function useFiles(upload: ((file: File) => Promise<string>) | undefined, initial: ChatFile[] = []) {
  const { tr } = useLang();
  const [files, setFiles] = React.useState<ChatFile[]>(initial);
  const [busy, setBusy] = React.useState(0);
  const [error, setError] = React.useState("");

  const add = React.useCallback(
    async (list: FileList | File[] | null) => {
      setError("");
      if (!upload) {
        setError(tr("Качването на файлове не е включено на този адрес. Ще работи на сайта."));
        return;
      }
      for (const file of Array.from(list ?? []).slice(0, 8)) {
        if (!ACCEPT.split(",").includes(file.type)) {
          setError(tr("Този файл не се поддържа. Пробвай снимка (JPG, PNG) или PDF."));
          continue;
        }
        if (file.size > MAX_FILE) {
          setError(tr("Файлът е над 10 MB."));
          continue;
        }
        setBusy((n) => n + 1);
        try {
          const path = await upload(file);
          setFiles((cur) => [...cur, { path, name: file.name, url: URL.createObjectURL(file) }]);
        } catch (e) {
          setError(errorText(e));
        } finally {
          setBusy((n) => n - 1);
        }
      }
    },
    [upload, tr],
  );
  const remove = React.useCallback((path: string) => setFiles((cur) => cur.filter((f) => f.path !== path)), []);
  const clear = React.useCallback(() => setFiles([]), []);
  return { files, add, remove, clear, busy, error };
}

/** The attach button: a gallery/file picker, plus the camera on phones. */
function AttachControls({ add, busy, highlight }: { add: (list: FileList | null) => void; busy: number; highlight?: boolean }) {
  const input = React.useRef<HTMLInputElement>(null);
  const camera = React.useRef<HTMLInputElement>(null);
  const { tr } = useLang();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
          highlight ? "border-ice text-ice" : "border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/50",
        )}
      >
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Paperclip aria-hidden="true" className="size-4" />}
        {busy ? tr("Качване…") : <><span className="hidden sm:inline">{tr("Снимки и файлове")}</span><span className="sm:hidden">{tr("Снимки")}</span></>}
      </button>
      <button
        type="button"
        onClick={() => camera.current?.click()}
        aria-label={tr("Снимай с камерата")}
        className="border-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/50 grid size-11 place-items-center rounded-full border transition-colors md:hidden"
      >
        <Camera aria-hidden="true" className="size-4" />
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ---- 3a. in your own words ---------------------------------------------------

function Describe({
  draft,
  update,
  ready,
  onSent,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  ready: { ready: boolean; ai: boolean } | null;
  onSent: (token: string) => void;
}) {
  const { tr } = useLang();
  const upload = ready?.ready ? (file: File) => uploadFile(file, { draftId: draft.draftId }) : undefined;
  const picker = useFiles(upload, draft.files);
  const [dragging, setDragging] = React.useState(false);

  // The picked files travel with the draft (the contact card sends them).
  React.useEffect(() => {
    update({ files: picker.files });
  }, [picker.files, update]);

  const setText = (description: string) =>
    update({ description, brief: { ...draft.brief, extra: description, summary: description.slice(0, 300) }, contact: true });

  return (
    <div className="px-5 pt-28 pb-24 sm:px-8 md:pt-36">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => update({ mode: "steps", step: STEPS.length })}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> {tr("Назад")}
          </button>
          <button
            type="button"
            onClick={() => update({ mode: "chat", contact: false })}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <Sparkles aria-hidden="true" className="size-3.5" /> {tr("По-добре с асистента")}
          </button>
        </div>

        <Step eyebrow={tr("Със свои думи")} title={tr("Разкажи ни идеята си.")} lead={tr("Какъв е бизнесът, какво трябва да постигне проектът, какво харесваш. Пиши както би го казал на приятел.")}>
          <AnswersStrip answers={draft.answers} onEdit={() => update({ mode: "steps", step: 0 })} />

          <div
            className={cn(
              "border-border bg-surface mt-6 rounded-[1.75rem] border p-3 transition-colors focus-within:border-foreground/30",
              dragging && "border-ice",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void picker.add(e.dataTransfer.files);
            }}
          >
            <textarea
              value={draft.description}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => {
                const pasted = Array.from(e.clipboardData.files ?? []);
                if (pasted.length) {
                  e.preventDefault();
                  void picker.add(pasted);
                }
              }}
              rows={7}
              placeholder={tr("Напр. „Имам козметично студио в Пловдив. Искам хората да виждат цените и да си записват час онлайн. Харесвам как изглежда…“")}
              aria-label={tr("Идеята ти")}
              className="placeholder:text-muted-foreground/60 block w-full resize-y bg-transparent px-3 py-2.5 text-[1.0625rem] leading-relaxed outline-none"
            />
            {picker.files.length ? (
              <div className="px-2 pt-1 pb-3">
                <Files files={picker.files} onRemove={picker.remove} />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
              <AttachControls add={(l) => void picker.add(l)} busy={picker.busy} />
              <span className="text-muted-foreground text-xs">{tr("Снимки, лого, PDF · до 10 MB · може и с влачене")}</span>
            </div>
            {picker.error ? <p className="text-destructive px-2 pt-2 text-xs">{picker.error}</p> : null}
          </div>
        </Step>

        <ContactCard draft={draft} update={update} disabled={ready !== null && !ready.ready} onSent={onSent} requireText />
      </div>
    </div>
  );
}

// ---- 3b. the chat ------------------------------------------------------------

function Chat({
  draft,
  update,
  ready,
  onRestart,
  onSent,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  ready: { ready: boolean; ai: boolean } | null;
  onRestart: () => void;
  onSent: (token: string) => void;
}) {
  const { tr, lang } = useLang();
  const [streaming, setStreaming] = React.useState<string | null>(null);
  const [briefing, setBriefing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const end = React.useRef<HTMLDivElement>(null);
  const abort = React.useRef<AbortController | null>(null);
  const urls = React.useMemo(() => new Map(draft.files.map((f) => [f.path, f])), [draft.files]);

  // The consultant is on unless the server says otherwise.
  const ai = ready === null ? true : ready.ai;
  const hasAnswers = Boolean(draft.answers.projectType || draft.answers.hasSite || draft.answers.when || draft.answers.budget);
  const busy = streaming !== null;

  /** Asks the consultant to answer `conversation`, streaming the words in. */
  const reply = React.useCallback(
    async (conversation: AiTurn[], answers: Answers) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setStreaming("");
      setError("");
      let text = "";
      try {
        text = await streamAi(draft.draftId, answers, conversation, lang, (piece) => {
          text += piece;
          setStreaming(text);
        }, controller.signal);
        update({ conversation: [...conversation, { role: "ai", text }] });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Keep whatever arrived; the client can retry.
        if (text.trim()) update({ conversation: [...conversation, { role: "ai", text: text.replace(/\n\n\[грешка\]$/, "").trim() }] });
        else update({ conversation });
        setError(errorText(e));
      } finally {
        if (abort.current === controller) setStreaming(null);
      }
    },
    [draft.draftId, update, lang],
  );

  React.useEffect(() => () => abort.current?.abort(), []);

  // After the questionnaire the consultant opens with a line that already
  // knows the answers. Without the consultant, the scripted questions start.
  const opened = React.useRef(false);
  React.useEffect(() => {
    if (opened.current || draft.conversation.length || ready === null) return;
    opened.current = true;
    if (!ready.ai) update({ conversation: [{ role: "ai", text: tr(FALLBACK[0].text) }], fallbackStep: 0 });
    else if (hasAnswers) void reply([], draft.answers);
  }, [ready, draft.conversation.length, hasAnswers, draft.answers, reply, update, tr]);

  /** One client message, from the box or a starter. */
  const send = async (text: string, files: ChatFile[] = []) => {
    if (busy) return;
    const turn: AiTurn = { role: "client", text, files: files.map((f) => f.path) };
    const conversation = [...draft.conversation, turn];

    if (!ai) {
      const q = FALLBACK[draft.fallbackStep];
      const brief = q ? { ...draft.brief, [q.key]: text } : draft.brief;
      const next = Math.min(draft.fallbackStep + 1, FALLBACK.length);
      const finished = next >= FALLBACK.length;
      update({
        conversation: finished ? conversation : [...conversation, { role: "ai", text: tr(FALLBACK[next].text) }],
        brief: { ...brief, summary: brief.summary || brief.goal || brief.business },
        files: [...draft.files, ...files],
        fallbackStep: next,
        done: finished,
      });
      return;
    }

    update({ conversation, files: [...draft.files, ...files] });
    await reply(conversation, draft.answers);
  };

  /** Done talking: the consultant writes the brief, then name and e-mail. */
  const finish = async () => {
    if (busy || briefing) return;
    if (!ai) {
      update({ contact: true, brief: { ...draft.brief, summary: draft.brief.summary || lastClientText(draft) } });
      return;
    }
    setBriefing(true);
    setError("");
    try {
      const r = await briefAi(draft.draftId, draft.answers, draft.conversation, lang);
      update({
        conversation: r.reply ? [...draft.conversation, { role: "ai", text: r.reply }] : draft.conversation,
        brief: r.brief,
        done: true,
        contact: true,
      });
    } catch (e) {
      // The brief can be written by the founder too; let the client continue.
      update({ contact: true, brief: { ...draft.brief, summary: draft.brief.summary || lastClientText(draft) } });
      setError(errorText(e));
    } finally {
      setBriefing(false);
    }
  };

  React.useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [draft.conversation.length, streaming, draft.done, draft.contact, briefing]);

  const aiTurns = draft.conversation.filter((t) => t.role === "ai").length;
  const lastIsClient = draft.conversation[draft.conversation.length - 1]?.role === "client";
  const showContact = draft.done || draft.contact;
  const empty = !draft.conversation.length && !busy;
  const upload = ready?.ready ? (file: File) => uploadFile(file, { draftId: draft.draftId }) : undefined;

  return (
    <div
      className="relative flex min-h-svh flex-col pt-16 md:pt-[4.5rem]"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        window.dispatchEvent(new CustomEvent<FileList>("1333-drop", { detail: e.dataTransfer.files }));
      }}
    >
      {dragging ? (
        <div className="bg-background/80 pointer-events-none fixed inset-0 z-[150] grid place-items-center backdrop-blur-sm">
          <div className="border-ice text-ice rounded-3xl border-2 border-dashed px-10 py-8 text-center">
            <ImagePlus aria-hidden="true" className="mx-auto size-8" />
            <p className="mt-3 text-lg font-medium">{tr("Пусни файловете тук")}</p>
            <p className="text-muted-foreground mt-1 text-sm">{tr("Снимки и PDF до 10 MB")}</p>
          </div>
        </div>
      ) : null}

      {/* Top strip */}
      <div className="border-border bg-background/85 sticky top-16 z-20 border-b backdrop-blur-md md:top-[4.5rem]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar />
            <div className="min-w-0">
              <p className="truncate font-medium">{tr("Консултантът на 13:33")}</p>
              <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                <span className="bg-ice relative inline-flex size-1.5 shrink-0 rounded-full" />
                {ai ? tr("AI · само за сайтове и дигитални проекти") : tr("Кратък въпросник · консултантът почива")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            {hasAnswers ? (
              <button type="button" onClick={() => update({ mode: "steps", step: STEPS.length })} className="text-muted-foreground hover:text-foreground hidden transition-colors sm:inline">
                {tr("Отговорите")}
              </button>
            ) : null}
            <button type="button" onClick={onRestart} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
              <RotateCcw aria-hidden="true" className="size-3.5" /> {tr("Отначало")}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 pb-6 sm:px-8" aria-live="polite">
        {hasAnswers ? (
          <div className="mb-8">
            <AnswersStrip answers={draft.answers} onEdit={() => update({ mode: "steps", step: 0 })} />
          </div>
        ) : null}

        {ai && !hasAnswers ? <Line role="ai" text={tr(OPENER)} /> : null}

        {draft.conversation.map((t, i) => (
          <Line
            key={i}
            role={t.role}
            text={t.text}
            files={(t.files ?? []).map((p) => urls.get(p) ?? { path: p, name: p.split("/").pop() ?? p })}
          />
        ))}

        {streaming !== null ? <Line role="ai" text={streaming} live /> : null}

        {briefing ? (
          <div className="my-5 flex items-start gap-4">
            <Avatar />
            <p className="text-muted-foreground flex items-center gap-2 py-2 text-[0.9375rem]">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {tr("Подреждам брифа…")}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="border-destructive/40 my-5 rounded-2xl border p-4 text-sm">
            <p>{error}</p>
            {lastIsClient || (hasAnswers && !draft.conversation.length) ? (
              <button type="button" onClick={() => void reply(draft.conversation, draft.answers)} className="border-foreground/20 hover:border-foreground/60 mt-3 rounded-full border px-4 py-2 text-sm transition-colors">
                {tr("Опитай пак")}
              </button>
            ) : null}
          </div>
        ) : null}

        {empty && ai && !hasAnswers ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-3 md:pl-14">
            {STARTERS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(tr(q))}
                className="border-border bg-surface hover:border-primary/60 rounded-2xl border px-4 py-3.5 text-left text-[0.9375rem] leading-snug transition-[border-color,transform] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
              >
                {tr(q)}
              </button>
            ))}
          </div>
        ) : null}

        {draft.done ? <BriefCard brief={draft.brief} className="mt-8" /> : null}

        {showContact ? <ContactCard draft={draft} update={update} disabled={ready !== null && !ready.ready} onSent={onSent} /> : null}

        <div ref={end} className="h-2" />
      </div>

      {/* The box: big, with pictures and files, always within reach. */}
      <div className="bg-background/85 sticky bottom-0 z-20 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-5 pt-3 sm:px-8">
          <BigComposer
            placeholder={showContact ? tr("Искаш да добавиш нещо?") : tr("Напиши съобщение…")}
            disabled={busy || briefing}
            upload={upload}
            onSend={(text, files) => send(text, files)}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
            <p className="text-muted-foreground text-xs">{tr("Цената и срокът ти ги пише основателят, лично.")}</p>
            {!showContact && (aiTurns >= 1 || !ai) && draft.conversation.some((t) => t.role === "client") ? (
              <button
                type="button"
                onClick={() => void finish()}
                disabled={busy || briefing}
                className="text-ice hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-40"
              >
                {tr("Готово, изпрати запитването")} <ArrowRight aria-hidden="true" className="size-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const lastClientText = (d: Draft) => [...d.conversation].reverse().find((t) => t.role === "client")?.text ?? "";

function Avatar() {
  return (
    <span className="from-ice to-peach text-background grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br font-display text-[0.8rem] font-[700] tracking-[-0.04em]">
      13
    </span>
  );
}

/** One line of the chat: the consultant as plain text beside its mark, the client in a bubble on the right. */
function Line({ role, text, files = [], live }: { role: "ai" | "client"; text: string; files?: ChatFile[]; live?: boolean }) {
  const { tr } = useLang();
  const mine = role === "client";
  if (!mine) {
    return (
      <div className="my-6 flex items-start gap-4">
        <Avatar />
        <div className="min-w-0 flex-1 pt-1.5">
          {text ? (
            <Rich text={text} live={live} />
          ) : live ? (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[0.9375rem]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="bg-muted-foreground size-1.5 animate-pulse rounded-full" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
              <span className="ml-1">{tr("мисли…")}</span>
            </span>
          ) : null}
          {files.length ? <div className="mt-3"><Files files={files} /></div> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="my-5 flex flex-row-reverse items-start gap-4">
      <div className="flex max-w-[88%] flex-col items-end gap-2 md:max-w-[80%]">
        {text ? (
          <div className="bg-foreground/10 rounded-3xl rounded-tr-md px-5 py-3.5 text-[1.0625rem] leading-relaxed whitespace-pre-wrap">{text}</div>
        ) : null}
        {files.length ? <Files files={files} /> : null}
      </div>
    </div>
  );
}

/** Light formatting for the consultant's words: paragraphs, lists, **bold**. */
function Rich({ text, live }: { text: string; live?: boolean }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className={cn("space-y-3 text-[1.0625rem] leading-relaxed", live && "rich-live")}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        const bullet = lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (bullet) {
          const ordered = /^\s*\d+[.)]\s+/.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={cn("space-y-1.5 pl-5", ordered ? "list-decimal" : "list-disc", "marker:text-ice")}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^\s*([-*•]|\d+[.)])\s+/, "")} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            <Inline text={block.replace(/^#{1,3}\s+/, "")} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

function Files({ files, onRemove }: { files: ChatFile[]; onRemove?: (path: string) => void }) {
  const { tr } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f) => {
        const image = /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.path);
        return (
          <span key={f.path} className="relative">
            {image && f.url ? (
              <img src={f.url} alt={f.name} className="border-border size-32 rounded-2xl border object-cover md:size-40" loading="lazy" />
            ) : (
              <span className="bg-surface-2 border-border flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-2xl border px-3 text-center text-xs">
                <FileText aria-hidden="true" className="size-5" />
                <span className="line-clamp-2 break-all">{f.name}</span>
              </span>
            )}
            {onRemove ? (
              <button
                type="button"
                aria-label={tr("Махни {name}", { name: f.name })}
                onClick={() => onRemove(f.path)}
                className="bg-background border-border absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

/** The message box: text, pictures and files (pick, drop or paste), one send. */
function BigComposer({
  onSend,
  upload,
  placeholder,
  highlightAttach,
  disabled,
}: {
  onSend: (text: string, files: ChatFile[]) => Promise<void> | void;
  upload?: (file: File) => Promise<string>;
  placeholder: string;
  highlightAttach?: boolean;
  disabled?: boolean;
}) {
  const { tr } = useLang();
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const area = React.useRef<HTMLTextAreaElement>(null);
  const { files, add, remove, clear, busy, error } = useFiles(upload);

  // Files dropped anywhere on the page land here.
  React.useEffect(() => {
    const onDrop = (e: Event) => void add((e as CustomEvent<FileList>).detail);
    window.addEventListener("1333-drop", onDrop);
    return () => window.removeEventListener("1333-drop", onDrop);
  }, [add]);

  const send = async () => {
    if (sending || disabled || busy || (!text.trim() && !files.length)) return;
    setSending(true);
    try {
      await onSend(text.trim(), files);
      setText("");
      clear();
      if (area.current) area.current.style.height = "auto";
    } finally {
      setSending(false);
      area.current?.focus();
    }
  };

  return (
    <div className="border-border bg-surface rounded-[1.75rem] border p-3 shadow-[0_24px_60px_-30px_var(--color-primary)] focus-within:border-foreground/30">
      {files.length ? (
        <div className="px-2 pt-2 pb-3">
          <Files files={files} onRemove={remove} />
        </div>
      ) : null}
      <textarea
        ref={area}
        value={text}
        rows={2}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
        }}
        onPaste={(e) => {
          const pasted = Array.from(e.clipboardData.files ?? []);
          if (pasted.length) {
            e.preventDefault();
            void add(pasted);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send();
          }
        }}
        aria-label={placeholder}
        className="placeholder:text-muted-foreground/70 block min-h-16 w-full resize-none bg-transparent px-3 py-2.5 text-[1.0625rem] leading-relaxed outline-none"
      />
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex min-w-0 flex-col">
          <AttachControls add={(l) => void add(l)} busy={busy} highlight={highlightAttach} />
          {error ? <span className="text-destructive mt-1 px-1 text-xs">{error}</span> : null}
        </div>
        <RainbowButton onClick={() => void send()} disabled={sending || disabled || busy > 0 || (!text.trim() && !files.length)} aria-label={tr("Изпрати")}>
          {tr("Изпрати")}
          {sending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowUp aria-hidden="true" className="size-4" />}
        </RainbowButton>
      </div>
    </div>
  );
}

// ---- contact, inside the chat -----------------------------------------------

function ContactCard({
  draft,
  update,
  disabled,
  onSent,
  requireText,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  disabled: boolean;
  onSent: (token: string) => void;
  /** The describe path: the idea itself has to be written. */
  requireText?: boolean;
}) {
  const { tr } = useLang();
  const [consent, setConsent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim());
  const ok = draft.name.trim().length > 1 && emailOk && consent && (!requireText || draft.description.trim().length > 10);

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
    <section aria-label={tr("Контакт")} className="border-border bg-surface ww-rise mt-8 rounded-3xl border p-6 md:p-8">
      <p className="eyebrow mb-3">{tr("Последно")}</p>
      <h2 className="font-display text-title font-[500] tracking-[-0.025em]">{tr("Как да ти пишем?")}</h2>
      <p className="text-muted-foreground mt-2 text-[0.9375rem] text-pretty">
        {tr("Ще получиш личен чат на сайта. Там основателят ти пише цената, срока и капарото.")}
      </p>

      <form onSubmit={send} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">{tr("Име")}</span>
            <input value={draft.name} onChange={(e) => update({ name: e.target.value })} autoComplete="name" className="field mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{tr("Имейл")}</span>
            <input
              type="email"
              inputMode="email"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
              autoComplete="email"
              aria-invalid={Boolean(draft.email) && !emailOk}
              className="field mt-2"
            />
            {draft.email && !emailOk ? <span className="text-destructive mt-1 block text-sm">{tr("Провери имейла.")}</span> : null}
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">{tr("Телефон")}</span>
          <span className="text-muted-foreground text-sm">{tr(" · по желание")}</span>
          <input type="tel" inputMode="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} autoComplete="tel" className="field mt-2" />
        </label>

        <ul className="text-muted-foreground space-y-2 text-[0.9375rem]">
          {[requireText ? "Основателят чете описанието ти." : "Основателят преглежда разговора.", "Пише ти в личния чат: крайна цена, срок и капаро.", "Приемаш офертата, плащаш капарото и започваме."].map((t) => tr(t)).map((t) => (
            <li key={t} className="flex gap-2.5">
              <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <DepositNote />

        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-primary mt-1 size-4 shrink-0" />
          <span className="text-muted-foreground">{tr("Съгласен/на съм 13:33 да използва тези данни и файлове, за да отговори на запитването ми.")}</span>
        </label>

        {disabled ? (
          <p className="text-destructive text-sm">
            {tr("Онлайн запитванията още не са включени.")}
            {site.contactEmail ? (
              <>
                {" "}{tr("Пиши ни на")} <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
              </>
            ) : null}
          </p>
        ) : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <RainbowButton type="submit" disabled={!ok || pending || disabled}>
            {pending ? tr("Изпращане…") : tr("Изпрати и отвори чата")}
            {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
          </RainbowButton>
          <Link to="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            {tr("Към началото")}
          </Link>
        </div>
      </form>
    </section>
  );
}
