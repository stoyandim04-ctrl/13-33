import * as React from "react";
import { ArrowUp } from "lucide-react";

import type { AiBriefClient, AiBriefTurn, ProjectBrief } from "@/lib/brief";
import { Button } from "@/components/ui/button";

/** Rendered only when VITE_AI_BRIEF_ENDPOINT is configured. Every reply shown
    here comes from that server route - there are no scripted answers. */
export function AiBriefChat({
  client,
  onBrief,
}: {
  client: AiBriefClient;
  onBrief: (brief: Partial<ProjectBrief>) => void;
}) {
  const [turns, setTurns] = React.useState<AiBriefTurn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // Lives inside the inquiry <form>, so it cannot be a form of its own.
  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...turns, { role: "visitor" as const, text }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    setFailed(false);
    try {
      const res = await client.next(next);
      onBrief(res.brief);
      if (res.reply) setTurns((t) => [...t, { role: "assistant", text: res.reply as string }]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface border-border mt-8 rounded-md border p-5">
      <p className="eyebrow mb-3">Разкажи свободно</p>
      <p className="text-muted-foreground text-sm">
        AI асистент ще зададе уточняващи въпроси и ще попълни брифа. Провери стъпките отдолу преди изпращане.
      </p>
      {turns.length ? (
        <ul className="mt-5 max-h-72 space-y-3 overflow-auto text-[0.9375rem]" aria-live="polite">
          {turns.map((t, i) => (
            <li key={i} className={t.role === "visitor" ? "text-foreground" : "text-ice"}>
              <span className="sr-only">{t.role === "visitor" ? "Ти: " : "Асистент: "}</span>
              {t.text}
            </li>
          ))}
        </ul>
      ) : null}
      {failed ? <p className="text-destructive mt-3 text-sm">Асистентът не отговори. Продължи с въпросника.</p> : null}
      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="ai-brief-input">Съобщение</label>
        <input
          id="ai-brief-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          className="border-foreground/20 focus:border-ice h-11 flex-1 rounded-full border bg-transparent px-4 text-sm outline-none"
          placeholder="Напр. Имам клиника и искам повече записвания онлайн…"
        />
        <Button size="icon" aria-label="Изпрати" disabled={busy} onClick={() => void send()}>
          <ArrowUp aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
