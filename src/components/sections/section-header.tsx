import { cn } from "@/lib/utils";

/** Every section opens the same way: label → heading → lead. */
export function SectionHeader({
  label,
  title,
  lead,
  id,
  className,
}: {
  label: string;
  title: string;
  lead?: string;
  id?: string;
  className?: string;
}) {
  return (
    <header className={cn("max-w-[48rem]", className)}>
      <p className="eyebrow mb-5">{label}</p>
      <h2 id={id} className="font-display text-heading font-[300] tracking-[-0.025em] text-balance">
        {title}
      </h2>
      {lead ? (
        <p className="text-lead text-muted-foreground mt-6 max-w-[40ch] text-pretty">{lead}</p>
      ) : null}
    </header>
  );
}
