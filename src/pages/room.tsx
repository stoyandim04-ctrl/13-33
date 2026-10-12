// /zapitvane/:token - the client's page after the inquiry: the brief as we
// understood it, the deposit (paid online, right here) and what follows. No
// chat: after the deposit the founder writes by e-mail.
import * as React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Copy, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { BriefCard, euro, StatusSteps, Thumbs, usePoll } from "@/components/inquiry/parts";
import { ApiError, errorText, fmtDateTime, getRoom, startPayment } from "@/lib/inquiry-api";
import { projectTypeLabel, type Room } from "@/lib/inquiry-shared";
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

  return (
    <div className="px-5 pt-24 pb-16 sm:px-8 md:pt-32">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_20rem]">
        <section className="min-w-0">
          <p className="eyebrow mb-3">{tr("Проект №{n}", { n: room.number })} · {tr(projectTypeLabel(room.projectType))}</p>
          <h1 className="font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] leading-tight font-[500] tracking-[-0.035em]">
            {paid ? tr("Благодарим, {name}. Започваме.", { name: room.name }) : tr("Брифът ти е при нас, {name}.", { name: room.name })}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[40ch] text-[1.0625rem] text-pretty">
            {paid
              ? tr("{who} преглежда брифа и ще ти пише на {email} с точна цена, план и първите стъпки.", { who: room.studioName, email: room.email })
              : needsDeposit
                ? tr("Запитването вече е при основателя. Остава капарото — плаща се тук, онлайн, и се приспада от крайната цена.")
                : tr("{who} преглежда брифа и ще ти пише на {email}.", { who: room.studioName, email: room.email })}
          </p>

          <div className="mt-8">
            <StatusSteps status={room.status} />
          </div>

          {needsDeposit ? (
            <section aria-label={tr("Капаро")} className="border-primary/50 bg-primary/[0.06] mt-8 rounded-3xl border p-6 md:p-8">
              <p className="eyebrow mb-4">{tr("Капаро")}</p>
              <p className="font-display text-[2.5rem] leading-none font-[600] tracking-[-0.03em]">{euro(room.deposit)}</p>
              <p className="text-muted-foreground mt-3 max-w-[40ch] text-[0.9375rem] text-pretty">
                {tr("За {type}. Приспада се от крайната цена. Карта, Apple Pay или Google Pay; сигурно плащане през Stripe.", { type: tr(projectTypeLabel(room.projectType)).toLowerCase() })}
              </p>
              {waiting ? (
                <p className="text-ice mt-6 flex items-center gap-2 text-[0.9375rem]">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {tr("Проверяваме плащането…")}
                </p>
              ) : room.canPay ? (
                <div className="mt-6">
                  <RainbowButton onClick={() => void pay()} disabled={paying}>
                    {paying ? tr("Отваряме плащането…") : tr("Плати капарото")}
                    {paying ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
                  </RainbowButton>
                </div>
              ) : (
                <p className="text-muted-foreground mt-6 text-sm">{tr("Плащането онлайн още не е включено. {who} ще ти пише на {email}.", { who: room.studioName, email: room.email })}</p>
              )}
              {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
            </section>
          ) : null}

          {paid ? (
            <section aria-label={tr("Капаро")} className="border-border bg-surface mt-8 flex items-start gap-4 rounded-3xl border p-6">
              <span className="bg-primary/20 text-ice grid size-10 shrink-0 place-items-center rounded-full">
                <Check aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-medium">{tr("Капарото е получено: {n}", { n: euro(room.deposit) })}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {room.paidAt ? fmtDateTime(room.paidAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : null}
                  {" · "}
                  {tr("Приспада се от крайната цена.")}
                </p>
              </div>
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

        <aside className="space-y-6 lg:pt-14">
          <section className="border-border bg-surface rounded-3xl border p-5">
            <p className="flex items-center gap-2 font-medium">
              <Mail aria-hidden="true" className="size-4" /> {tr("Какво следва")}
            </p>
            <ol className="text-muted-foreground mt-3 space-y-2.5 text-sm">
              {[
                tr("Основателят чете брифа ти — лично."),
                needsDeposit ? tr("Плащаш капарото тук.") : null,
                tr("Получаваш имейл на {email} с точна цена и план.", { email: room.email }),
                tr("Одобряваш и започваме."),
              ]
                .filter(Boolean)
                .map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-ice shrink-0 tabular-nums">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
            </ol>
          </section>

          <section className="border-border rounded-3xl border p-5 text-sm">
            <p className="font-medium">{tr("Запази този линк")}</p>
            <p className="text-muted-foreground mt-1">{tr("Брифът и капарото ти са тук. Отвори го по всяко време — от телефон или компютър.")}</p>
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
