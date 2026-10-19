import gsap from "gsap";

/**
 * THE choreography. Every moving thing on the page is a channel here.
 *
 * A channel is a list of keys `[progress, value, ease?]`. The ease belongs to
 * the segment that ENDS at that key. Values are numbers or [x, y, z].
 * Progress runs 0 → 1 over the whole scroll and wraps: the value at 1 must
 * equal the value at 0, so the last frame is the hero again.
 *
 * World units: the case is ~1.7 wide. Each bud's origin is the centre of its
 * head; the stem hangs down -Y. Rotations are Euler XYZ in radians.
 */

export type Vec3 = [number, number, number];
type Value = number | Vec3;
type Key<T extends Value> = [p: number, v: T, ease?: string];

const PI = Math.PI;

/* ---------------------------------------------------------------- poses -- */

const HERO_CAM: Vec3 = [1.55, 1.25, 5.1];
const HERO_TARGET: Vec3 = [0, 0.02, 0];
const HERO_FOV = 30;

/** where the buds sit in the open case */
const SLOT_L: Vec3 = [-0.38, 0.12, 0.02];
const SLOT_R: Vec3 = [0.38, 0.12, 0.02];
const UP: Vec3 = [0, 0, 0];

/** hero lid angle (radians the lid is open) */
const LID_OPEN = 1.95;

/* ------------------------------------------------------------- channels -- */

export const channels = {
  /* camera ---------------------------------------------------------------- */
  camPos: [
    [0, HERO_CAM],
    [0.1, [1.35, 1.15, 4.7], "power1.inOut"],
    [0.16, [0.25, 0.35, 3.0], "expo.inOut"],
    [0.3, [0.05, 0.12, 3.1], "power1.inOut"],
    [0.46, [0.1, 0.05, 3.5], "power2.inOut"],
    [0.58, [0.35, 0.02, 2.55], "power3.inOut"],
    [0.62, [0.42, 0.02, 1.7], "expo.in"],
    [0.68, [0.36, 0.0, 1.05], "expo.out"],
    [0.74, [0.36, 0.0, 1.0]],
    [0.8, [0.0, 0.45, 4.6], "expo.inOut"],
    [0.88, [0.0, 0.55, 4.9], "power1.inOut"],
    [0.97, HERO_CAM, "power2.inOut"],
    [1, HERO_CAM],
  ] as Key<Vec3>[],

  camTarget: [
    [0, HERO_TARGET],
    [0.1, [0, 0.1, 0]],
    [0.16, [-0.15, 0.25, 0], "expo.inOut"],
    [0.3, [0.1, 0.0, 0], "power1.inOut"],
    [0.46, [0.0, 0.0, 0], "power2.inOut"],
    [0.58, [0.25, 0.0, 0.2], "power3.inOut"],
    [0.68, [0.36, 0.0, 0.0], "expo.out"],
    [0.74, [0.36, 0.0, 0.0]],
    [0.8, [0, 0.05, 0], "expo.inOut"],
    [0.97, HERO_TARGET, "power2.inOut"],
    [1, HERO_TARGET],
  ] as Key<Vec3>[],

  camFov: [
    [0, HERO_FOV],
    [0.16, 32, "expo.inOut"],
    [0.58, 32],
    [0.68, 26, "expo.out"],
    [0.74, 26],
    [0.8, 30, "expo.inOut"],
    [1, HERO_FOV],
  ] as Key<number>[],

  /** camera roll in radians, the 25° tilt of the lift-off lives here */
  camRoll: [
    [0, 0],
    [0.1, 0],
    [0.13, -0.32, "power3.out"],
    [0.18, 0.04, "power2.inOut"],
    [0.3, 0],
    [0.62, 0.08, "expo.in"],
    [0.68, -0.03, "expo.out"],
    [0.8, 0, "power2.inOut"],
    [1, 0],
  ] as Key<number>[],

  /**
   * Horizontal framing, fraction of the viewport the subject is pushed right
   * so the headline has room on the left. Mobile overrides this to 0.
   */
  frameX: [
    [0, 0.12],
    [0.16, 0.14],
    [0.58, 0.14],
    [0.66, 0.05, "power2.inOut"],
    [0.76, 0.05],
    [0.8, 0.0, "power2.inOut"],
    [0.97, 0.0],
    [1, 0.12, "power2.inOut"],
  ] as Key<number>[],

  /** camera shake amplitude */
  shake: [
    [0, 0],
    [0.68, 0],
    [0.705, 1, "power2.in"],
    [0.725, 0, "power2.out"],
    [0.775, 0],
    [0.785, 0.7, "power4.in"],
    [0.8, 0, "power2.out"],
    [1, 0],
  ] as Key<number>[],

  /** idle sway of the whole product group (hero only) */
  idle: [
    [0, 1],
    [0.08, 1],
    [0.12, 0, "power2.out"],
    [0.9, 0],
    [1, 1, "power2.inOut"],
  ] as Key<number>[],

  /* left bud ---------------------------------------------------------------- */
  budLPos: [
    [0, SLOT_L],
    [0.1, SLOT_L],
    [0.13, [-0.3, 1.05, 0.35], "power3.out"],
    [0.16, [-0.25, 0.25, 0.4], "expo.inOut"],
    [0.3, [-0.42, 0.05, 0.15], "power1.inOut"],
    [0.46, [-0.85, 0.05, -0.2], "power2.inOut"],
    [0.58, [-1.9, 0.4, -1.6], "power3.inOut"],
    [0.8, [-1.5, 0.3, -1.2], "power2.inOut"],
    [0.87, SLOT_L, "expo.inOut"],
    [1, SLOT_L],
  ] as Key<Vec3>[],

  budLRot: [
    [0, UP],
    [0.1, UP],
    [0.13, [0.35, 0.6, -0.5], "power3.out"],
    [0.16, [0.25, 0.9, -0.35], "expo.inOut"],
    [0.3, [0.15, 2.3, -0.2], "power1.inOut"],
    [0.46, [0.1, 3.4, -0.15], "power2.inOut"],
    [0.58, [0.3, 4.2, 0.2], "power3.inOut"],
    [0.8, [0.2, 5.2, 0.1], "power1.inOut"],
    [0.87, [0, 2 * PI, 0], "expo.inOut"],
    [0.875, UP],
    [1, UP],
  ] as Key<Vec3>[],

  /* right bud --------------------------------------------------------------- */
  budRPos: [
    [0, SLOT_R],
    [0.1, SLOT_R],
    // falls with the case, then waits off-frame on the right
    [0.16, [0.6, -3.4, -0.6], "expo.in"],
    [0.165, [3.6, -0.6, -1.8]],
    [0.2, [3.6, -0.6, -1.8]],
    [0.26, [0.6, 0.12, -0.35], "expo.out"],
    [0.3, [0.55, 0.1, -0.3], "power1.inOut"],
    [0.46, [0.72, 0.0, 0.1], "power2.inOut"],
    [0.58, [0.35, 0.02, 0.2], "power3.inOut"],
    [0.68, [0.36, 0.0, 0.0], "expo.out"],
    [0.8, [0.9, 0.1, -0.3], "expo.inOut"],
    [0.87, SLOT_R, "expo.inOut"],
    [1, SLOT_R],
  ] as Key<Vec3>[],

  budRRot: [
    [0, UP],
    [0.1, UP],
    [0.16, [-0.9, 0.4, 0.6], "expo.in"],
    [0.165, [0.3, -2.2, 0.4]],
    [0.2, [0.3, -2.2, 0.4]],
    [0.26, [0.15, -0.9, 0.15], "expo.out"],
    [0.3, [0.1, -0.6, 0.1], "power1.inOut"],
    // scene 3: stem and LED edge towards camera
    [0.46, [0.05, -1.1, 0.05], "power2.inOut"],
    // scene 4: flipped, outer touch face to camera
    [0.5, [0.05, 0.25, 0.0], "expo.inOut"],
    [0.58, [0.0, 0.45, 0.0], "power1.inOut"],
    // scene 5: side-on, the explode axis runs across the frame
    [0.64, [0.22, 1.0, 0.08], "expo.inOut"],
    [0.74, [0.24, 1.08, 0.08]],
    [0.8, [0.2, 3.4, 0.1], "expo.inOut"],
    [0.87, [0, 2 * PI, 0], "expo.inOut"],
    [0.875, UP],
    [1, UP],
  ] as Key<Vec3>[],

  /** 0 = assembled, 1 = fully exploded (right bud) */
  explode: [
    [0, 0],
    [0.62, 0],
    [0.7, 1, "expo.out"],
    [0.74, 1],
    [0.785, 0, "expo.in"],
    [1, 0],
  ] as Key<number>[],

  /** emissive of the power core, 0..1 */
  core: [
    [0, 0],
    [0.64, 0],
    [0.705, 1, "power3.in"],
    [0.74, 0.85],
    [0.78, 0.0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** LED strip on the stems, 0..1 lit from the bottom up */
  led: [
    [0, 0.35],
    [0.3, 0.35],
    [0.33, 0.0, "power2.in"],
    [0.4, 1, "power3.out"],
    [0.58, 1],
    [0.66, 0.5],
    [0.8, 0.35],
    [1, 0.35],
  ] as Key<number>[],

  /** touch surface pulse, 0..1 */
  touch: [
    [0, 0],
    [0.48, 0],
    [0.52, 1, "power3.out"],
    [0.57, 1],
    [0.6, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /* case -------------------------------------------------------------------- */
  casePos: [
    [0, [0, 0, 0]],
    [0.1, [0, 0, 0]],
    [0.16, [0.6, -3.6, -0.6], "expo.in"],
    [0.165, [0, 0, 0]],
    [1, [0, 0, 0]],
  ] as Key<Vec3>[],

  caseRot: [
    [0, UP],
    [0.1, UP],
    [0.16, [-0.9, 0.4, 0.6], "expo.in"],
    [0.165, UP],
    [1, UP],
  ] as Key<Vec3>[],

  caseLid: [
    [0, LID_OPEN],
    [1, LID_OPEN],
  ] as Key<number>[],

  /** 1 = solid glass, 0 = gone. Between: the case draws itself bottom-up. */
  caseBuild: [
    [0, 1],
    [0.16, 1],
    [0.165, 0],
    [0.88, 0],
    [0.935, 1, "power2.inOut"],
    [1, 1],
  ] as Key<number>[],

  /* environment -------------------------------------------------------------- */
  ringsOpacity: [
    [0, 1],
    [0.12, 1],
    [0.2, 0, "power2.in"],
    [0.92, 0],
    [0.97, 1, "power2.out"],
    [1, 1],
  ] as Key<number>[],

  /** 0 = wall behind the case, 1 = floor under the lift-off (rotateX ~75°) */
  ringsTilt: [
    [0, 0],
    [0.1, 0],
    [0.16, 1, "expo.inOut"],
    [0.92, 1],
    [0.925, 0],
    [1, 0],
  ] as Key<number>[],

  gridOpacity: [
    [0, 0],
    [0.13, 0],
    [0.18, 1, "power2.out"],
    [0.6, 1],
    [0.66, 0.35],
    [0.76, 0.35],
    [0.8, 1],
    [0.92, 1],
    [0.96, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** gravity well in the grid */
  gridWarp: [
    [0, 0],
    [0.8, 0],
    [0.88, 1, "power2.inOut"],
    [0.93, 1.6, "power3.in"],
    [0.97, 0, "power2.out"],
    [1, 0],
  ] as Key<number>[],

  particles: [
    [0, 1],
    [1, 1],
  ] as Key<number>[],

  /** thin arc with a dot, top right of scene 2 */
  arc: [
    [0, 0],
    [0.19, 0],
    [0.25, 1, "expo.out"],
    [0.3, 1],
    [0.33, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** orbit ring around the right bud (scenes 3–5) */
  orbit: [
    [0, 0],
    [0.31, 0],
    [0.38, 1, "expo.out"],
    [0.76, 1],
    [0.8, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** big centred circle that fills like a progress bar (scene 6) */
  bigCircle: [
    [0, 0],
    [0.8, 0],
    [0.88, 1, "power2.inOut"],
    [0.93, 1],
    [0.96, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** speed lines bottom right (scene 3) */
  speed: [
    [0, 0],
    [0.33, 0],
    [0.36, 1],
    [0.44, 1],
    [0.47, 0],
    [1, 0],
  ] as Key<number>[],

  /** warp streaks before the dive (scene 5) */
  streaks: [
    [0, 0],
    [0.585, 0],
    [0.615, 1, "power2.in"],
    [0.66, 0, "power2.out"],
    [1, 0],
  ] as Key<number>[],

  /** rings + wireframe tunnel that bloom out at the end */
  tunnel: [
    [0, 0],
    [0.925, 0],
    [0.955, 1, "power2.out"],
    [0.99, 0, "power2.in"],
    [1, 0],
  ] as Key<number>[],

  /** white flash that hides the cut back to the hero */
  flash: [
    [0, 0],
    [0.955, 0],
    [0.975, 0.55, "power2.in"],
    [1, 0, "power2.out"],
  ] as Key<number>[],

  bloom: [
    [0, 0.8],
    [0.6, 0.8],
    [0.705, 1.5, "power2.in"],
    [0.78, 0.8],
    [0.93, 0.9],
    [0.96, 1.8],
    [1, 0.8],
  ] as Key<number>[],
} satisfies Record<string, Key<Value>[]>;

export type Channel = keyof typeof channels;

/* ------------------------------------------------------------------ text -- */

/** Which headline is on screen. -1 = none. */
export const COPY_RANGES: [from: number, to: number, index: number][] = [
  [0, 0.105, 0],
  [0.15, 0.3, 1],
  [0.31, 0.46, 2],
  [0.47, 0.585, 3],
  [0.595, 0.78, 4],
  [0.985, 1.0001, 0],
];

/** Scene counter in the HUD (01 / 06 …) */
export const SCENES = [0, 0.13, 0.3, 0.46, 0.58, 0.8];

export function copyAt(p: number) {
  for (const [a, b, i] of COPY_RANGES) if (p >= a && p < b) return i;
  return -1;
}

export function sceneAt(p: number) {
  let s = 0;
  for (let i = 0; i < SCENES.length; i++) if (p >= SCENES[i]) s = i;
  return p > 0.985 ? 0 : s;
}

/* ---------------------------------------------------------- annotations -- */

export type Annotation = {
  id: string;
  /** anchor name, see `components/three/anchors` */
  anchor: string;
  label: string;
  sub?: string;
  /** label offset from the anchor, px (desktop) */
  dx: number;
  dy: number;
  from: number;
  to: number;
};

export const ANNOTATIONS: Annotation[] = [
  { id: "product", anchor: "case-top", label: "[ NOCTA ONE ]", dx: 120, dy: -70, from: -1, to: 0.1 },
  { id: "product-end", anchor: "case-top", label: "[ NOCTA ONE ]", dx: 120, dy: -70, from: 0.985, to: 2 },
  { id: "driver", anchor: "budR-head", label: "DRIVER Ø11 MM", sub: "DUAL-LAYER DIAPHRAGM", dx: 150, dy: -110, from: 0.355, to: 0.455 },
  { id: "anc", anchor: "budR-tip", label: "ANC −42 dB", sub: "6 MICS / ADAPTIVE", dx: -170, dy: 110, from: 0.37, to: 0.455 },
  { id: "bt", anchor: "budR-stem", label: "BT 6.0", sub: "LE AUDIO / LC3", dx: 160, dy: 90, from: 0.385, to: 0.455 },
  { id: "touch", anchor: "budR-touch", label: "TOUCH / HAPTIC", sub: "PRESS · SWIPE · HOLD", dx: 170, dy: -60, from: 0.5, to: 0.575 },
  { id: "hours", anchor: "budR-core", label: "40 H", sub: "WITH CASE", dx: 170, dy: -120, from: 0.68, to: 0.76 },
  { id: "ipx", anchor: "budR-core", label: "IPX5", sub: "SWEAT / RAIN", dx: -190, dy: 120, from: 0.69, to: 0.76 },
];

/* ------------------------------------------------------------- sampling -- */

const easeCache = new Map<string, (t: number) => number>();
function ease(name?: string) {
  if (!name) return (t: number) => t;
  let fn = easeCache.get(name);
  if (!fn) {
    fn = gsap.parseEase(name) as (t: number) => number;
    easeCache.set(name, fn);
  }
  return fn;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleKeys<T extends Value>(keys: Key<T>[], p: number, out?: Vec3): T {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1, e] = keys[i];
    if (p <= p1) {
      const [p0, v0] = keys[i - 1];
      const t = ease(e)(p1 === p0 ? 1 : (p - p0) / (p1 - p0));
      if (typeof v0 === "number") return lerp(v0, v1 as number, t) as T;
      const a = v0 as Vec3;
      const b = v1 as Vec3;
      const o = out ?? ([0, 0, 0] as Vec3);
      o[0] = lerp(a[0], b[0], t);
      o[1] = lerp(a[1], b[1], t);
      o[2] = lerp(a[2], b[2], t);
      return o as T;
    }
  }
  return keys[keys.length - 1][1];
}

type Frame = { [K in Channel]: (typeof channels)[K][number][1] };

/** One reusable frame object, filled in place every tick. */
export const frame = {} as Frame;
for (const k in channels) {
  const keys = channels[k as Channel];
  const v = keys[0][1];
  (frame as Record<string, Value>)[k] = typeof v === "number" ? v : ([...v] as Vec3);
}

export function sample(progress: number): Frame {
  const p = ((progress % 1) + 1) % 1;
  for (const k in channels) {
    const key = k as Channel;
    const keys = channels[key] as Key<Value>[];
    const cur = (frame as Record<string, Value>)[key];
    const v = sampleKeys(keys, p, typeof cur === "number" ? undefined : (cur as Vec3));
    if (typeof v === "number") (frame as Record<string, Value>)[key] = v;
  }
  return frame;
}

/** Dev check: the loop only works if every channel ends where it starts. */
export function assertLoop() {
  const bad: string[] = [];
  for (const k in channels) {
    const keys = channels[k as Channel] as Key<Value>[];
    const a = keys[0][1];
    const b = keys[keys.length - 1][1];
    if (keys[keys.length - 1][0] !== 1) bad.push(`${k}: last key is not at 1`);
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${k}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
  }
  return bad;
}
