"use client";

/**
 * An Apple-style image sequence: WebP frames drawn to a canvas by scroll.
 * Frames arrive progressively — every 4th first so the scrub is usable at
 * once, then the gaps — and a missing frame falls back to the nearest one
 * already decoded.
 */
export type Sequence = {
  count: number;
  frames: (ImageBitmap | HTMLImageElement | null)[];
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
  count: number,
  variant: "d" | "m",
  onFrame?: () => void,
): Sequence {
  const frames: Sequence["frames"] = new Array(count).fill(null);
  let alive = true;

  const order: number[] = [];
  for (const step of [4, 2, 1]) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);

  const load = (i: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        if (!alive) return resolve();
        try {
          frames[i] = "createImageBitmap" in window ? await createImageBitmap(img) : img;
        } catch {
          frames[i] = img;
        }
        onFrame?.();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = frameUrl(scene, variant, i);
    });

  // a few requests in flight at a time, in progressive order
  let cursor = 0;
  const worker = async () => {
    while (alive && cursor < order.length) await load(order[cursor++]);
  };
  for (let k = 0; k < 6; k++) worker();

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
    count,
    frames,
    draw(ctx, progress) {
      const i = Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1))));
      const f = nearest(i);
      if (!f || f === last) return;
      last = f;
      const { width: cw, height: ch } = ctx.canvas;
      const fw = f.width;
      const fh = f.height;
      const s = Math.max(cw / fw, ch / fh);
      const w = fw * s;
      const h = fh * s;
      ctx.drawImage(f, (cw - w) / 2, (ch - h) / 2, w, h);
    },
    reset() {
      last = null;
    },
    dispose() {
      alive = false;
      frames.forEach((f) => f && "close" in f && (f as ImageBitmap).close());
    },
  };
}
