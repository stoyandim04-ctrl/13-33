// /studio - the founder's panel: every inquiry with its brief, pictures and
// files, the conversation with the consultant and the deposit. One password.
// The founder answers clients by e-mail; here they only move the stage along.
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, Loader2, LogOut, Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BriefCard, Bubble, euro, StatusSteps, Thumbs, usePoll } from "@/components/inquiry/parts";
import { ApiError, errorText, fmtDateTime, store, studioGet, studioLogin, studioPost } from "@/lib/inquiry-api";
import { emptyBrief, projectTypeLabel, type AiTurn, type Answers, type Brief, type ChatFile, type InquiryStatus } from "@/lib/inquiry-shared";

const AUTH_KEY = "1333-studio";

interface ListItem {
  number: number;
  name: string;
  email: string;
  projectType: string;
  status: InquiryStatus;
  createdAt: string;
  deposit: number;
  paidAt: string | null;
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
  deposit: number;
  deposit_paid_at: string | null;
  roomPath: string;
  files: ChatFile[];
}

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "Ново",
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
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-[500]">Запитвания</h1>
            {list?.some((i) => i.unread) ? <span className="bg-primary size-2 rounded-full" aria-label="Има нови" /> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onUnauthorized}>
            <LogOut aria-hidden="true" /> Изход
          </Button>
        </div>
        {error ? <p className="text-destructive mb-4 text-sm">{error}</p> : null}

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
                        <span className="text-muted-foreground text-xs">{fmtDateTime(i.createdAt, { day: "numeric", month: "short" })}</span>
                      </span>
                      <span className="text-muted-foreground mt-1 block text-sm">
                        {projectTypeLabel(i.projectType)} · {STATUS_LABEL[i.status]}
                        {i.paidAt ? ` · ${euro(i.deposit)} ✓` : i.deposit > 0 ? ` · капаро ${euro(i.deposit)}` : ""}
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
  usePoll(load, 10000);

  if (!d) return <Loader2 aria-hidden="true" className="size-4 animate-spin" />;

  const setStatus = async (status: InquiryStatus) => {
    try {
      await studioPost(auth, "status", { n, status });
      await load();
      onChange();
    } catch (e) {
      guard(e);
    }
  };
  const brief = { ...emptyBrief(), ...d.brief };
  const fileUrls = new Map(d.files.map((f) => [f.path, f]));
  const subject = encodeURIComponent(`Проект №${d.number} — ${projectTypeLabel(d.project_type)} · 13:33`);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
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
            <a href={`mailto:${d.email}?subject=${subject}`} className="hover:text-foreground inline-flex items-center gap-1.5">
              <Mail aria-hidden="true" className="size-3.5" /> {d.email}
            </a>
            {d.phone ? (
              <a href={`tel:${d.phone}`} className="hover:text-foreground inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="size-3.5" /> {d.phone}
              </a>
            ) : null}
            <a href={d.roomPath} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1.5">
              <ExternalLink aria-hidden="true" className="size-3.5" /> Страницата на клиента
            </a>
          </div>
          <div className="mt-5">
            <StatusSteps status={d.status} />
          </div>
        </header>

        <dl className="border-border mt-6 grid grid-cols-2 gap-4 rounded-3xl border p-5 text-sm sm:grid-cols-4">
          {[
            ["Проект", projectTypeLabel(d.answers.projectType || d.project_type)],
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
            <p className="text-muted-foreground text-xs tracking-[0.12em] uppercase">Снимки и файлове · отварят се в пълен размер</p>
            <Thumbs files={d.files} />
          </div>
        ) : null}
        {d.transcript.length ? (
          <div className="mt-4">
            <button type="button" onClick={() => setShowAi((v) => !v)} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
              {showAi ? "Скрий разговора с консултанта" : `Разговорът с консултанта (${d.transcript.length})`}
            </button>
            {showAi ? (
              <div className="border-border mt-3 rounded-3xl border p-4">
                {d.transcript.map((t, i) => (
                  <Bubble
                    key={i}
                    mine={t.role === "client"}
                    who={t.role === "ai" ? "Консултант" : d.name}
                    text={t.text}
                    files={(t.files ?? []).map((p) => fileUrls.get(p) ?? { path: p, name: p })}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <section className={cn("rounded-3xl border p-5", d.deposit_paid_at ? "border-primary/50 bg-primary/[0.06]" : "border-border")}>
          <p className="font-medium">Капаро</p>
          {d.deposit > 0 ? (
            <>
              <p className="font-display mt-2 text-3xl font-[600]">{euro(d.deposit)}</p>
              {d.deposit_paid_at ? (
                <p className="text-ice mt-2 inline-flex items-center gap-1.5 text-sm">
                  <Check aria-hidden="true" className="size-4" /> Платено {fmtDateTime(d.deposit_paid_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">Още не е платено. Клиентът го плаща на страницата си.</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">Няма зададено капаро за този вид проект (src/lib/inquiry-shared.ts → DEPOSITS).</p>
          )}
        </section>
        <section className="border-border rounded-3xl border p-5">
          <p className="font-medium">Етап</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["new", "deposit_paid", "in_progress", "done", "archived"] as InquiryStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void setStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  d.status === s ? "border-primary bg-primary/15" : "border-border hover:border-foreground/40",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">Клиентът вижда етапа на страницата си. Цената и планът му ги пишеш по имейл.</p>
        </section>
      </aside>
    </div>
  );
}
