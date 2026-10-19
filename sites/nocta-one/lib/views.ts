import { frame, type Vec3 } from "./timeline";

/**
 * Still "studio" poses for product renders and covers: /?view=front etc.
 * They override the sampled frame; the page then shows the canvas only.
 */

type Pose = Partial<{ [K in keyof typeof frame]: (typeof frame)[K] }>;

const OFF: Vec3 = [0, -20, 0];

const base: Pose = {
  idle: 0,
  frameX: 0,
  camRoll: 0,
  shake: 0,
  ringsOpacity: 0,
  gridOpacity: 0.35,
  gridWarp: 0,
  caseBuild: 0,
  casePos: OFF,
  explode: 0,
  core: 0,
  touch: 0,
  led: 1,
  arc: 0,
  orbit: 0,
  bigCircle: 0,
  speed: 0,
  streaks: 0,
  tunnel: 0,
  flash: 0,
  bloom: 0.7,
};

export const VIEWS: Record<string, Pose> = {
  front: {
    ...base,
    camPos: [0, -0.12, 2.3],
    camTarget: [0, -0.18, 0],
    camFov: 30,
    budLPos: [-0.3, 0, 0],
    budLRot: [0.05, 0.4, 0.06],
    budRPos: [0.3, 0, 0],
    budRRot: [0.05, -0.4, -0.06],
  },
  "34": {
    ...base,
    camPos: [0, -0.1, 1.75],
    camTarget: [0, -0.2, 0],
    camFov: 30,
    budLPos: OFF,
    budRPos: [0, 0, 0],
    budRRot: [0.12, -0.85, 0.08],
    touch: 0.6,
  },
  exploded: {
    ...base,
    camPos: [0, 0.05, 2.15],
    camTarget: [0, -0.05, 0],
    camFov: 30,
    budLPos: OFF,
    budRPos: [0, 0, 0],
    budRRot: [0.25, 0.95, 0.1],
    explode: 1,
    core: 0.8,
    bloom: 1.2,
  },
  side: {
    ...base,
    camPos: [0, -0.15, 1.9],
    camTarget: [0, -0.2, 0],
    camFov: 30,
    budLPos: OFF,
    budRPos: [0, 0, 0],
    budRRot: [0, -1.57, 0],
  },
};

let active: Pose | null | undefined;
export function activeView() {
  if (active !== undefined) return active;
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(location.search).get("view");
  active = v && VIEWS[v] ? VIEWS[v] : null;
  return active;
}

export function applyView(pose: Pose) {
  const f = frame as Record<string, unknown>;
  for (const k in pose) f[k] = (pose as Record<string, unknown>)[k];
}
