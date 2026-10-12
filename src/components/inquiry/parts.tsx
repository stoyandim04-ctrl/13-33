// Pieces shared by the start flow, the client's room and the studio panel.
import * as React from "react";
import { ArrowRight, Check, FileText, Loader2, Paperclip, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ACCEPT, errorText, fmtDateTime, getSlots, MAX_FILE, roomAction } from "@/lib/inquiry-api";
import { BRIEF_LABELS, DEPOSIT, STATUS_STEPS, type Brief, type ChatFile, type ChatMessage, type InquiryStatus, type Offer } from "@/lib/inquiry-shared";

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

/** Small round answer under an AI question. */
export function Chip({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-foreground/20 hover:border-foreground/60 rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40"
    >
      {children}
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
            <img src={f.url} alt={f.name} className="size-20 rounded-lg object-cover" loading="lazy" />
          ) : (
            <span className="bg-surface-2 flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg px-2 text-center text-xs">
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

/** Paperclip that uploads picked files and reports them as they finish. */
export function AttachButton({
  upload,
  onUploaded,
  label = "Добави снимки",
  highlight,
}: {
  upload: (file: File) => Promise<string>;
  onUploaded: (file: ChatFile) => void;
  label?: string;
  highlight?: boolean;
}) {
  const { tr } = useLang();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(0);
  const [error, setError] = React.useState("");

  const pick = async (list: FileList | null) => {
    setError("");
    for (const file of Array.from(list ?? []).slice(0, 8)) {
      if (file.size > MAX_FILE) {
        setError(tr("Файлът е над 10 MB."));
        continue;
      }
      setBusy((n) => n + 1);
      try {
        const path = await upload(file);
        onUploaded({ path, name: file.name, url: URL.createObjectURL(file) });
      } catch (e) {
        setError(errorText(e));
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  };

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
          highlight ? "border-ice text-ice" : "border-foreground/20 text-muted-foreground hover:text-foreground",
        )}
      >
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Paperclip aria-hidden="true" className="size-4" />}
        {busy ? tr("Качване…") : tr(label)}
      </button>
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => pick(e.target.files)} />
      {error ? <span className="text-destructive mt-1 text-xs">{error}</span> : null}
    </span>
  );
}

/** One chat line. `mine` is the side of whoever is looking. */
export function Bubble({
  message,
  mine,
  who,
}: {
  message: Pick<ChatMessage, "sender" | "body" | "files" | "created_at">;
  mine: boolean;
  who?: string;
}) {
  if (message.sender === "system") {
    return (
      <div className="mx-auto my-3 max-w-md text-center">
        <p className="text-muted-foreground bg-surface inline-block rounded-2xl px-4 py-2 text-sm text-pretty">{message.body}</p>
        <Thumbs files={message.files} />
      </div>
    );
  }
  return (
    <div className={cn("my-2 flex flex-col", mine ? "items-end" : "items-start")}>
      {who ? <span className="text-muted-foreground mb-1 px-1 text-xs">{who}</span> : null}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap",
          mine ? "bg-foreground/10 rounded-br-md" : "bg-surface-2 rounded-bl-md",
        )}
      >
        <Linkified text={message.body} />
      </div>
      <Thumbs files={message.files} />
      {message.created_at ? (
        <span className="text-muted-foreground/70 mt-1 px-1 text-[0.6875rem]">
          {fmtDateTime(message.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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

/** Text box + send + attach, used in every chat. */
export function Composer({
  onSend,
  upload,
  placeholder = "Напиши съобщение…",
  highlightAttach,
  disabled,
}: {
  onSend: (text: string, files: ChatFile[]) => Promise<void> | void;
  upload?: (file: File) => Promise<string>;
  placeholder?: string;
  highlightAttach?: boolean;
  disabled?: boolean;
}) {
  const { tr } = useLang();
  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<ChatFile[]>([]);
  const [sending, setSending] = React.useState(false);
  const area = React.useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    if (sending || disabled || (!text.trim() && !files.length)) return;
    setSending(true);
    try {
      await onSend(text.trim(), files);
      setText("");
      setFiles([]);
    } finally {
      setSending(false);
      area.current?.focus();
    }
  };

  return (
    <div className="border-border bg-surface rounded-3xl border p-2">
      {files.length ? (
        <div className="px-2 pt-1">
          <Thumbs files={files} onRemove={(p) => setFiles((f) => f.filter((x) => x.path !== p))} />
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={area}
          value={text}
          rows={1}
          placeholder={tr(placeholder)}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          aria-label={tr(placeholder)}
          className="placeholder:text-muted-foreground/70 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-base outline-none"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || disabled || (!text.trim() && !files.length)}
          aria-label={tr("Изпрати")}
          className="bg-primary grid size-11 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-30"
        >
          {sending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
        </button>
      </div>
      {upload ? (
        <div className="px-1 pt-1 pb-1">
          <AttachButton upload={upload} highlight={highlightAttach} onUploaded={(f) => setFiles((cur) => [...cur, f])} />
        </div>
      ) : null}
    </div>
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

export function OfferCard({
  offer,
  status,
  onAccept,
}: {
  offer: Offer;
  status: InquiryStatus;
  onAccept?: () => Promise<void>;
}) {
  const { tr } = useLang();
  const [busy, setBusy] = React.useState(false);
  const accepted = status !== "offer";
  return (
    <section aria-label={tr("Оферта")} className="border-primary/50 bg-primary/[0.06] rounded-3xl border p-6">
      <p className="eyebrow mb-4">{accepted ? tr("Приета оферта") : tr("Твоята оферта")}</p>
      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-muted-foreground text-xs">{tr("Крайна цена")}</dt>
          <dd className="font-display mt-1 text-2xl font-[600]">{euro(offer.price)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">{tr("Срок")}</dt>
          <dd className="mt-1 text-lg font-medium">{offer.deadline}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">{tr("Капаро")}</dt>
          <dd className="font-display mt-1 text-2xl font-[600]">{euro(offer.deposit)}</dd>
        </div>
      </dl>
      {offer.note ? <p className="text-muted-foreground mt-5 text-[0.9375rem] whitespace-pre-wrap">{offer.note}</p> : null}
      <p className="text-muted-foreground mt-4 text-sm">
        {tr("Капарото се приспада от крайната цена. Остатъкът — {rest} — се плаща при предаване.", { rest: euro(offer.price - offer.deposit) })}
      </p>
      {status === "offer" && onAccept ? (
        <Button
          className="mt-6 w-full sm:w-auto"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onAccept();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? tr("Изпращане…") : tr("Приемам офертата")}
          <ArrowRight aria-hidden="true" />
        </Button>
      ) : null}
      {status === "accepted" && offer.payment ? (
        <div className="border-border mt-6 border-t pt-5">
          <p className="text-sm font-medium">{tr("Как да платиш капарото")}</p>
          <p className="text-muted-foreground mt-2 text-[0.9375rem] whitespace-pre-wrap">
            <LinkifiedText text={offer.payment} />
          </p>
        </div>
      ) : null}
    </section>
  );
}

const LinkifiedText = ({ text }: { text: string }) => <Linkified text={text} />;

/** The deposit rule, in one line, wherever the client meets it. */
export function DepositNote({ className }: { className?: string }) {
  const { tr } = useLang();
  return (
    <p className={cn("text-muted-foreground text-sm text-pretty", className)}>
      <span className="text-foreground font-medium">{tr("Капаро: {n} €", { n: DEPOSIT.standard })}</span>{" "}
      {tr("(при по-голям проект — {n} €). Приспада се от крайната цена.", { n: DEPOSIT.large })}
    </p>
  );
}

/** Pick a day, then a time. Times are shown in Bulgarian time. */
export function BookingPicker({ token, onBooked }: { token: string; onBooked: () => void }) {
  const { tr } = useLang();
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [minutes, setMinutes] = React.useState(30);
  const [day, setDay] = React.useState("");
  const [picked, setPicked] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await getSlots(token);
      setSlots(r.slots);
      setMinutes(r.minutes);
    } catch (e) {
      setError(errorText(e));
      setSlots([]);
    }
  }, [token]);
  React.useEffect(() => {
    void load();
  }, [load]);

  const dayKey = (iso: string) => fmtDateTime(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
  const days = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots ?? []) map.set(dayKey(s), [...(map.get(dayKey(s)) ?? []), s]);
    return [...map.entries()];
  }, [slots]);
  const activeDay = day || days[0]?.[0] || "";
  const times = days.find(([d]) => d === activeDay)?.[1] ?? [];

  if (!slots) return <p className="text-muted-foreground text-sm">{tr("Зареждане на свободните часове…")}</p>;
  if (!days.length) return <p className="text-muted-foreground text-sm">{error || tr("В момента няма свободни часове. Пиши ни в чата и ще намерим време.")}</p>;

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label={tr("Ден")}>
        {days.map(([d, list]) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === activeDay}
            onClick={() => {
              setDay(d);
              setPicked("");
            }}
            className={cn(
              "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-2.5 transition-colors",
              d === activeDay ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40",
            )}
          >
            <span className="text-muted-foreground text-[0.6875rem] uppercase">{fmtDateTime(list[0], { weekday: "short" })}</span>
            <span className="text-lg font-medium">{fmtDateTime(list[0], { day: "numeric" })}</span>
            <span className="text-muted-foreground text-[0.6875rem]">{fmtDateTime(list[0], { month: "short" })}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {times.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPicked(t)}
            aria-pressed={picked === t}
            className={cn(
              "h-11 rounded-xl border text-sm tabular-nums transition-colors",
              picked === t ? "border-primary bg-primary/15" : "border-border hover:border-foreground/40",
            )}
          >
            {fmtDateTime(t, { hour: "2-digit", minute: "2-digit" })}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">{tr("Часовете са по българско време. Срещата е {m} мин, онлайн.", { m: minutes })}</p>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      <Button
        className="mt-4"
        disabled={!picked || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await roomAction(token, "book", { startsAt: picked });
            onBooked();
          } catch (e) {
            setError(errorText(e));
            setPicked("");
            void load();
          } finally {
            setBusy(false);
          }
        }}
      >
        {picked ? tr("Запази {when}", { when: fmtDateTime(picked, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }) : tr("Избери час")}
      </Button>
    </div>
  );
}

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
      <DepositNote className="border-border mt-6 border-t pt-4" />
    </section>
  );
}

