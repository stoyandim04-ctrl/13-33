import type { CSSProperties } from "react";

/** Splits text into words so each can rise in with a stagger (see .w in style.css). */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="w" style={{ "--w": from + i } as CSSProperties}>
          <span>{w}</span>
        </span>
      ))}
    </>
  );
}
