// /zapitvane/:token - the client's page after the inquiry: the brief as we
// understood it, the price item by item, the deposit (paid online, right here)
// and what follows. No chat: after the deposit the studio writes by e-mail.
import * as React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Copy, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { BriefCard, euro, StatusSteps, Thumbs, usePoll } from "@/components/inquiry/parts";
import { ApiError, errorText, fmtDateTime, getRoom, startPayment } from "@/lib/inquiry-api";
import { DEPOSIT_SHARE, FIRST_VERSION_DAYS, projectTypeLabel, type Room } from "@/lib/inquiry-shared";
import { useLang } from "@/lib/i18n";

export default function RoomPage() {
  const { token = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { tr } = useLang();
  const [room, setRoom] = React.useState<Room | null>(null);
  const [missing, setMissing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  // Back from Stripe: the page keeps asking until the payment is settled.
  const backFromPay = params.get("paid") === "1";
  const waiting = backFromPay && Boolean(room) && !room?.paidAt;

  const load = React.useCallback(async () => {
    try {
      setRoom(await getRoom(token, backFromPay));
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else setError(errorText(e));
    }
  }, [token, backFromPay]);

  React.useEffect(() => {
    document.title = tr("Твоят проект — 13:33");
    void load();
  }, [load, tr]);
  usePoll(load, waiting ? 3000 : 20000);

  React.useEffect(() => {
    if (backFromPay && room?.paidAt) setParams({}, { replace: true });
  }, [backFromPay, room?.paidAt, setParams]);

  if (missing) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-36 pb-24 text-center">
        <h1 className="font-display text-3xl font-[500]">{tr("Не намерихме това запитване")}</h1>
        <p className="text-muted-foreground mt-4">{tr("Провери дали линкът е пълен. Можеш и да започнеш ново запитване.")}</p>
        <Link to="/zapochni" className="text-ice mt-6 inline-block underline">{tr("Започни проект")}</Link>
      </div>
    );
  }
  if (!room) {
    return (
      <div className="text-muted-foreground flex h-svh items-center justify-center gap-2">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {error || tr("Зареждане…")}
      </div>
    );
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/zapitvane/${token}` : "";
  const paid = Boolean(room.paidAt);
  const needsDeposit = room.deposit > 0 && !paid;

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const { url } = await startPayment(token);
      window.location.assign(url);
    } catch (e) {
      setError(errorText(e));
      setPaying(false);
    }
  };

  const est = room.estimate;
  const steps = [
    { text: tr("Плащаш капарото тук, онлайн."), done: paid, show: room.deposit > 0 },
    { text: tr("До {n} работни дни първата версия е на {email}.", { n: FIRST_VERSION_DAYS, email: room.email }), done: false, show: true },
    { text: tr("Изглаждаме я заедно, по твой вкус, до последния детайл."), done: false, show: true },
    { text: tr("Свързваме домейна, плащанията и формите и пускаме."), done: false, show: true },
  ].filter((s) => s.show);

  return (
    <div className="px-5 pt-28 pb-20 sm:px-8 md:pt-36">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_20rem]">
        <section className="min-w-0">
          <p className="eyebrow mb-4">{tr("Проект №{n}", { n: room.number })} · {tr(projectTypeLabel(room.projectType))}</p>
          <h1 className="font-display text-heading font-[300] tracking-[-0.045em] text-balance">
            {paid ? tr("Благодарим, {name}. Започваме.", { name: room.name }) : tr("Брифът ти е при нас, {name}.", { name: room.name })}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-[42ch] text-[1.0625rem] text-pretty">
            {paid
              ? tr("Екипът вече работи по проекта ти. До {n} работни дни първата версия е на {email}.", { n: FIRST_VERSION_DAYS, email: room.email })
              : needsDeposit
                ? tr("Подредихме идеята ти и изчислихме цената. Остава капарото, и до {n} работни дни първата версия е на имейла ти.", { n: FIRST_VERSION_DAYS })
                : tr("Екипът преглежда брифа и ще ти пише на {email}.", { email: room.email })}
          </p>

          <div className="mt-10">
            <StatusSteps status={room.status} />
          </div>

          {est || room.deposit > 0 ? (
            <section aria-label={tr("Цена")} className="border-border bg-surface mt-10 rounded-3xl border p-6 md:p-8">
              {est ? (
                <>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="eyebrow">{tr("Цена на проекта")}</p>
                    <p className="font-display text-title font-[400] tracking-[-0.02em] tabular-nums">{euro(est.price)}</p>
                  </div>
                  <ul className="mt-5">
                    {est.items.map((i) => (
                      <li key={i.name} className="hairline flex items-baseline justify-between gap-4 py-3 text-[0.9375rem]">
                        <span className="text-muted-foreground">{i.name}</span>
                        <span className="tabular-nums">{euro(i.price)}</span>
                      </li>
                    ))}
                  </ul>
                  {est.note ? <p className="text-muted-foreground mt-3 text-sm text-pretty">{est.note}</p> : null}
                </>
              ) : (
                <p className="text-muted-foreground text-[0.9375rem] text-pretty">{tr("Точната цена идва на имейла ти след прегледа на брифа.")}</p>
              )}

              {room.deposit > 0 ? (
                <dl className="border-border mt-6 rounded-2xl border px-5 py-1 text-[0.9375rem]">
                  <div className="flex items-baseline justify-between gap-4 py-3">
                    <dt>
                      {tr("Капаро")}
                      {est ? <span className="text-muted-foreground"> · {Math.round(DEPOSIT_SHARE * 100)}%</span> : null}
                    </dt>
                    <dd className="flex items-center gap-2 font-medium tabular-nums">
                      {paid ? <Check aria-hidden="true" className="text-ice size-4" /> : null}
                      {euro(room.deposit)}
                    </dd>
                  </div>
                  {est ? (
                    <div className="hairline text-muted-foreground flex items-baseline justify-between gap-4 py-3">
                      <dt>{tr("Остатък · при пускането")}</dt>
                      <dd className="tabular-nums">{euro(Math.max(0, est.price - room.deposit))}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {needsDeposit ? (
                waiting ? (
                  <p className="text-ice mt-6 flex items-center gap-2 text-[0.9375rem]">
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {tr("Проверяваме плащането…")}
                  </p>
                ) : room.canPay ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <RainbowButton onClick={() => void pay()} disabled={paying} className="self-stretch sm:self-auto [&>span]:w-full [&>span]:justify-center">
                      {paying ? tr("Отваряме плащането…") : tr("Плати капарото · {n}", { n: euro(room.deposit) })}
                      {paying ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
                    </RainbowButton>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Lock aria-hidden="true" className="size-3.5" /> {tr("Карта, Apple Pay или Google Pay · Stripe")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-6 text-sm">{tr("Плащането онлайн още не е включено. Екипът ще ти пише на {email}.", { email: room.email })}</p>
                )
              ) : null}
              {paid && room.paidAt ? (
                <p className="text-muted-foreground mt-4 text-sm">
                  {tr("Капарото е получено")} · {fmtDateTime(room.paidAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : null}
              {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
            </section>
          ) : null}

          <BriefCard brief={room.brief} className="mt-8" />
          {room.files.length ? (
            <div className="mt-6">
              <p className="text-muted-foreground text-xs tracking-[0.12em] uppercase">{tr("Снимки и файлове")}</p>
              <Thumbs files={room.files} />
            </div>
          ) : null}
        </section>

        <aside className="space-y-6 lg:pt-16">
          <section className="border-border rounded-3xl border p-6">
            <p className="eyebrow">{tr("Какво следва")}</p>
            <ol className="mt-5 space-y-4 text-[0.9375rem]">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <span
                    className={
                      s.done
                        ? "bg-primary text-background grid size-6 shrink-0 place-items-center rounded-full"
                        : "border-border text-ice grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums"
                    }
                  >
                    {s.done ? <Check aria-hidden="true" className="size-3.5" /> : i + 1}
                  </span>
                  <span className={s.done ? "text-muted-foreground line-through decoration-white/20" : "text-pretty"}>{s.text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-border rounded-3xl border p-6 text-sm">
            <p className="font-medium">{tr("Запази този линк")}</p>
            <p className="text-muted-foreground mt-1">{tr("Брифът, цената и капарото ти са тук. Отвори го по всяко време, от телефон или компютър.")}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  window.prompt(tr("Копирай линка:"), link);
                }
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? tr("Копирано") : tr("Копирай линка")}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
