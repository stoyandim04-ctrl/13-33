"use client";

/**
 * An Apple-style image sequence: WebP frames drawn to a canvas by scroll.
 * Frames arrive progressively — every 4th first so the scrub is usable at
 * once, then the gaps — and a missing frame falls back to the nearest one
 * already loaded. Frames stay as compressed <img>s (never ImageBitmaps):
 * the browser may drop their decoded pixels under memory pressure, which is
 * what keeps iOS Safari from killing the tab. Phones take every 2nd frame.
 */
export type Sequence = {
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void;
  /** Forget the last drawn frame (after the canvas was resized). */
  reset: () => void;
  dispose: () => void;
};

const pad = (n: number) => String(n).padStart(4, "0");

export function frameUrl(scene: string, variant: "d" | "m", i: number) {
  return `/seq/${scene}/${variant}/${pad(i + 1)}.webp`;
}

export function createSequence(
  scene: string,
  total: number,
  variant: "d" | "m",
  onFrame?: () => void,
): Sequence {
  const stride = variant === "m" ? 2 : 1;
  const count = Math.ceil(total / stride);
  const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
  const pending = new Set<HTMLImageElement>();
  let alive = true;

  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [4, 2, 1])
    for (let i = 0; i < count; i += step)
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }

  const load = (i: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      pending.add(img);
      img.decoding = "async";
      img.onload = () => {
        pending.delete(img);
        if (alive) {
          frames[i] = img;
          onFrame?.();
        }
        resolve();
      };
      img.onerror = () => {
        pending.delete(img);
        resolve();
      };
      img.src = frameUrl(scene, variant, i * stride);
    });

  // a few requests in flight at a time, in progressive order
  let cursor = 0;
  const worker = async () => {
    while (alive && cursor < order.length) await load(order[cursor++]);
  };
  for (let k = 0; k < (variant === "m" ? 3 : 6); k++) worker();

  const nearest = (i: number) => {
    if (frames[i]) return frames[i];
    for (let d = 1; d < count; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  };

  let last: unknown = null;
  return {
    draw(ctx, progress) {
      const i = Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1))));
      const f = nearest(i);
      if (!f || f === last) return;
      last = f;
      const { width: cw, height: ch } = ctx.canvas;
      const s = Math.max(cw / f.naturalWidth, ch / f.naturalHeight);
      const w = f.naturalWidth * s;
      const h = f.naturalHeight * s;
      ctx.drawImage(f, (cw - w) / 2, (ch - h) / 2, w, h);
    },
    reset() {
      last = null;
    },
    dispose() {
      alive = false;
      // let the browser free everything this sequence held
      pending.forEach((img) => (img.src = ""));
      frames.forEach((img) => img && (img.src = ""));
      frames.fill(null);
    },
  };
}
