import type { CSSProperties, ReactNode } from "react";

/** Три следи от нокти — знакът на марката. */
export function Claw({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden fill="currentColor">
      <path d="M14 2l4 1L7 38l-4-1z" />
      <path d="M23 2l4 1L16 38l-4-1z" />
      <path d="M32 2l4 1L25 38l-4-1z" />
    </svg>
  );
}

/** Безкрайна лента. Съдържанието се повтаря два пъти, за да няма шев. */
export function Tape({
  children,
  className = "",
  speed = 22,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  reverse?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <div className={`tape ${reverse ? "tape-rev" : ""}`} style={{ "--tape-speed": `${speed}s` } as CSSProperties}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0">{children}</div>
      </div>
    </div>
  );
}

export function TapeWords({ words, sep = "■" }: { words: string[]; sep?: string }) {
  return (
    <>
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center gap-6 pr-6 whitespace-nowrap">
          {w}
          <span className="opacity-70">{sep}</span>
        </span>
      ))}
    </>
  );
}

export function Eyebrow({ n, children, className = "" }: { n?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`label flex items-center gap-3 ${className}`}>
      {n && <span className="border-2 border-current px-1.5 py-0.5">{n}</span>}
      <span>{children}</span>
    </p>
  );
}
