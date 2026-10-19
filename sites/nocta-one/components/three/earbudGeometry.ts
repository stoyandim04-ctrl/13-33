import * as THREE from "three";
import { len3, meshSDF, raymarch, sdCapsule, sdEllipsoid, sdRoundBox, smax, smin, type V3 } from "@/lib/sdf";

/**
 * NOCTA One earbud, modelled as one moulded SDF so the head, nozzle and the
 * flat blade stem flow into each other like a real injection-moulded shell.
 *
 * Local frame (left bud; the right one is mirrored on X):
 * origin = centre of the head, the stem hangs down -Y, the nozzle and ear tip
 * point -Z (into the ear), the flat outer face with the touch pad looks +Z.
 */

/* ------------------------------------------------------------ the shape -- */

const NOZZLE_A: V3 = [-0.015, -0.01, -0.05];
const NOZZLE_B: V3 = [-0.058, -0.024, -0.178];
const STEM_TOP: V3 = [0.01, -0.07, 0.036];
const STEM_BOT: V3 = [0.028, -0.6, 0.066];

const nozzleAxis = norm(sub(NOZZLE_B, NOZZLE_A));
const stemAxis = norm(sub(STEM_BOT, STEM_TOP));
const stemLen = len3(...sub(STEM_BOT, STEM_TOP));
const stemMid: V3 = [(STEM_TOP[0] + STEM_BOT[0]) / 2, (STEM_TOP[1] + STEM_BOT[1]) / 2, (STEM_TOP[2] + STEM_BOT[2]) / 2];
// stem frame: Y along the stem, Z roughly forward
const stemZ = norm(cross([1, 0, 0], stemAxis.map((v) => -v) as V3));
const stemX = norm(cross(stemAxis.map((v) => -v) as V3, stemZ));

function headSDF(x: number, y: number, z: number) {
  let d = sdEllipsoid(x, y, z, 0.168, 0.158, 0.146);
  // the rear lobe that sits in the concha
  d = smin(d, sdEllipsoid(x + 0.024, y + 0.016, z + 0.058, 0.134, 0.124, 0.118), 0.07);
  // flat outer face for the touch surface
  d = smax(d, z - 0.102, 0.06);
  // nozzle into the ear canal
  d = smin(d, sdCapsule(x, y, z, NOZZLE_A, NOZZLE_B, 0.056), 0.055);
  // flatten the nozzle end where the tip clips on
  const ax = x - NOZZLE_B[0], ay = y - NOZZLE_B[1], az = z - NOZZLE_B[2];
  d = smax(d, ax * nozzleAxis[0] + ay * nozzleAxis[1] + az * nozzleAxis[2] - 0.016, 0.012);
  return d;
}

function stemSDF(x: number, y: number, z: number) {
  const px = x - stemMid[0], py = y - stemMid[1], pz = z - stemMid[2];
  const lx = px * stemX[0] + py * stemX[1] + pz * stemX[2];
  const ly = -(px * stemAxis[0] + py * stemAxis[1] + pz * stemAxis[2]); // up = +
  const lz = px * stemZ[0] + py * stemZ[1] + pz * stemZ[2];
  // blade: wider than deep, tapering a touch towards the tip
  const t = ly / (stemLen / 2); // -1 bottom .. 1 top
  const hw = 0.054 + 0.006 * t;
  const hd = 0.035 + 0.004 * t;
  return sdRoundBox(lx, ly, lz, hw, stemLen / 2, hd, 0.03);
}

/** body without the LED channel */
function shellRaw(x: number, y: number, z: number) {
  return smin(headSDF(x, y, z), stemSDF(x, y, z), 0.11);
}

/* the LED light pipe runs down the middle of the stem's front face */
function frontPoint(t: number): V3 {
  const p: V3 = [
    STEM_TOP[0] + (STEM_BOT[0] - STEM_TOP[0]) * t,
    STEM_TOP[1] + (STEM_BOT[1] - STEM_TOP[1]) * t,
    STEM_TOP[2] + (STEM_BOT[2] - STEM_TOP[2]) * t,
  ];
  const o: V3 = [p[0] + stemZ[0] * 0.3, p[1] + stemZ[1] * 0.3, p[2] + stemZ[2] * 0.3];
  const d: V3 = [-stemZ[0], -stemZ[1], -stemZ[2]];
  const hit = raymarch(shellRaw, o, d, 0.6);
  return [o[0] + d[0] * hit, o[1] + d[1] * hit, o[2] + d[2] * hit];
}

export const LED_TOP = frontPoint(0.26);
export const LED_BOT = frontPoint(0.93);

function shellSDF(x: number, y: number, z: number) {
  const groove = sdCapsule(x, y, z, LED_TOP, LED_BOT, 0.0075);
  return smax(shellRaw(x, y, z), -groove, 0.004);
}

/* ear tip: a soft mushroom on the nozzle with an open sound bore */
const TIP_C: V3 = [
  NOZZLE_B[0] + nozzleAxis[0] * 0.01,
  NOZZLE_B[1] + nozzleAxis[1] * 0.01,
  NOZZLE_B[2] + nozzleAxis[2] * 0.01,
];
function tipSDF(x: number, y: number, z: number) {
  const px = x - TIP_C[0], py = y - TIP_C[1], pz = z - TIP_C[2];
  const a = px * nozzleAxis[0] + py * nozzleAxis[1] + pz * nozzleAxis[2];
  const rx = px - nozzleAxis[0] * a, ry = py - nozzleAxis[1] * a, rz = pz - nozzleAxis[2] * a;
  const r = len3(rx, ry, rz);
  // dome, wider at the back
  let d = Math.sqrt((r / (0.08 - a * 0.25)) ** 2 + ((a - 0.01) / 0.056) ** 2) - 1;
  d *= 0.06;
  d = smax(d, -a - 0.026, 0.018);
  // the bore
  d = smax(d, -(r - 0.022), 0.007);
  return d;
}

/* ------------------------------------------------------------ builders -- */

let cache: ReturnType<typeof build> | null = null;
export function earbudGeometry() {
  return (cache ??= build());
}

function build() {
  const shell = meshSDF(shellSDF, [-0.21, -0.66, -0.26], [0.2, 0.19, 0.17], 0.0055);
  const tip = meshSDF(tipSDF, [TIP_C[0] - 0.1, TIP_C[1] - 0.1, TIP_C[2] - 0.1], [TIP_C[0] + 0.1, TIP_C[1] + 0.1, TIP_C[2] + 0.1], 0.0042);

  // LED pipe follows the groove
  const ledCurve = new THREE.LineCurve3(new THREE.Vector3(...LED_TOP), new THREE.Vector3(...LED_BOT));
  const led = new THREE.TubeGeometry(ledCurve, 1, 0.0046, 12, false);

  // touch face: where the flat face really sits
  const faceZ = raymarch(shellSDF, [0, 0.01, 0.4], [0, 0, -1], 1);
  const touchZ = 0.4 - faceZ + 0.0007;

  return {
    shell,
    tip,
    led,
    touchZ,
    tipCenter: TIP_C,
    nozzleAxis,
    stemFront: frontPoint(0.6),
  };
}

/* ------------------------------------------------------------- helpers -- */

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function norm(a: V3): V3 {
  const l = len3(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
