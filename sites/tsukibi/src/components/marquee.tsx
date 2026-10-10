/** Безкрайна лента с текст. */
export function Marquee({ items, small = false }: { items: string[]; small?: boolean }) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className={small ? "px-6 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted" : "px-8 font-display text-[clamp(2.5rem,1.5rem+4vw,6rem)] italic leading-none text-bone"}>
            {t}
          </span>
          <span className={small ? "h-1 w-1 rounded-full bg-ember" : "h-3 w-3 rounded-full bg-ember"} />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden ${small ? "py-3" : "py-6"}`}>
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
