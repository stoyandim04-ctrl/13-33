// /zapitvane/:token - the client's private room. A real person (the founder)
// answers here; the price, the deadline and the deposit arrive as an offer.
import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Check, Copy, Loader2, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingPicker, BriefCard, Bubble, Composer, OfferCard, StatusSteps, usePoll } from "@/components/inquiry/parts";
import { ApiError, errorText, fmtDateTime, getRoom, roomAction, uploadFile } from "@/lib/inquiry-api";
import type { Room } from "@/lib/inquiry-shared";

export default function RoomPage() {
  const { token = "" } = useParams();
  const [room, setRoom] = React.useState<Room | null>(null);
  const [missing, setMissing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [booking, setBooking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showBrief, setShowBrief] = React.useState(false);
  const end = React.useRef<HTMLDivElement>(null);
  const count = room?.messages.length ?? 0;

  const load = React.useCallback(async () => {
    try {
      setRoom(await getRoom(token));
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else setError(errorText(e));
    }
  }, [token]);

  React.useEffect(() => {
    document.title = "Твоят проект — 13:33";
    void load();
  }, [load]);
  usePoll(load, 6000);

  React.useEffect(() => {
    if (count) end.current?.scrollIntoView({ block: "nearest" });
  }, [count]);

  if (missing) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-36 pb-24 text-center">
        <h1 className="font-display text-3xl font-[500]">Не намерихме този чат</h1>
        <p className="text-muted-foreground mt-4">Провери дали линкът е пълен. Можеш и да започнеш ново запитване.</p>
        <Link to="/zapochni" className="text-ice mt-6 inline-block underline">Започни проект</Link>
      </div>
    );
  }
  if (!room) {
    return (
      <div className="text-muted-foreground flex h-svh items-center justify-center gap-2">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {error || "Зареждане…"}
      </div>
    );
  }

  const upcoming = room.bookings.filter((b) => b.status === "booked" && new Date(b.starts_at).getTime() > Date.now() - 3600_000);
  const link = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="px-5 pt-24 pb-10 sm:px-8 md:pt-32">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_20rem]">
        {/* Chat */}
        <section aria-label="Чат" className="min-w-0">
          <p className="eyebrow mb-3">Проект №{room.number} · {room.projectType}</p>
          <h1 className="font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] leading-tight font-[500] tracking-[-0.035em]">
            Здравей, {room.name}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-[0.9375rem]">
            <span className="relative flex size-2.5">
              <span className="bg-ice/60 absolute inline-flex size-full animate-ping rounded-full" />
              <span className="bg-ice relative inline-flex size-2.5 rounded-full" />
            </span>
            {room.studioName} ти отговаря лично — човек, не бот.
          </p>

          <div className="mt-8">
            <StatusSteps status={room.status} />
          </div>

          {room.offer ? (
            <div className="mt-8">
              <OfferCard
                offer={room.offer}
                status={room.status}
                onAccept={async () => {
                  try {
                    await roomAction(token, "accept");
                    await load();
                  } catch (e) {
                    setError(errorText(e));
                  }
                }}
              />
            </div>
          ) : null}

          <div className="border-border mt-8 min-h-[16rem] border-t pt-4" aria-live="polite">
            {room.messages.map((m) => (
              <Bubble key={m.id} message={m} mine={m.sender === "client"} who={m.sender === "studio" ? room.studioName : undefined} />
            ))}
            <div ref={end} />
          </div>

          <div className="bg-background/90 sticky bottom-0 -mx-1 px-1 pt-3 pb-4 backdrop-blur">
            {error ? <p className="text-destructive mb-2 text-sm">{error}</p> : null}
            <Composer
              upload={(file) => uploadFile(file, { token })}
              onSend={async (text, files) => {
                try {
                  await roomAction(token, "message", { body: text, files: files.map((f) => f.path) });
                  await load();
                } catch (e) {
                  setError(errorText(e));
                  throw e;
                }
              }}
            />
          </div>
        </section>

        {/* Side: meeting, link, brief */}
        <aside className="space-y-6 lg:pt-14">
          <section className="border-border bg-surface rounded-3xl border p-5">
            <p className="flex items-center gap-2 font-medium">
              <Video aria-hidden="true" className="size-4" /> Онлайн среща
            </p>
            {upcoming.length ? (
              <ul className="mt-3 space-y-3">
                {upcoming.map((b) => (
                  <li key={b.id} className="bg-surface-2 rounded-2xl p-3 text-sm">
                    <p className="font-medium">{fmtDateTime(b.starts_at, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                    {b.meet_url ? (
                      <a href={b.meet_url} target="_blank" rel="noreferrer" className="text-ice mt-1 inline-block underline">
                        Влез в срещата
                      </a>
                    ) : (
                      <p className="text-muted-foreground mt-1">Линкът ще дойде в чата.</p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Да откажа ли тази среща?")) return;
                        try {
                          await roomAction(token, "cancel", { id: b.id });
                          await load();
                        } catch (e) {
                          setError(errorText(e));
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs"
                    >
                      <X aria-hidden="true" className="size-3" /> Откажи
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">30 минути разговор, за да обсъдим идеята ти на живо.</p>
            )}
            {booking ? (
              <div className="mt-4">
                <BookingPicker
                  token={token}
                  onBooked={() => {
                    setBooking(false);
                    void load();
                  }}
                />
              </div>
            ) : upcoming.length < 2 ? (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setBooking(true)}>
                <CalendarDays aria-hidden="true" /> Запази среща
              </Button>
            ) : null}
          </section>

          <section className="border-border rounded-3xl border p-5 text-sm">
            <p className="font-medium">Запази този линк</p>
            <p className="text-muted-foreground mt-1">Тук ще ти пишем. Отвори го по всяко време — от телефон или компютър.</p>
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
                  window.prompt("Копирай линка:", link);
                }
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Копирано" : "Копирай линка"}
            </Button>
          </section>

          <section>
            <button type="button" onClick={() => setShowBrief((v) => !v)} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
              {showBrief ? "Скрий брифа" : "Виж брифа си"}
            </button>
            {showBrief ? <BriefCard brief={room.brief} className="mt-3" /> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
