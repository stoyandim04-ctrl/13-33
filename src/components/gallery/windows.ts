import { projects, windowMedia } from "@/data/projects";
import type { GalleryWindow } from "@/components/gallery/scene";

/** The windows of the gallery, every project in turn so neighbours differ.
    On a phone: at most two per project. */
export function galleryWindows(phone: boolean): (GalleryWindow & { webm: string })[] {
  const lists = projects.map((p, project) =>
    Array.from({ length: phone ? Math.min(2, p.windows) : p.windows }, (_, i) => ({ project, ...windowMedia(p.slug, i + 1) })),
  );
  const out: (GalleryWindow & { webm: string })[] = [];
  const rounds = Math.max(...lists.map((l) => l.length));
  for (let r = 0; r < rounds; r++) for (const l of lists) if (l[r]) out.push(l[r]);
  return out;
}
