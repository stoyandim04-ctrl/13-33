// The mark: two „3“ drawn from slanted bands with rounded corners, electric
// blue → cyan. One outline feeds the flat SVG (header, favicon:
// scripts/build-favicon.mjs) and the extruded 3D logo in the gallery
// (components/gallery/scene.ts).
//
// NOTE: drawn from the brief's description. When public/brand/logo-mark.png
// arrives, trace it here; the SVG, the favicon and the 3D logo follow.

export const MARK_BLUE = "#246BFF";
export const MARK_CYAN = "#44C8FF";

type Pt = [number, number];

const T = 0.26; // band thickness
const W = 0.92; // width of one figure
const H = 1.42; // height
const GAP = 0.2; // between the figures
const SLANT = 0.24; // x shift per unit of height
const R = 0.07; // corner radius

/** One „3“ as a closed polygon, y up, before the slant. */
function three(x0: number): Pt[] {
  const m = H / 2;
  const pts: Pt[] = [
    [0, H],
    [W, H],
    [W, 0],
    [0, 0],
    [0, T],
    [W - T, T],
    [W - T, m - T / 2],
    [0.28, m - T / 2],
    [0.28, m + T / 2],
    [W - T, m + T / 2],
    [W - T, H - T],
    [0, H - T],
  ];
  return pts.map(([x, y]) => [x0 + x + y * SLANT, y]);
}

/** The two figures, centred on the origin, height 1. */
export const MARK_POLYGONS: Pt[][] = (() => {
  const polys = [three(0), three(W + GAP)];
  const xs = polys.flat().map((p) => p[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  return polys.map((poly) => poly.map(([x, y]) => [(x - cx) / H, (y - H / 2) / H] as Pt));
})();

export const MARK_ASPECT = (() => {
  const xs = MARK_POLYGONS.flat().map((p) => p[0]);
  return Math.max(...xs) - Math.min(...xs);
})();

export interface PathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
}

/** Traces a polygon with rounded corners into any path-like sink. */
export function tracePolygon(sink: PathSink, poly: Pt[], r = R / H) {
  const n = poly.length;
  const at = (i: number) => poly[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const [px, py] = at(i - 1);
    const [cx, cy] = at(i);
    const [nx, ny] = at(i + 1);
    const l1 = Math.hypot(cx - px, cy - py);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const k = Math.min(r, l1 / 2, l2 / 2);
    const a: Pt = [cx - ((cx - px) / l1) * k, cy - ((cy - py) / l1) * k];
    const b: Pt = [cx + ((nx - cx) / l2) * k, cy + ((ny - cy) / l2) * k];
    if (i === 0) sink.moveTo(a[0], a[1]);
    else sink.lineTo(a[0], a[1]);
    sink.quadraticCurveTo(cx, cy, b[0], b[1]);
  }
}

/** SVG path data, y down, in a box of MARK_ASPECT × 1. */
export const MARK_PATH = (() => {
  let d = "";
  const f = (v: number) => v.toFixed(4);
  const ox = MARK_ASPECT / 2;
  const sink: PathSink = {
    moveTo: (x, y) => (d += `M${f(x + ox)} ${f(0.5 - y)}`),
    lineTo: (x, y) => (d += `L${f(x + ox)} ${f(0.5 - y)}`),
    quadraticCurveTo: (cx, cy, x, y) => (d += `Q${f(cx + ox)} ${f(0.5 - cy)} ${f(x + ox)} ${f(0.5 - y)}`),
  };
  for (const poly of MARK_POLYGONS) {
    tracePolygon(sink, poly);
    d += "Z";
  }
  return d;
})();
