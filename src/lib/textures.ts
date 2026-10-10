// Material swatches drawn on a canvas - travertine, oak, linen - so the
// concept needs no photography. Deterministic: same picture on every visit.

export type MaterialId = "travertine" | "oak" | "linen";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function travertine(ctx: CanvasRenderingContext2D, size: number) {
  const r = seeded(11);
  ctx.fillStyle = "#e3d6c1";
  ctx.fillRect(0, 0, size, size);
  // sedimentary bands
  for (let i = 0; i < 70; i++) {
    const y = r() * size;
    const h = 2 + r() * 18;
    ctx.fillStyle = r() > 0.5 ? `rgba(196,174,140,${0.08 + r() * 0.16})` : `rgba(246,238,224,${0.1 + r() * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += size / 16) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 4);
    ctx.lineTo(size, y + h);
    ctx.lineTo(0, y + h);
    ctx.fill();
  }
  // pores, stretched along the bedding
  for (let i = 0; i < 900; i++) {
    const x = r() * size;
    const y = r() * size;
    const w = 1 + r() * 7;
    ctx.fillStyle = `rgba(150,124,92,${0.12 + r() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * (0.2 + r() * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function oak(ctx: CanvasRenderingContext2D, size: number) {
  const r = seeded(23);
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, "#b8946b");
  g.addColorStop(0.5, "#c6a27a");
  g.addColorStop(1, "#b18c63");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // grain: long wavy lines with a couple of cathedral arches
  for (let i = 0; i < 140; i++) {
    const x0 = r() * size;
    const amp = 2 + r() * 10;
    const freq = 0.004 + r() * 0.01;
    ctx.strokeStyle = r() > 0.3 ? `rgba(110,78,48,${0.12 + r() * 0.25})` : `rgba(232,206,170,${0.15 + r() * 0.2})`;
    ctx.lineWidth = 0.6 + r() * 1.8;
    ctx.beginPath();
    for (let y = 0; y <= size; y += 6) {
      const x = x0 + Math.sin(y * freq + i) * amp + Math.sin(y * 0.03) * 1.2;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(90,60,35,${0.1 + r() * 0.2})`;
    ctx.fillRect(r() * size, r() * size, 0.8, 3 + r() * 10);
  }
}

function linen(ctx: CanvasRenderingContext2D, size: number) {
  const r = seeded(37);
  ctx.fillStyle = "#e9e1d3";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    ctx.fillStyle = `rgba(160,146,124,${0.05 + r() * 0.16})`;
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 2) {
    ctx.fillStyle = `rgba(255,252,246,${0.04 + r() * 0.14})`;
    ctx.fillRect(x, 0, 1, size);
  }
  // slubs: the thick irregular threads that make linen read as linen
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(140,124,100,${0.12 + r() * 0.2})`;
    ctx.fillRect(r() * size, Math.floor(r() * size), 8 + r() * 40, 1.4);
  }
  // a soft fold of light
  const g = ctx.createLinearGradient(0, 0, size, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(0.6, "rgba(80,60,40,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
}

const painters = { travertine, oak, linen };
const cache = new Map<MaterialId, string>();

export function materialSwatch(id: MaterialId, size = 640) {
  const hit = cache.get(id);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  painters[id](ctx, size);
  const url = canvas.toDataURL("image/webp", 0.9);
  cache.set(id, url);
  return url;
}
