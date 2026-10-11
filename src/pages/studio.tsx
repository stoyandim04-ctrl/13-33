// /studio - the founder's panel: inquiries, the chat with each client, the
// offer (price, deadline, deposit), meetings and free hours. One password.
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ExternalLink, Inbox, Loader2, LogOut, Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BriefCard, Bubble, Composer, euro, StatusSteps, Thumbs, usePoll } from "@/components/inquiry/parts";
import { ApiError, errorText, fmtDateTime, store, studioGet, studioLogin, studioPost, uploadFile } from "@/lib/inquiry-api";
import {
  DEPOSIT,
  emptyBrief,
  projectTypeLabel,
  type AiTurn,
  type Answers,
  type Availability,
  type Booking,
  type Brief,
  type ChatFile,
  type ChatMessage,
  type InquiryStatus,
  type Offer,
} from "@/lib/inquiry-shared";

const AUTH_KEY = "1333-studio";
const PAYMENT_KEY = "1333-studio-payment";

interface ListItem {
  number: number;
  name: string;
  email: string;
  projectType: string;
  status: InquiryStatus;
  createdAt: string;
  lastMessageAt: string;
  summary: string;
  unread: boolean;
}

interface Detail {
  number: number;
  name: string;
  email: string;
  phone: string | null;
  project_type: string;
  status: InquiryStatus;
  created_at: string;
  answers: Answers;
  brief: Brief;
  transcript: AiTurn[];
  offer: Offer | null;
  roomPath: string;
  files: ChatFile[];
  messages: ChatMessage[];
  bookings: Booking[];
}

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "Ново",
  offer: "Оферта пратена",
  accepted: "Чака капаро",
  deposit_paid: "Капаро платено",
  in_progress: "В работа",
  done: "Готово",
  archived: "Архив",
};

export default function StudioPage() {
  const [auth, setAuth] = React.useState(() => store<string>(AUTH_KEY) ?? "");
  React.useEffect(() => {
    document.title = "Студио — 13:33";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const logout = () => {
    store(AUTH_KEY, null);
    setAuth("");
  };
  if (!auth) return <Login onIn={(t) => setAuth(store(AUTH_KEY, t) ?? t)} />;
  return <Panel auth={auth} onUnauthorized={logout} />;
}

function Login({ onIn }: { onIn: (token: string) => void }) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <form
        className="w-full max-w-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            onIn((await studioLogin(password)).token);
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="eyebrow mb-4">13:33 · Студио</p>
        <h1 className="font-display text-3xl font-[500]">Вход</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Парола"
          aria-label="Парола"
          className="field mt-6"
        />
        {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
        <Button type="submit" className="mt-5 w-full" disabled={!password || busy}>
          {busy ? "Влизане…" : "Влез"}
        </Button>
      </form>
    </div>
  );
}

function Panel({ auth, onUnauthorized }: { auth: string; onUnauthorized: () => void }) {
  const [params, setParams] = useSearchParams();
  const selected = Number(params.get("n")) || null;
  const view = params.get("v") === "calendar" ? "calendar" : "inbox";
  const [list, setList] = React.useState<ListItem[] | null>(null);
  const [filter, setFilter] = React.useState<"active" | "all">("active");
  const [error, setError] = React.useState("");

  const guard = React.useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) onUnauthorized();
      else setError(errorText(e));
    },
    [onUnauthorized],
  );

  const loadList = React.useCallback(async () => {
    try {
      setList(await studioGet<ListItem[]>(auth, "list"));
    } catch (e) {
      guard(e);
    }
  }, [auth, guard]);
  React.useEffect(() => {
    void loadList();
  }, [loadList]);
  usePoll(loadList, 15000);

  const shown = (list ?? []).filter((i) => filter === "all" || !["done", "archived"].includes(i.status));
  const open = (n: number | null) => setParams(n ? { n: String(n) } : {});

  return (
    <div className="px-4 pt-20 pb-10 sm:px-6 md:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="border-border inline-flex rounded-full border p-1">
            {(
              [
                ["inbox", "Запитвания", Inbox],
                ["calendar", "Календар", CalendarDays],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setParams(v === "calendar" ? { v } : {})}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm",
                  view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-4" /> {label}
                {v === "inbox" && list?.some((i) => i.unread) ? <span className="bg-primary size-2 rounded-full" /> : null}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onUnauthorized}>
            <LogOut aria-hidden="true" /> Изход
          </Button>
        </div>
        {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

        {view === "calendar" ? (
          <CalendarView auth={auth} guard={guard} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            <section className={cn(selected && "hidden lg:block")} aria-label="Запитвания">
              <div className="mb-3 flex gap-2 text-sm">
                {(["active", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn("rounded-full px-3 py-1", filter === f ? "bg-surface-2 text-foreground" : "text-muted-foreground")}
                  >
                    {f === "active" ? "Активни" : "Всички"}
                  </button>
                ))}
              </div>
              {!list ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : !shown.length ? (
                <p className="text-muted-foreground text-sm">Още няма запитвания.</p>
              ) : (
                <ul className="space-y-2">
                  {shown.map((i) => (
                    <li key={i.number}>
                      <button
                        type="button"
                        onClick={() => open(i.number)}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-colors",
                          selected === i.number ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30",
                        )}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 font-medium">
                            {i.unread ? <span className="bg-primary size-2 shrink-0 rounded-full" aria-label="Ново" /> : null}
                            №{i.number} · {i.name}
                          </span>
                          <span className="text-muted-foreground text-xs">{fmtDateTime(i.lastMessageAt, { day: "numeric", month: "short" })}</span>
                        </span>
                        <span className="text-muted-foreground mt-1 block text-sm">
                          {projectTypeLabel(i.projectType)} · {STATUS_LABEL[i.status]}
                        </span>
                        {i.summary ? <span className="text-muted-foreground/80 mt-1 line-clamp-2 block text-sm">{i.summary}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={cn(!selected && "hidden lg:block")}>
              {selected ? (
                <DetailView key={selected} auth={auth} n={selected} guard={guard} onBack={() => open(null)} onChange={loadList} />
              ) : (
                <p className="text-muted-foreground border-border rounded-3xl border border-dashed p-10 text-center text-sm">Избери запитване отляво.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailView({
  auth,
  n,
  guard,
  onBack,
  onChange,
}: {
  auth: string;
  n: number;
  guard: (e: unknown) => void;
  onBack: () => void;
  onChange: () => void;
}) {
  const [d, setD] = React.useState<Detail | null>(null);
  const [showAi, setShowAi] = React.useState(false);
  const end = React.useRef<HTMLDivElement>(null);
  const count = d?.messages.length ?? 0;

  const load = React.useCallback(async () => {
    try {
      setD(await studioGet<Detail>(auth, `n=${n}`));
    } catch (e) {
      guard(e);
    }
  }, [auth, n, guard]);
  React.useEffect(() => {
    void load();
  }, [load]);
  usePoll(load, 6000);
  React.useEffect(() => {
    if (count) end.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  if (!d) return <Loader2 aria-hidden="true" className="size-4 animate-spin" />;

  const act = async (action: string, extra: Record<string, unknown>) => {
    try {
      await studioPost(auth, action, { n, ...extra });
      await load();
      onChange();
    } catch (e) {
      guard(e);
      throw e;
    }
  };
  const brief = { ...emptyBrief(), ...d.brief };
  const fileUrls = new Map(d.files.map((f) => [f.path, f]));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="min-w-0">
        <button type="button" onClick={onBack} className="text-muted-foreground mb-4 inline-flex items-center gap-1.5 text-sm lg:hidden">
          <ArrowLeft aria-hidden="true" className="size-4" /> Всички запитвания
        </button>
        <header>
          <p className="eyebrow mb-2">
            №{d.number} · {projectTypeLabel(d.project_type)} · {fmtDateTime(d.created_at, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
          <h1 className="font-display text-3xl font-[500]">{d.name}</h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <a href={`mailto:${d.email}`} className="hover:text-foreground inline-flex items-center gap-1.5">
              <Mail aria-hidden="true" className="size-3.5" /> {d.email}
            </a>
            {d.phone ? (
              <a href={`tel:${d.phone}`} className="hover:text-foreground inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="size-3.5" /> {d.phone}
              </a>
            ) : null}
            <a href={d.roomPath} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1.5">
              <ExternalLink aria-hidden="true" className="size-3.5" /> Чатът, както го вижда клиентът
            </a>
          </div>
          <div className="mt-5">
            <StatusSteps status={d.status} />
          </div>
        </header>

        <dl className="border-border mt-6 grid grid-cols-2 gap-4 rounded-3xl border p-5 text-sm sm:grid-cols-4">
          {[
            ["Проект", projectTypeLabel(d.answers.projectType)],
            ["Сайт", [d.answers.hasSite, d.answers.siteUrl].filter(Boolean).join(" · ")],
            ["Кога", d.answers.when],
            ["Бюджет", d.answers.budget],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted-foreground text-xs">{k}</dt>
              <dd className="mt-1 break-words">{v || "—"}</dd>
            </div>
          ))}
        </dl>
        <BriefCard brief={brief} className="mt-4" />
        {d.files.length ? (
          <div className="mt-4">
            <p className="text-muted-foreground text-xs tracking-[0.12em] uppercase">Файлове</p>
            <Thumbs files={d.files} />
          </div>
        ) : null}
        {d.transcript.length ? (
          <div className="mt-4">
            <button type="button" onClick={() => setShowAi((v) => !v)} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
              {showAi ? "Скрий разговора с асистента" : `Разговорът с асистента (${d.transcript.length})`}
            </button>
            {showAi ? (
              <div className="border-border mt-3 rounded-3xl border p-4">
                {d.transcript.map((t, i) => (
                  <Bubble
                    key={i}
                    mine={t.role === "client"}
                    who={t.role === "ai" ? "Асистент" : d.name}
                    message={{ sender: t.role === "ai" ? "studio" : "client", body: t.text, files: (t.files ?? []).map((p) => fileUrls.get(p) ?? { path: p, name: p }), created_at: "" }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <section aria-label="Чат с клиента" className="mt-8">
          <p className="eyebrow mb-2">Чат с {d.name}</p>
          <div className="border-border rounded-3xl border p-4">
            {d.messages.map((m) => (
              <Bubble key={m.id} message={m} mine={m.sender === "studio"} who={m.sender === "client" ? d.name : undefined} />
            ))}
            <div ref={end} />
          </div>
          <div className="mt-3">
            <Composer
              placeholder={`Пиши на ${d.name}…`}
              upload={(file) => uploadFile(file, { studio: { n, auth } })}
              onSend={(text, files) => act("message", { body: text, files: files.map((f) => f.path) })}
            />
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <OfferForm detail={d} onSend={(offer) => act("offer", { ...offer })} />
        <section className="border-border rounded-3xl border p-5">
          <p className="font-medium">Етап</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["deposit_paid", "in_progress", "done", "archived"] as InquiryStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void act("status", { status: s })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  d.status === s ? "border-primary bg-primary/15" : "border-border hover:border-foreground/40",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">Клиентът вижда етапа и кратка бележка в чата.</p>
        </section>
        <Meetings bookings={d.bookings} auth={auth} guard={guard} onChange={load} />
      </aside>
    </div>
  );
}

function OfferForm({ detail, onSend }: { detail: Detail; onSend: (offer: Offer) => Promise<void> }) {
  const o = detail.offer;
  const [price, setPrice] = React.useState(o ? String(o.price) : "");
  const [deposit, setDeposit] = React.useState(o ? o.deposit : DEPOSIT.standard);
  const [deadline, setDeadline] = React.useState(o?.deadline ?? "");
  const [note, setNote] = React.useState(o?.note ?? "");
  const [payment, setPayment] = React.useState(o?.payment ?? store<string>(PAYMENT_KEY) ?? "");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const p = Number(price);
  const ok = p > 0 && deposit > 0 && deposit <= p && deadline.trim();
  const locked = !["new", "offer"].includes(detail.status);

  return (
    <section className="border-primary/40 rounded-3xl border p-5">
      <p className="font-medium">{o ? "Офертата" : "Изпрати оферта"}</p>
      {locked && o ? (
        <p className="text-muted-foreground mt-2 text-sm">
          Приета: {euro(o.price)}, срок {o.deadline}, капаро {euro(o.deposit)}.
        </p>
      ) : (
        <form
          className="mt-4 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!ok) return;
            setBusy(true);
            try {
              store(PAYMENT_KEY, payment);
              await onSend({ price: p, deposit, deadline, note, payment });
              setSent(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm">
            Крайна цена, €
            <input type="number" min={1} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="field mt-1" />
          </label>
          <div className="text-sm">
            Капаро, €
            <div className="mt-1 flex gap-2">
              {[DEPOSIT.standard, DEPOSIT.large].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDeposit(v)}
                  className={cn("h-11 flex-1 rounded-xl border", deposit === v ? "border-primary bg-primary/15" : "border-border")}
                >
                  {v} €
                </button>
              ))}
              <input
                type="number"
                min={1}
                aria-label="Друга сума"
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="field w-24"
              />
            </div>
          </div>
          <label className="block text-sm">
            Срок
            <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="напр. 3 седмици" className="field mt-1" />
          </label>
          <label className="block text-sm">
            Какво включва
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="field mt-1 resize-y" />
          </label>
          <label className="block text-sm">
            Как се плаща капарото
            <textarea
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              rows={2}
              placeholder="IBAN / Revolut / линк за плащане"
              className="field mt-1 resize-y"
            />
            <span className="text-muted-foreground mt-1 block text-xs">Клиентът го вижда, след като приеме офертата.</span>
          </label>
          <Button type="submit" className="w-full" disabled={!ok || busy}>
            {busy ? "Изпращане…" : o ? "Обнови офертата" : "Изпрати офертата"}
          </Button>
          {sent ? <p className="text-ice text-sm">Изпратено — клиентът я вижда в чата.</p> : null}
        </form>
      )}
    </section>
  );
}

function Meetings({ bookings, auth, guard, onChange }: { bookings: Booking[]; auth: string; guard: (e: unknown) => void; onChange: () => void }) {
  const active = bookings.filter((b) => b.status === "booked");
  return (
    <section className="border-border rounded-3xl border p-5">
      <p className="font-medium">Срещи</p>
      {!active.length ? <p className="text-muted-foreground mt-2 text-sm">Няма запазени срещи.</p> : null}
      <ul className="mt-3 space-y-3">
        {active.map((b) => (
          <MeetingRow key={b.id} b={b} auth={auth} guard={guard} onChange={onChange} />
        ))}
      </ul>
    </section>
  );
}

function MeetingRow({ b, auth, guard, onChange }: { b: Booking; auth: string; guard: (e: unknown) => void; onChange: () => void }) {
  const [url, setUrl] = React.useState(b.meet_url ?? "");
  return (
    <li className="bg-surface-2 rounded-2xl p-3 text-sm">
      <p className="font-medium">{fmtDateTime(b.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {b.minutes} мин</p>
      <div className="mt-2 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/…" aria-label="Линк за срещата" className="field h-10 flex-1 text-sm" />
        <Button
          size="sm"
          variant="outline"
          disabled={!/^https:\/\//.test(url) || url === b.meet_url}
          onClick={async () => {
            try {
              await studioPost(auth, "meet", { id: b.id, url });
              onChange();
            } catch (e) {
              guard(e);
            }
          }}
        >
          Прати
        </Button>
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground mt-2 text-xs"
        onClick={async () => {
          if (!window.confirm("Да отменя ли срещата? Клиентът ще види бележка в чата.")) return;
          try {
            await studioPost(auth, "cancel", { id: b.id });
            onChange();
          } catch (e) {
            guard(e);
          }
        }}
      >
        Отмени срещата
      </button>
    </li>
  );
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function CalendarView({ auth, guard }: { auth: string; guard: (e: unknown) => void }) {
  const [data, setData] = React.useState<{ availability: Availability; bookings: (Booking & { inquiries: { number: number; name: string } | null })[] } | null>(null);
  const [a, setA] = React.useState<Availability | null>(null);
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await studioGet<NonNullable<typeof data>>(auth, "calendar");
      setData(r);
      setA((cur) => cur ?? r.availability);
    } catch (e) {
      guard(e);
    }
  }, [auth, guard]);
  React.useEffect(() => {
    void load();
  }, [load]);

  if (!data || !a) return <Loader2 aria-hidden="true" className="size-4 animate-spin" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="border-border rounded-3xl border p-6">
        <p className="font-medium">Кога приемаш срещи</p>
        <p className="text-muted-foreground mt-1 text-sm">Клиентите виждат само свободните часове в тези рамки (българско време).</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {WEEKDAYS.map((label, i) => {
            const day = i + 1;
            const on = a.weekdays.includes(day);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => setA({ ...a, weekdays: on ? a.weekdays.filter((d) => d !== day) : [...a.weekdays, day] })}
                className={cn("size-11 rounded-full border text-sm", on ? "border-primary bg-primary/15" : "border-border text-muted-foreground")}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="text-sm">
            От
            <input type="time" value={a.start} onChange={(e) => setA({ ...a, start: e.target.value })} className="field mt-1" />
          </label>
          <label className="text-sm">
            До
            <input type="time" value={a.end} onChange={(e) => setA({ ...a, end: e.target.value })} className="field mt-1" />
          </label>
          <label className="text-sm">
            Среща, мин
            <input type="number" min={15} step={15} value={a.minutes} onChange={(e) => setA({ ...a, minutes: Number(e.target.value) })} className="field mt-1" />
          </label>
          <label className="text-sm">
            Предизвестие, ч
            <input type="number" min={0} value={a.noticeHours} onChange={(e) => setA({ ...a, noticeHours: Number(e.target.value) })} className="field mt-1" />
          </label>
        </div>
        <Button
          className="mt-6"
          onClick={async () => {
            try {
              setA(await studioPost<Availability>(auth, "availability", { availability: a }));
              setSaved(true);
              window.setTimeout(() => setSaved(false), 2000);
            } catch (e) {
              guard(e);
            }
          }}
        >
          {saved ? "Запазено" : "Запази"}
        </Button>
      </section>
      <section className="border-border rounded-3xl border p-6">
        <p className="font-medium">Предстоящи срещи</p>
        {!data.bookings.length ? <p className="text-muted-foreground mt-2 text-sm">Няма запазени срещи.</p> : null}
        <ul className="mt-4 space-y-2">
          {data.bookings.map((b) => (
            <li key={b.id}>
              <a href={`/studio?n=${b.inquiries?.number ?? ""}`} className="border-border hover:border-foreground/30 block rounded-2xl border p-3 text-sm">
                <span className="font-medium">{fmtDateTime(b.starts_at, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-muted-foreground block">
                  №{b.inquiries?.number} · {b.inquiries?.name} {b.meet_url ? "· линкът е пратен" : "· без линк"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
