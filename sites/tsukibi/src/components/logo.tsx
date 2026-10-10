import { useId } from "react";

/** Знакът на Цукиби: полумесец (月) и пламък (火) в празното място. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <mask id={`m${id}`}>
          <rect width="64" height="64" fill="#fff" />
          <circle cx="41" cy="25" r="21" fill="#000" />
        </mask>
      </defs>
      <circle cx="31" cy="33" r="23" fill="currentColor" mask={`url(#m${id})`} />
      <path
        className="logo-flame"
        d="M41 50c-6.6 0-10-5.6-7.6-10.8 1.4-3 4-4.2 3.7-8.4 4 2.4 5 5 4.6 7.6 2-1 3-3 3-5.6 3.6 3 4.7 7.6 3.7 11.2-1 3.6-3.6 6-7.4 6z"
        fill="var(--color-ember)"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] font-medium tracking-[0.32em]">TSUKIBI</span>
        <span className="mt-1 text-[0.6rem] tracking-[0.42em] text-muted">月火 · СОФИЯ</span>
      </span>
    </span>
  );
}
