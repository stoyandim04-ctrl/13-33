// Pieces shared by the start flow, the client's page and the studio panel.
import * as React from "react";
import { Check, FileText, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { fmtDateTime } from "@/lib/inquiry-api";
import { BRIEF_LABELS, STATUS_STEPS, type Brief, type ChatFile, type InquiryStatus } from "@/lib/inquiry-shared";

/** A big, tappable answer. */
export function Choice({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors",
        selected ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40 bg-surface",
      )}
    >
      <span>
        <span className="block text-[1.0625rem] font-medium">{label}</span>
        {hint ? <span className="text-muted-foreground mt-0.5 block text-sm">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "bg-primary border-primary" : "border-foreground/20 group-hover:border-foreground/50",
        )}
      >
        {selected ? <Check aria-hidden="true" className="size-4" /> : null}
      </span>
    </button>
  );
}

export function Thumbs({ files, onRemove }: { files: ChatFile[]; onRemove?: (path: string) => void }) {
  const { tr } = useLang();
  if (!files.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {files.map((f) => {
        const image = /\.(jpe?g|png|webp|gif)$/i.test(f.path);
        const inner =
          image && f.url ? (
            <img src={f.url} alt={f.name} className="size-24 rounded-xl object-cover md:size-28" loading="lazy" />
          ) : (
            <span className="bg-surface-2 flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-xl px-2 text-center text-xs">
              <FileText aria-hidden="true" className="size-5" />
              <span className="line-clamp-2 break-all">{f.name}</span>
            </span>
          );
        return (
          <span key={f.path} className="relative">
            {f.url ? (
              <a href={f.url} target="_blank" rel="noreferrer" title={f.name}>
                {inner}
              </a>
            ) : (
              inner
            )}
            {onRemove ? (
              <button
                type="button"
                aria-label={tr("Махни {name}", { name: f.name })}
                onClick={() => onRemove(f.path)}
                className="bg-background absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border"
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

/** One line of a conversation, as the studio reads it back. */
export function Bubble({
  text,
  files = [],
  mine,
  who,
  at,
}: {
  text: string;
  files?: ChatFile[];
  mine: boolean;
  who?: string;
  at?: string;
}) {
  return (
    <div className={cn("my-2 flex flex-col", mine ? "items-end" : "items-start")}>
      {who ? <span className="text-muted-foreground mb-1 px-1 text-xs">{who}</span> : null}
      {text ? (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap",
            mine ? "bg-foreground/10 rounded-br-md" : "bg-surface-2 rounded-bl-md",
          )}
        >
          <Linkified text={text} />
        </div>
      ) : null}
      <Thumbs files={files} />
      {at ? (
        <span className="text-muted-foreground/70 mt-1 px-1 text-[0.6875rem]">
          {fmtDateTime(at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ) : null}
    </div>
  );
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
            {p}
          </a>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

export function StatusSteps({ status }: { status: InquiryStatus }) {
  const { tr } = useLang();
  const current = STATUS_STEPS.findIndex((s) => s.status.includes(status));
  return (
    <ol className="flex gap-1.5" aria-label={tr("Етап на проекта")}>
      {STATUS_STEPS.map((s, i) => (
        <li key={s.label} className="flex-1" aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-1 rounded-full", i <= current ? "bg-primary" : "bg-border")} />
          <span className={cn("mt-2 block text-[0.6875rem] tracking-[0.12em] uppercase", i === current ? "text-foreground" : "text-muted-foreground")}>
            {tr(s.label)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export const euro = (n: number) => `${new Intl.NumberFormat("bg-BG").format(n)} €`;

/** Polls `fn` every `ms` while the tab is visible. */
export function usePoll(fn: () => void, ms: number) {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") ref.current();
    };
    const id = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms]);
}

export function BriefCard({ brief, className }: { brief: Brief; className?: string }) {
  const { tr } = useLang();
  const rows = BRIEF_LABELS.filter(([k]) => brief[k]);
  if (!rows.length && !brief.summary) return null;
  return (
    <section aria-label={tr("Брифът")} className={cn("border-border bg-surface rounded-3xl border p-6", className)}>
      <p className="eyebrow mb-3">{tr("Как го разбрахме")}</p>
      {brief.summary ? <p className="text-lg text-pretty">{brief.summary}</p> : null}
      {rows.length ? (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {rows.map(([k, label]) => (
            <div key={k}>
              <dt className="text-muted-foreground text-xs tracking-[0.12em] uppercase">{tr(label)}</dt>
              <dd className="mt-1 text-[0.9375rem] text-pretty">{brief[k]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
