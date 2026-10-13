import { useEffect, useState } from "react";

/*
  Кадрите на завъртането: /img/spin/<slug>/00.webp … (n-1).webp, прозрачен фон,
  кадър 0 = лице, n/2 = гръб, n → обратно лице. Зареждат се веднъж и се пазят
  в паметта; рисуват се в canvas, за да е смяната мигновена.
*/
const cache = new Map<string, HTMLImageElement[]>();
const ready = new Map<string, Promise<void>>();

export function spinFrames(slug: string, n: number): HTMLImageElement[] {
  let list = cache.get(slug);
  if (!list) {
    list = Array.from({ length: n }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = `/img/spin/${slug}/${String(i).padStart(2, "0")}.webp`;
      return img;
    });
    cache.set(slug, list);
    ready.set(
      slug,
      Promise.all(list.map((im) => (im.complete ? Promise.resolve() : new Promise<void>((r) => ((im.onload = () => r()), (im.onerror = () => r())))))).then(
        () => undefined,
      ),
    );
  }
  return list;
}

/** Зарежда кадрите и казва кога са готови. */
export function useSpin(slug: string, n: number, enabled = true) {
  const [loaded, setLoaded] = useState(() => n > 0 && cache.has(slug) && cache.get(slug)!.every((i) => i.complete));
  useEffect(() => {
    if (!enabled || n === 0) return;
    let live = true;
    spinFrames(slug, n);
    ready.get(slug)!.then(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [slug, n, enabled]);
  return { frames: n > 0 ? cache.get(slug) ?? null : null, loaded };
}

/** Рисува кадър (0..n, дробно — закръгля се) в canvas с „contain“, центриран или опрян горе (на закачалка). */
export function drawFrame(canvas: HTMLCanvasElement, frames: HTMLImageElement[], f: number, align: "center" | "top" = "center") {
  const n = frames.length;
  const i = ((Math.round(f) % n) + n) % n;
  const img = frames[i];
  if (!img.complete || !img.naturalWidth) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (w - dw) / 2, align === "top" ? 0 : (h - dh) / 2, dw, dh);
}
