import type { ReactNode } from "react";

/** Every section opens the same way: eyebrow → heading → lead. */
export function SectionHead({ eyebrow, title, lead, id }: { eyebrow: string; title: ReactNode; lead?: ReactNode; id?: string }) {
  return (
    <header className="max-w-[46rem]" data-reveal>
      <p className="eyebrow text-mute">{eyebrow}</p>
      <h2 id={id} className="mt-5 font-display text-heading font-light text-balance">
        {title}
      </h2>
      {lead && <p className="mt-6 max-w-[34rem] text-lead text-mute text-pretty">{lead}</p>}
    </header>
  );
}
