import type { ReactNode } from "react";
import { scene, type SceneId } from "@/lib/timeline";

/** A full-screen stage. The master timeline decides when it is seen. */
export default function Stage({
  id,
  children,
  className = "",
}: {
  id: SceneId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={`stage-${id}`} aria-label={scene(id).title} className={`stage ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ id, children }: { id: SceneId; children?: ReactNode }) {
  const s = scene(id);
  return (
    <p className="label flex items-baseline gap-4 text-petal/55">
      <span className="font-serif text-[0.95rem] italic normal-case tracking-normal text-rosegold">{s.index}</span>
      <span className="h-px w-8 translate-y-[-0.3em] bg-petal/25" />
      {children ?? s.title}
    </p>
  );
}
