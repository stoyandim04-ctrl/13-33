import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Mail, TriangleAlert } from "lucide-react";

import {
  budgetOptions,
  site,
  solutionOptions,
  timelineOptions,
} from "@/data/content";
import {
  emptyBrief,
  getAiBriefClient,
  inquiryToText,
  isInquiryConfigured,
  submitInquiry,
  type Inquiry,
  type ProjectBrief,
  type SubmitResult,
} from "@/lib/brief";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AiBriefChat } from "@/components/sections/ai-brief-chat";

type Mode = "short" | "brief";

interface Fields {
  name: string;
  contact: string;
  business: string;
  solution: string[];
  description: string;
  budget: string;
  timeline: string;
  consent: boolean;
}

const initial: Fields = {
  name: "",
  contact: "",
  business: "",
  solution: [],
  description: "",
  budget: "",
  timeline: "",
  consent: false,
};

type Errors = Partial<Record<keyof Fields, string>>;

function validate(f: Fields, needsDescription: boolean): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Как да се обръщаме към теб?";
  const c = f.contact.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
  const phone = /^[+()\d\s-]{7,}$/.test(c);
  if (!c) e.contact = "Остави имейл или телефон.";
  else if (!email && !phone) e.contact = "Провери имейла или телефона.";
  if (!f.business.trim()) e.business = "Напиши името на бизнеса или линк към сайта.";
  if (!f.solution.length) e.solution = "Избери поне една посока — или „Още не съм сигурен“.";
  if (needsDescription && f.description.trim().length < 10)
    e.description = "Разкажи ни с няколко изречения.";
  if (!f.consent) e.consent = "Нужно е съгласие, за да можем да ти отговорим.";
  return e;
}

export function Contact() {
  const [mode, setMode] = React.useState<Mode>("short");
  const [fields, setFields] = React.useState<Fields>(initial);
  const [brief, setBrief] = React.useState<ProjectBrief>(emptyBrief);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<SubmitResult | null>(null);
  const [sentText, setSentText] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const aiClient = React.useMemo(() => getAiBriefClient(), []);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };
  const setB = <K extends keyof ProjectBrief>(key: K, value: ProjectBrief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // In brief mode the brief carries the problem and goals, so the short
  // description is optional there.
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const merged: Fields =
      mode === "brief"
        ? {
            ...fields,
            business: fields.business || brief.business,
            solution: fields.solution.length ? fields.solution : brief.requestedSolution,
            budget: fields.budget || brief.budgetSignal,
            timeline: fields.timeline || brief.timeline,
          }
        : fields;
    const e = validate(merged, mode === "short");
    setErrors(e);
    const firstKey = Object.keys(e)[0];
    if (firstKey) {
      formRef.current
        ?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
        ?.focus();
      return;
    }
    const inquiry: Inquiry = {
      name: merged.name.trim(),
      contact: merged.contact.trim(),
      business: merged.business.trim(),
      solution: merged.solution,
      description:
        merged.description.trim() ||
        [brief.currentProblem, brief.desiredOutcome].filter(Boolean).join("\n\n"),
      budget: merged.budget || undefined,
      timeline: merged.timeline || undefined,
      consent: merged.consent,
      brief:
        mode === "brief"
          ? { ...brief, name: merged.name.trim(), summary: brief.summary || merged.description.trim() }
          : undefined,
    };
    setPending(true);
    const res = await submitInquiry(inquiry);
    setPending(false);
    setSentText(inquiryToText(inquiry));
    setResult(res);
    if (res.status === "sent") setFields(initial);
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  const briefSteps = [
    { title: "Бизнесът", done: Boolean(brief.business && brief.industry) },
    { title: "Целта", done: Boolean(brief.currentProblem || brief.desiredOutcome) },
    { title: "Решението", done: brief.requestedSolution.length > 0 },
    { title: "Контакт", done: false },
  ];

  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="section">
      <div className="container-wide grid gap-16 lg:grid-cols-12 lg:gap-10">
        <header className="lg:col-span-4">
          <p className="eyebrow mb-5">Започни проект</p>
          <h2 id="kontakt-title" className="font-display text-heading font-[300] tracking-[-0.025em] text-balance">
            Какво искаш да създадем?
          </h2>
          <p className="text-lead text-muted-foreground mt-6 max-w-[32ch] text-pretty">
            Разкажи ни за бизнеса си и какво искаш да постигнеш.
          </p>
          <ul className="text-muted-foreground mt-10 space-y-3 text-[0.9375rem]">
            <li className="flex gap-3">
              <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
              Четем всяко запитване лично.
            </li>
            <li className="flex gap-3">
              <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
              Първият разговор е за разбиране, без ангажимент.
            </li>
            <li className="flex gap-3">
              <Check aria-hidden="true" className="text-ice mt-1 size-4 shrink-0" />
              Бюджет и срок не са задължителни.
            </li>
          </ul>
        </header>

        <div className="lg:col-span-7 lg:col-start-6">
          {/* Mode switch */}
          <div role="tablist" aria-label="Начин на запитване" className="border-border mb-10 inline-flex rounded-full border p-1">
            {(
              [
                ["short", "Кратко запитване"],
                ["brief", "Подробен бриф"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setErrors({});
                  setResult(null);
                }}
                className={cn(
                  "h-10 rounded-full px-5 text-sm font-medium transition-colors",
                  mode === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {text}
              </button>
            ))}
          </div>

          {result ? (
            <ResultPanel
              ref={resultRef}
              result={result}
              text={sentText}
              onBack={() => setResult(null)}
            />
          ) : (
            <form ref={formRef} noValidate onSubmit={onSubmit} aria-describedby={!isInquiryConfigured() ? "send-note" : undefined}>
              {mode === "brief" ? (
                <div className="mb-12">
                  <p className="text-muted-foreground max-w-[52ch] text-[0.9375rem]">
                    Въпросник в няколко стъпки, който подрежда проекта в структуриран бриф.
                    Попълни каквото знаеш — празните полета остават празни, нищо не се допълва вместо теб.
                  </p>
                  {aiClient ? <AiBriefChat client={aiClient} onBrief={(b) => setBrief((cur) => ({ ...cur, ...b, source: "ai-assistant" }))} /> : null}

                  <ol className="mt-8 flex gap-2" aria-label="Стъпки">
                    {briefSteps.map((s, i) => (
                      <li key={s.title} className="flex-1">
                        <button
                          type="button"
                          onClick={() => setStep(i)}
                          aria-current={step === i ? "step" : undefined}
                          className="group block w-full text-left"
                        >
                          <span className={cn("block h-px w-full transition-colors", i <= step ? "bg-ice" : "bg-border")} />
                          <span className={cn("mt-3 block text-xs tracking-[0.16em] uppercase", step === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                            {s.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-10 space-y-8" hidden={step !== 0}>
                    <Field label="Име на бизнеса" value={brief.business} onChange={(v) => setB("business", v)} />
                    <Field label="Сфера" hint="Напр. клиника, онлайн коуч, ресторант, производство" value={brief.industry} onChange={(v) => setB("industry", v)} />
                    <Field label="Настоящ сайт или профил" optional value={brief.currentWebsite} onChange={(v) => setB("currentWebsite", v)} />
                  </div>
                  <div className="mt-10 space-y-8" hidden={step !== 1}>
                    <Field label="Какво не работи сега?" textarea value={brief.currentProblem} onChange={(v) => setB("currentProblem", v)} />
                    <Field label="Какъв резултат искаш?" hint="Напр. повече запитвания, онлайн продажби, по-малко ръчна работа" textarea value={brief.desiredOutcome} onChange={(v) => setB("desiredOutcome", v)} />
                  </div>
                  <div className="mt-10 space-y-10" hidden={step !== 2}>
                    <Chips
                      legend="Какво решение търсиш?"
                      options={solutionOptions}
                      value={brief.requestedSolution}
                      onToggle={(v) => setB("requestedSolution", toggle(brief.requestedSolution, v))}
                    />
                    <Chips
                      legend="Нужни функции"
                      optional
                      options={["Форма за запитване", "Записване на час", "Плащания", "Вход за клиенти", "Блог / новини", "Многоезичност", "Интеграция с CRM", "Автоматични известия"]}
                      value={brief.requiredFeatures}
                      onToggle={(v) => setB("requiredFeatures", toggle(brief.requiredFeatures, v))}
                    />
                    <Chips
                      legend="Какво вече имаш?"
                      optional
                      options={["Лого", "Бранд насоки", "Текстове", "Снимки / видео", "Домейн", "Хостинг"]}
                      value={brief.existingAssets}
                      onToggle={(v) => setB("existingAssets", toggle(brief.existingAssets, v))}
                    />
                    <div className="grid gap-8 sm:grid-cols-3">
                      <Select label="Срок" optional options={timelineOptions} value={brief.timeline} onChange={(v) => setB("timeline", v)} />
                      <Select label="Бюджет" optional options={budgetOptions} value={brief.budgetSignal} onChange={(v) => setB("budgetSignal", v)} />
                      <Select label="Спешност" optional options={["Не е спешно", "В следващите седмици", "Спешно"]} value={brief.urgency} onChange={(v) => setB("urgency", v)} />
                    </div>
                  </div>

                  <div className="mt-10 flex items-center justify-between" hidden={step === 3}>
                    <Button variant="ghost" size="sm" className="px-0" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                      <ArrowLeft aria-hidden="true" /> Назад
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                      Напред <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {(mode === "short" || step === 3) && (
                <div className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <Field name="name" label="Име" value={fields.name} error={errors.name} autoComplete="name" onChange={(v) => set("name", v)} />
                    <Field name="contact" label="Имейл или телефон" value={fields.contact} error={errors.contact} autoComplete="email" onChange={(v) => set("contact", v)} />
                  </div>
                  {mode === "short" ? (
                    <>
                      <Field name="business" label="Бизнес / сайт" hint="Име на бизнеса или линк" value={fields.business} error={errors.business} autoComplete="organization" onChange={(v) => set("business", v)} />
                      <Chips
                        name="solution"
                        legend="Желано решение"
                        options={solutionOptions}
                        value={fields.solution}
                        error={errors.solution}
                        onToggle={(v) => set("solution", toggle(fields.solution, v))}
                      />
                      <Field name="description" label="Описание" hint="Какво правиш и какво искаш да постигнеш" textarea value={fields.description} error={errors.description} onChange={(v) => set("description", v)} />
                      <div className="grid gap-8 sm:grid-cols-2">
                        <Select label="Бюджет" optional options={budgetOptions} value={fields.budget} onChange={(v) => set("budget", v)} />
                        <Select label="Срок" optional options={timelineOptions} value={fields.timeline} onChange={(v) => set("timeline", v)} />
                      </div>
                    </>
                  ) : (
                    <>
                      {!brief.business ? (
                        <Field name="business" label="Бизнес / сайт" value={fields.business} error={errors.business} onChange={(v) => set("business", v)} />
                      ) : null}
                      {!brief.requestedSolution.length ? (
                        <Chips name="solution" legend="Желано решение" options={solutionOptions} value={fields.solution} error={errors.solution} onToggle={(v) => set("solution", toggle(fields.solution, v))} />
                      ) : null}
                      <Field name="description" label="Нещо друго, което да знаем?" optional textarea value={fields.description} onChange={(v) => set("description", v)} />
                      <BriefPreview brief={brief} />
                    </>
                  )}

                  <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
                    <input
                      type="checkbox"
                      data-field="consent"
                      checked={fields.consent}
                      onChange={(e) => set("consent", e.target.checked)}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={errors.consent ? "consent-error" : undefined}
                      className="accent-primary mt-1 size-4 shrink-0"
                    />
                    <span className="text-muted-foreground">
                      Съгласен/на съм 13:33 да използва тези данни, за да отговори на запитването ми.
                      {errors.consent ? (
                        <span id="consent-error" className="text-destructive mt-1 block text-sm">
                          {errors.consent}
                        </span>
                      ) : null}
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
                    <Button type="submit" disabled={pending}>
                      {pending ? "Изпращане…" : "Изпрати запитването"}
                      {!pending ? <ArrowRight aria-hidden="true" /> : null}
                    </Button>
                    {mode === "brief" ? (
                      <Button variant="ghost" size="sm" className="px-0" onClick={() => setStep(2)}>
                        <ArrowLeft aria-hidden="true" /> Назад към брифа
                      </Button>
                    ) : null}
                  </div>
                  {!isInquiryConfigured() ? (
                    <p id="send-note" className="text-muted-foreground/80 text-sm">
                      Тестова версия: изпращането още не е свързано със сървър. Ще видиш точно какво
                      би било изпратено и ще можеш да го копираш.
                    </p>
                  ) : null}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- pieces ---------------------------------------------------------------

const inputBase =
  "w-full border-0 border-b border-foreground/20 bg-transparent px-0 py-3 text-[1.0625rem] text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-ice focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-destructive";

function Field({
  label,
  hint,
  value,
  onChange,
  error,
  textarea,
  optional,
  name,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
  optional?: boolean;
  name?: string;
  autoComplete?: string;
}) {
  const id = React.useId();
  const described = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    value,
    "data-field": name,
    "aria-invalid": Boolean(error),
    "aria-describedby": described,
    autoComplete,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-4 text-sm font-medium">
        {label}
        {optional ? <span className="text-muted-foreground text-xs font-normal">по желание</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground mt-1 text-sm">
          {hint}
        </p>
      ) : null}
      {textarea ? (
        <textarea {...common} rows={4} className={cn(inputBase, "resize-y")} />
      ) : (
        <input {...common} type="text" className={inputBase} />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
  optional,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-4 text-sm font-medium">
        {label}
        {optional ? <span className="text-muted-foreground text-xs font-normal">по желание</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, "cursor-pointer appearance-none bg-[length:12px] bg-[right_0.25rem_center] bg-no-repeat pr-6", "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M2 4l4 4 4-4%22 fill=%22none%22 stroke=%22%23A7ABB5%22 stroke-width=%221.4%22/></svg>')]")}
      >
        <option value="" className="bg-surface">—</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chips({
  legend,
  options,
  value,
  onToggle,
  error,
  optional,
  name,
}: {
  legend: string;
  options: readonly string[];
  value: string[];
  onToggle: (v: string) => void;
  error?: string;
  optional?: boolean;
  name?: string;
}) {
  const id = React.useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="flex w-full items-baseline justify-between gap-4 text-sm font-medium">
        {legend}
        {optional ? <span className="text-muted-foreground text-xs font-normal">по желание</span> : null}
      </legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o, i) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              data-field={i === 0 ? name : undefined}
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm transition-colors",
                on
                  ? "border-ice bg-ice/10 text-foreground"
                  : "border-foreground/15 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-destructive mt-3 text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function BriefPreview({ brief }: { brief: ProjectBrief }) {
  const rows: [string, string][] = [
    ["Бизнес", brief.business],
    ["Сфера", brief.industry],
    ["Настоящ сайт", brief.currentWebsite],
    ["Текущ проблем", brief.currentProblem],
    ["Желан резултат", brief.desiredOutcome],
    ["Решение", brief.requestedSolution.join(", ")],
    ["Функции", brief.requiredFeatures.join(", ")],
    ["Налични материали", brief.existingAssets.join(", ")],
    ["Срок", brief.timeline],
    ["Бюджет", brief.budgetSignal],
    ["Спешност", brief.urgency],
  ];
  return (
    <div className="bg-surface border-border rounded-md border p-6">
      <p className="eyebrow mb-4">Твоят бриф</p>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={cn("whitespace-pre-line", !v && "text-muted-foreground/50")}>{v || "не е посочено"}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

const ResultPanel = React.forwardRef<
  HTMLDivElement,
  { result: SubmitResult; text: string; onBack: () => void }
>(function ResultPanel({ result, text, onBack }, ref) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (result.status === "sent") {
    return (
      <div ref={ref} tabIndex={-1} role="status" className="border-ice/40 rounded-md border p-8 outline-none">
        <Check aria-hidden="true" className="text-ice size-6" />
        <p className="font-display text-title mt-4 font-[350]">Получихме запитването ти.</p>
        <p className="text-muted-foreground mt-3 max-w-[48ch]">Ще се свържем с теб на посочения контакт.</p>
        <Button variant="outline" size="sm" className="mt-6" onClick={onBack}>
          Ново запитване
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref} tabIndex={-1} role="alert" className="border-border rounded-md border p-8 outline-none">
      <TriangleAlert aria-hidden="true" className="text-ice size-6" />
      <p className="font-display text-title mt-4 font-[350]">
        {result.status === "not-configured" ? "Запитването не е изпратено." : "Не успяхме да изпратим запитването."}
      </p>
      <p className="text-muted-foreground mt-3 max-w-[52ch]">
        {result.status === "not-configured"
          ? "Формата още не е свързана със сървър. Данните ти са запазени тук — можеш да ги копираш или изпратиш по имейл."
          : `${result.message} Опитай отново или изпрати данните по имейл.`}
      </p>
      <pre className="bg-surface text-muted-foreground mt-6 max-h-64 overflow-auto rounded-md p-4 font-sans text-sm whitespace-pre-wrap">{text}</pre>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Копирано" : "Копирай"}
        </Button>
        {site.contactEmail ? (
          <a
            href={`mailto:${site.contactEmail}?subject=${encodeURIComponent("Запитване от сайта")}&body=${encodeURIComponent(text)}`}
            className="border-foreground/25 hover:border-foreground/60 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium"
          >
            <Mail aria-hidden="true" className="size-4" /> Изпрати по имейл
          </a>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> Обратно към формата
        </Button>
      </div>
    </div>
  );
});
