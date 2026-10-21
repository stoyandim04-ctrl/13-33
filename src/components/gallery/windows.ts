import { projects, windowMedia } from "@/data/projects";
import type { GalleryWindow } from "@/components/gallery/scene";

/** The windows of the gallery, every project in turn so neighbours differ.
    On a phone: two per project (the first laptop clip and the phone view). */
export function galleryWindows(phone: boolean): (GalleryWindow & { webm: string })[] {
  const lists = projects.map((p, project) => {
    const ns = Array.from({ length: p.windows }, (_, i) => i + 1);
    const pick = phone ? [ns[0], ns[ns.length - 1]] : ns;
    return pick.map((n) => ({ project, ...windowMedia(p.slug, n) }));
  });
  const out: (GalleryWindow & { webm: string })[] = [];
  const rounds = Math.max(...lists.map((l) => l.length));
  for (let r = 0; r < rounds; r++) for (const l of lists) if (l[r]) out.push(l[r]);
  return out;
}
