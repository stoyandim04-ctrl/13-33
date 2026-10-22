import * as THREE from "three";
import * as T from "./textures";

/*
  Калибър K-13 — механизмът е истински, не е анимиран „на ръка“.

  Мерките са в милиметри. Платината лежи в z = 0; ходовата част (барабан,
  колела, ход, баланс) е към +z, капакът със стъкло — z ≈ 6.6. Към −z са
  стрелковият механизъм, циферблатът и предното стъкло.

  Има една-единствена движеща величина: фазата на баланса. Балансът се люлее
  синусоидално (2.5 Hz = 18 000 удара в час). При всяко минаване през нулата
  анкерът се обръща и пуска ходовото колело с един зъб (12°). От ъгъла на
  ходовото колело следват всички останали — барабан → централно → трето →
  четвърто → ходово, като всяко зацепване се смята от реалните брой зъби
  и позиции (`meshAngle`), така че зъбите винаги влизат един в друг.

  Стрелките седят на стрелковото колело с триене (както в истинския часовник):
  въртенето им не спира ходовата част — затова финалът може да ги нагласи на 13:33.
*/

const TAU = Math.PI * 2;
export const BEAT = 0.2; // s — 18 000 удара в час
const FREQ = 2.5; // Hz
const AMP = 3.9; // rad — около 225° от всяка страна

type V2 = { x: number; y: number };
const add = (p: V2, d: number, a: number): V2 => ({ x: p.x + d * Math.cos(a), y: p.y + d * Math.sin(a) });
const angleTo = (a: V2, b: V2) => Math.atan2(b.y - a.y, b.x - a.x);

/** Ъгълът на задвижваното колело, така че зъб на A да влиза в празнина на B по линията на центровете. */
export function meshAngle(thA: number, zA: number, zB: number, beta: number) {
  return beta + Math.PI - Math.PI / zB + (zA / zB) * (beta - thA);
}

/* ---------------- Разположение ---------------- */

// Зъби и модули — числата се показват и на страницата.
export const TRAIN = {
  barrel: { z: 80, m: 0.13 },
  centerPinion: { z: 10 },
  center: { z: 80, m: 0.1 },
  thirdPinion: { z: 10 },
  third: { z: 75, m: 0.09 },
  fourthPinion: { z: 10 },
  fourth: { z: 80, m: 0.07 },
  escapePinion: { z: 8 },
  escape: { z: 15 },
  cannon: { z: 12, m: 0.08 },
  minute: { z: 36 },
  minutePinion: { z: 10, m: 0.1 },
  hour: { z: 40 },
};
const pr = (z: number, m: number) => (z * m) / 2; // делителен радиус

function layout() {
  const c: V2 = { x: 0, y: 0 };
  const raw = {
    center: c,
    barrel: add(c, pr(80, 0.13) + pr(10, 0.13), (150 * Math.PI) / 180),
    third: add(c, pr(80, 0.1) + pr(10, 0.1), (-30 * Math.PI) / 180),
  } as Record<string, V2>;
  raw.fourth = add(raw.third, pr(75, 0.09) + pr(10, 0.09), (-100 * Math.PI) / 180);
  raw.escape = add(raw.fourth, pr(80, 0.07) + pr(8, 0.07), 0);
  raw.pallet = add(raw.escape, 2.3, (50 * Math.PI) / 180);
  raw.balance = add(raw.pallet, 2.25, (50 * Math.PI) / 180);
  // Завъртаме целия план така, че малката секундарка (четвъртото колело) да е на 6 часа отпред.
  const fa = Math.atan2(raw.fourth.y, raw.fourth.x);
  const R = -Math.PI / 2 - fa;
  const out = {} as Record<string, V2>;
  for (const k in raw) {
    const p = raw[k];
    out[k] = { x: p.x * Math.cos(R) - p.y * Math.sin(R), y: p.x * Math.sin(R) + p.y * Math.cos(R) };
  }
  // Минутното колело на стрелковия механизъм (от страната на циферблата).
  out.minute = add(out.center, pr(12, 0.08) + pr(36, 0.08), (200 * Math.PI) / 180);
  return out as Record<
    "center" | "barrel" | "third" | "fourth" | "escape" | "pallet" | "balance" | "minute",
    V2
  >;
}
export const POS = layout();

// Височини (z) на слоевете.
export const Z = {
  plateTop: 0,
  plateBot: -0.7,
  layerA: 0.9,
  layerB: 1.9,
  bridge: 3.6,
  bridgeT: 0.55,
  balance: 3.0,
  cock: 4.5,
  back: 6.6,
  motion: -1.2,
  dial: -2.3,
  hands: -2.7,
  front: -4.3,
};
export const CASE_R = 16.2;
export const DIAL_R = 15.6;

/* ---------------- Материали ---------------- */

export function materials(lite: boolean) {
  const perl = T.perlage();
  const cot = T.cotes();
  const ray = T.sunray();
  const grain = T.graining();
  // Цветовете на металите са близо до измерените (позлата, родий, полирана стомана).
  return {
    gold: new THREE.MeshPhysicalMaterial({ color: 0xe3bd72, metalness: 1, roughness: 0.3, roughnessMap: grain, specularIntensity: 1 }),
    goldDark: new THREE.MeshPhysicalMaterial({ color: 0xc9a05c, metalness: 1, roughness: 0.36, roughnessMap: grain }),
    rose: new THREE.MeshStandardMaterial({ color: 0xe6b49a, metalness: 1, roughness: 0.28 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc8ccd1, metalness: 1, roughness: 0.07 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x9da1a8, metalness: 1, roughness: 0.5, roughnessMap: perl, bumpMap: perl, bumpScale: 0.12 }),
    bridge: new THREE.MeshStandardMaterial({ color: 0xc7cacf, metalness: 1, roughness: 0.34, roughnessMap: cot, bumpMap: cot, bumpScale: 0.08 }),
    sunray: new THREE.MeshStandardMaterial({ color: 0xbfc2c7, metalness: 1, roughness: 0.32, roughnessMap: ray }),
    blued: new THREE.MeshStandardMaterial({ color: 0x24409a, metalness: 0.9, roughness: 0.16 }),
    ruby: lite
      ? new THREE.MeshStandardMaterial({ color: 0xc0102c, metalness: 0.1, roughness: 0.05, emissive: 0x4a0010 })
      : new THREE.MeshPhysicalMaterial({
          color: 0xd0142e,
          metalness: 0,
          roughness: 0.04,
          transmission: 0.55,
          thickness: 0.4,
          ior: 1.77,
          attenuationColor: new THREE.Color(0x8a0016),
          attenuationDistance: 0.5,
          clearcoat: 1,
          emissive: 0x080002,
        }),
    platinum: new THREE.MeshStandardMaterial({ color: 0xd8dadd, metalness: 1, roughness: 0.09 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.04,
      clearcoat: 1,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    handGold: new THREE.MeshStandardMaterial({ color: 0xe9c47c, metalness: 1, roughness: 0.1 }),
  };
}
export type Mats = ReturnType<typeof materials>;

/* ---------------- Геометрия ---------------- */

type GearOpts = {
  teeth: number;
  module: number;
  thickness: number;
  spokes?: number; // 0 = плътно
  hole?: number; // радиус на отвора за оста
  rim?: number; // ширина на венеца в мм
  hub?: number; // радиус на главината
  spokeW?: number;
};

/** Зъбно колело: часовникарски (циклоиден) профил — тесни зъби със заоблен връх, зъб на ъгъл 0. */
export function gearShape(o: GearOpts) {
  const z = o.teeth;
  const r = (z * o.module) / 2;
  const rt = r + o.module * (z <= 12 ? 0.9 : 1.15);
  const rr = r - o.module * (z <= 12 ? 1.5 : 1.35);
  const p = TAU / z;
  const s = new THREE.Shape();
  const half = z <= 12 ? 0.26 : 0.24; // половин ширина на зъба по делителната окръжност (дял от стъпката)
  for (let i = 0; i < z; i++) {
    const a = i * p;
    const pts: [number, number][] = [
      [rr, a - half * p * 1.15],
      [r, a - half * p],
    ];
    // Заоблен (огивален) връх.
    for (let j = 0; j <= 6; j++) {
      const u = -1 + (2 * j) / 6;
      const rad = r + (rt - r) * Math.cos((u * Math.PI) / 2);
      pts.push([rad, a + u * half * p * 0.82]);
    }
    pts.push([r, a + half * p], [rr, a + half * p * 1.15]);
    // Дъно между зъбите.
    pts.push([rr, a + p / 2], [rr, a + p - half * p * 1.15]);
    for (const [rad, ang] of pts) {
      const x = rad * Math.cos(ang);
      const y = rad * Math.sin(ang);
      if (i === 0 && rad === rr && ang === a - half * p * 1.15) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
  }
  s.closePath();
  addSpokes(s, rr, o);
  return s;
}

function addSpokes(s: THREE.Shape, rOuter: number, o: GearOpts) {
  const n = o.spokes ?? 0;
  const rim = o.rim ?? Math.max(0.25, rOuter * 0.12);
  const hub = o.hub ?? Math.max(0.35, rOuter * 0.18);
  const ri = rOuter - rim;
  if (n > 0 && ri > hub + 0.2) {
    const w = o.spokeW ?? Math.max(0.16, rOuter * 0.07);
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU;
      const a1 = ((k + 1) / n) * TAU;
      const h = new THREE.Path();
      const oa0 = a0 + w / 2 / ri;
      const oa1 = a1 - w / 2 / ri;
      const ia0 = a0 + w / 2 / hub;
      const ia1 = a1 - w / 2 / hub;
      h.moveTo(hub * Math.cos(ia0), hub * Math.sin(ia0));
      h.lineTo(ri * Math.cos(oa0), ri * Math.sin(oa0));
      h.absarc(0, 0, ri, oa0, oa1, false);
      h.lineTo(hub * Math.cos(ia1), hub * Math.sin(ia1));
      h.absarc(0, 0, hub, ia1, ia0, true);
      s.holes.push(h);
    }
  }
  if (o.hole) {
    const h = new THREE.Path();
    h.absarc(0, 0, o.hole, 0, TAU, true);
    s.holes.push(h);
  }
}

function extrude(shape: THREE.Shape, depth: number, bevel = 0.04, curve = 24) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: 3,
    curveSegments: curve,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

export function gearGeo(o: GearOpts) {
  return extrude(gearShape(o), o.thickness, Math.min(0.04, o.thickness * 0.15));
}

/** Ходовото колело: 15 зъба с „бухалка“ на върха (швейцарски анкерен ход). */
function escapeShape(R: number) {
  const s = new THREE.Shape();
  const z = 15;
  const p = TAU / z;
  const rr = R * 0.78;
  for (let i = 0; i < z; i++) {
    const a = i * p;
    const pts: [number, number][] = [
      [rr, a],
      [R * 0.97, a + p * 0.2],
      [R, a + p * 0.28], // върхът
      [R * 0.94, a + p * 0.36], // „бухалката“
      [rr * 1.05, a + p * 0.62],
      [rr, a + p * 0.8],
    ];
    pts.forEach(([rad, ang], j) => {
      const x = rad * Math.cos(ang);
      const y = rad * Math.sin(ang);
      if (i === 0 && j === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  addSpokes(s, rr, { teeth: 0, module: 0, thickness: 0, spokes: 4, rim: 0.18, hub: 0.32, spokeW: 0.12, hole: 0.08 });
  return s;
}

function annulus(ro: number, ri: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, ro, 0, TAU, false);
  const h = new THREE.Path();
  h.absarc(0, 0, ri, 0, TAU, true);
  s.holes.push(h);
  return s;
}

/** Спирала като лента (стена с височина h) — за пружината в барабана. */
function ribbonSpiral(r0: number, r1: number, turns: number, h: number, thick: number) {
  const N = Math.ceil(turns * 90);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const a = s * turns * TAU;
    const r = r0 + (r1 - r0) * s;
    for (const off of [-thick / 2, thick / 2]) {
      const rr = r + off;
      pos.push(rr * Math.cos(a), rr * Math.sin(a), -h / 2, rr * Math.cos(a), rr * Math.sin(a), h / 2);
    }
    if (i < N) {
      const b = i * 4;
      const n = b + 4;
      // вътрешна стена (0,1), външна (2,3)
      idx.push(b, n, b + 1, n, n + 1, b + 1);
      idx.push(b + 2, b + 3, n + 2, n + 2, b + 3, n + 3);
      // горен ръб
      idx.push(b + 1, n + 1, b + 3, n + 1, n + 3, b + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Плоска спирала — тръба по Архимедова спирала (за спиралата на баланса). */
function flatSpiral(r0: number, r1: number, turns: number, tube: number) {
  const pts: THREE.Vector3[] = [];
  const N = Math.ceil(turns * 64);
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const a = s * turns * TAU;
    const r = r0 + (r1 - r0) * s;
    pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, N * 2, tube, 5, false);
}

function cyl(r: number, h: number, seg = 32) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  return g;
}

function slot(a: V2, b: V2, w: number) {
  // Капсула между две точки — рамо на мост.
  const ang = angleTo(a, b);
  const s = new THREE.Shape();
  s.absarc(a.x, a.y, w, ang + Math.PI / 2, ang + (3 * Math.PI) / 2, false);
  s.absarc(b.x, b.y, w, ang - Math.PI / 2, ang + Math.PI / 2, false);
  s.closePath();
  return s;
}

/* ---------------- Сглобяване ---------------- */

export type Movement = ReturnType<typeof buildMovement>;

export function buildMovement(m: Mats) {
  const root = new THREE.Group();
  const add3 = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = root) => {
    const me = new THREE.Mesh(geo, mat);
    me.position.set(x, y, z);
    parent.add(me);
    return me;
  };
  const arbor = (p: V2) => {
    const g = new THREE.Group();
    g.position.set(p.x, p.y, 0);
    root.add(g);
    return g;
  };
  const jewels: V2[] = [];
  const jewel = (p: V2, z: number, r = 0.42, parent: THREE.Object3D = root) => {
    // Рубин в златен шатон: пръстен с олио-вдлъбнатина.
    add3(extrude(annulus(r * 1.55, r * 1.05), 0.12, 0.03), m.gold, p.x, p.y, z, parent);
    const j = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 0.22, 28), m.ruby);
    j.rotation.x = Math.PI / 2;
    j.position.set(p.x, p.y, z + 0.04);
    parent.add(j);
    add3(cyl(r * 0.22, 0.26, 12), m.steel, p.x, p.y, z + 0.05, parent);
    if (parent === root) jewels.push(p);
  };
  const screw = (p: V2, z: number, r = 0.5) => {
    const g = new THREE.Group();
    g.position.set(p.x, p.y, z);
    root.add(g);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 0.32, 28), m.blued);
    head.rotation.x = Math.PI / 2;
    head.position.z = 0.16;
    g.add(head);
    const slotG = new THREE.BoxGeometry(r * 2.1, r * 0.22, 0.14);
    const sl = new THREE.Mesh(slotG, new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.9 }));
    sl.position.z = 0.3;
    sl.rotation.z = Math.random() * Math.PI;
    g.add(sl);
  };

  /* Платина: скелетирана, с перлаж и прозорец към стрелковия механизъм. */
  {
    const s = new THREE.Shape();
    s.absarc(0, 0, CASE_R - 0.4, 0, TAU, false);
    const win = new THREE.Path();
    // Прозорецът — между барабана и баланса, оттам камерата слиза към циферблата.
    const wc = add(POS.center, 9.2, (215 * Math.PI) / 180);
    win.absarc(wc.x, wc.y, 2.6, 0, TAU, true);
    s.holes.push(win);
    for (const k of ["center", "third", "fourth", "escape", "barrel", "pallet", "balance"] as const) {
      const h = new THREE.Path();
      h.absarc(POS[k].x, POS[k].y, 0.12, 0, TAU, true);
      s.holes.push(h);
    }
    const plate = add3(extrude(s, -Z.plateBot, 0.08, 96), m.plate, 0, 0, Z.plateBot / 2);
    plate.userData.window = wc;
  }

  /* Барабан: зъбен венец + стена; отворен отгоре — вижда се навитата пружина. */
  const barrel = arbor(POS.barrel);
  {
    const B = TRAIN.barrel;
    const rr = pr(B.z, B.m) - B.m * 1.35;
    add3(gearGeo({ teeth: B.z, module: B.m, thickness: 0.42, hole: rr - 0.5 }), m.gold, 0, 0, Z.layerA, barrel);
    // стената на барабана
    const wall = new THREE.LatheGeometry(
      [new THREE.Vector2(rr - 0.5, 0.2), new THREE.Vector2(rr - 0.05, 0.2), new THREE.Vector2(rr - 0.05, 1.5), new THREE.Vector2(rr - 0.3, 1.65), new THREE.Vector2(rr - 0.5, 1.5)],
      96,
    );
    wall.rotateX(Math.PI / 2);
    add3(wall, m.goldDark, 0, 0, 0, barrel);
    // дъно със слънчеви лъчи
    add3(extrude(annulus(rr - 0.45, 0.6), 0.2, 0.02, 64), m.sunray, 0, 0, 0.3, barrel);
    // пружината — шест оборота на барабана = 48 часа
    add3(ribbonSpiral(0.95, rr - 0.65, 13, 1.05, 0.07), m.blued, 0, 0, 0.95, barrel);
    add3(cyl(0.8, Z.bridge), m.steel, 0, 0, Z.bridge / 2 + 0.2, barrel);
  }
  // мостът на барабана — тънко рамо над него
  {
    const outer = add(POS.barrel, 7.4, angleTo(POS.center, POS.barrel) + 0.35);
    add3(extrude(slot(POS.barrel, outer, 1.1), Z.bridgeT, 0.05), m.bridge, 0, 0, Z.bridge + 0.2);
    add3(cyl(0.7, Z.bridge + 0.2), m.steel, outer.x, outer.y, (Z.bridge + 0.2) / 2);
    jewel(POS.barrel, Z.bridge + 0.5, 0.6);
    screw(add(POS.barrel, 3.8, angleTo(POS.barrel, outer)), Z.bridge + 0.47, 0.55);
  }

  /* Ходовата линия. Колело и зъбчето на една ос; задвижващото колело и задвижваното зъбче са в един слой. */
  const center = arbor(POS.center);
  add3(gearGeo({ teeth: 10, module: 0.13, thickness: 0.6 }), m.steel, 0, 0, Z.layerA, center);
  add3(gearGeo({ teeth: 80, module: 0.1, thickness: 0.28, spokes: 4, hole: 0.18 }), m.gold, 0, 0, Z.layerB, center);
  add3(cyl(0.18, Z.bridge + 0.6 - Z.plateBot + 1.0), m.steel, 0, 0, (Z.bridge + 0.6 + Z.plateBot - 1.0) / 2, center);

  const third = arbor(POS.third);
  add3(gearGeo({ teeth: 10, module: 0.1, thickness: 0.6 }), m.steel, 0, 0, Z.layerB, third);
  add3(gearGeo({ teeth: 75, module: 0.09, thickness: 0.26, spokes: 5, hole: 0.12 }), m.gold, 0, 0, Z.layerA, third);
  add3(cyl(0.13, Z.bridge), m.steel, 0, 0, Z.bridge / 2, third);

  const fourth = arbor(POS.fourth);
  add3(gearGeo({ teeth: 10, module: 0.09, thickness: 0.55 }), m.steel, 0, 0, Z.layerA, fourth);
  add3(gearGeo({ teeth: 80, module: 0.07, thickness: 0.24, spokes: 5, hole: 0.1 }), m.gold, 0, 0, Z.layerB, fourth);
  add3(cyl(0.11, Z.bridge - Z.dial + 0.2), m.steel, 0, 0, (Z.bridge + Z.dial - 0.2) / 2 + 0.1, fourth);

  const escape = arbor(POS.escape);
  add3(gearGeo({ teeth: 8, module: 0.07, thickness: 0.5 }), m.steel, 0, 0, Z.layerB, escape);
  const ESC_R = 1.75;
  add3(extrude(escapeShape(ESC_R), 0.2, 0.025), m.steel, 0, 0, Z.layerA, escape);
  add3(cyl(0.09, Z.bridge), m.steel, 0, 0, Z.bridge / 2, escape);

  /* Анкерът: тяло с две рубинени палети към ходовото колело и вилка към баланса. */
  const pallet = arbor(POS.pallet);
  {
    const bE = angleTo(POS.pallet, POS.escape);
    const bB = angleTo(POS.pallet, POS.balance);
    const L = 2.3;
    const local = (d: number, a: number): V2 => ({ x: d * Math.cos(a), y: d * Math.sin(a) });
    // Палетите лежат на окръжността на ходовото колело на ±33° от линията на центровете.
    const eL: V2 = { x: L * Math.cos(bE), y: L * Math.sin(bE) };
    const stone = (side: number) => {
      const a = bE + Math.PI + side * 0.58;
      return { x: eL.x + ESC_R * 0.98 * Math.cos(a), y: eL.y + ESC_R * 0.98 * Math.sin(a) };
    };
    const s1 = stone(1);
    const s2 = stone(-1);
    const body = new THREE.Shape();
    const tip = local(1.95, bB);
    const n = (a: number, d: number): V2 => local(d, a);
    const p1 = n(bE + 0.75, 0.55);
    const p2 = n(bE - 0.75, 0.55);
    body.moveTo(p1.x, p1.y);
    body.quadraticCurveTo(s1.x * 0.6, s1.y * 0.6, s1.x, s1.y);
    body.lineTo(s1.x + 0.18 * Math.cos(bE + Math.PI), s1.y + 0.18 * Math.sin(bE + Math.PI));
    body.quadraticCurveTo(0, 0, s2.x + 0.18 * Math.cos(bE + Math.PI), s2.y + 0.18 * Math.sin(bE + Math.PI));
    body.lineTo(s2.x, s2.y);
    body.quadraticCurveTo(s2.x * 0.6, s2.y * 0.6, p2.x, p2.y);
    const w1 = n(bB - 0.12, 0.4);
    const w2 = n(bB + 0.12, 0.4);
    body.lineTo(w1.x, w1.y);
    const t1 = { x: tip.x + 0.16 * Math.cos(bB - Math.PI / 2), y: tip.y + 0.16 * Math.sin(bB - Math.PI / 2) };
    const t2 = { x: tip.x + 0.16 * Math.cos(bB + Math.PI / 2), y: tip.y + 0.16 * Math.sin(bB + Math.PI / 2) };
    body.lineTo(t1.x, t1.y);
    body.lineTo(t2.x, t2.y);
    body.lineTo(w2.x, w2.y);
    body.closePath();
    add3(extrude(body, 0.16, 0.02), m.steel, 0, 0, Z.layerA, pallet);
    for (const s of [s1, s2]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.3), m.ruby);
      st.position.set(s.x, s.y, Z.layerA);
      st.rotation.z = Math.atan2(s.y - eL.y, s.x - eL.x) + Math.PI / 2;
      pallet.add(st);
    }
    add3(cyl(0.08, 2.4), m.steel, 0, 0, 1.2, pallet);
  }

  /* Балансът: глуцидуров обръч с винтчета, сини спирала, ролка с рубинен импулсен щифт. */
  const balance = arbor(POS.balance);
  const BAL_R = 4.3;
  const spring = new THREE.Group();
  const springUniform = { value: 0 };
  {
    const rim = new THREE.Shape();
    rim.absarc(0, 0, BAL_R, 0, TAU, false);
    addSpokes(rim, BAL_R, { teeth: 0, module: 0, thickness: 0, spokes: 3, rim: 0.42, hub: 0.38, spokeW: 0.3, hole: 0.1 });
    add3(extrude(rim, 0.36, 0.05, 128), m.gold, 0, 0, Z.balance, balance);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + 0.1;
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 16), i % 4 ? m.gold : m.rose);
      sc.position.set(Math.cos(a) * (BAL_R + 0.18), Math.sin(a) * (BAL_R + 0.18), Z.balance);
      sc.rotation.z = a - Math.PI / 2;
      balance.add(sc);
    }
    add3(cyl(0.1, Z.cock + 0.1 - Z.layerA + 0.3), m.steel, 0, 0, (Z.cock + 0.1 + Z.layerA - 0.3) / 2, balance);
    add3(extrude(annulus(0.55, 0.1), 0.16, 0.02), m.steel, 0, 0, Z.layerA + 0.05, balance); // двойна ролка
    const pin = new THREE.Mesh(cyl(0.08, 0.32, 12), m.ruby);
    const bP = angleTo(POS.balance, POS.pallet);
    pin.position.set(0.42 * Math.cos(bP), 0.42 * Math.sin(bP), Z.layerA - 0.08);
    balance.add(pin);
    add3(extrude(annulus(0.32, 0.1), 0.2, 0.02), m.gold, 0, 0, Z.balance + 0.55, balance); // колет
  }
  // Спиралата е на баланса отгоре; вътрешният край се върти с баланса, външният е закрепен.
  {
    const r0 = 0.32;
    const r1 = 2.6;
    const geo = flatSpiral(r0, r1, 11, 0.022);
    const mat = m.blued.clone();
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uSwing = springUniform;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uSwing;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float rr = length(transformed.xy);
           float k = 1.0 - clamp((rr - ${r0.toFixed(3)}) / ${(r1 - r0).toFixed(3)}, 0.0, 1.0);
           float aa = uSwing * k;
           transformed.xy = mat2(cos(aa), sin(aa), -sin(aa), cos(aa)) * transformed.xy;`,
        );
    };
    const me = new THREE.Mesh(geo, mat);
    spring.add(me);
    spring.position.set(POS.balance.x, POS.balance.y, Z.balance + 0.55);
    root.add(spring);
  }

  /* Мостовете: ходовият мост (централно → трето → четвърто → ходово), мост на анкера, кокът на баланса. */
  {
    const edge = (p: V2, extra = 0) => add(POS.center, CASE_R - 1.4, angleTo(POS.center, p) + extra);
    const tb: [V2, V2][] = [
      [POS.center, POS.third],
      [POS.third, POS.fourth],
      [POS.fourth, POS.escape],
      [POS.third, edge(POS.third, 0.15)],
      [POS.fourth, edge(POS.fourth, -0.22)],
    ];
    for (const [a, b] of tb) add3(extrude(slot(a, b, 0.75), Z.bridgeT, 0.05), m.bridge, 0, 0, Z.bridge);
    for (const p of [edge(POS.third, 0.15), edge(POS.fourth, -0.22)]) {
      add3(cyl(0.6, Z.bridge), m.steel, p.x, p.y, Z.bridge / 2);
      screw(p, Z.bridge + Z.bridgeT / 2, 0.5);
    }
    for (const k of ["center", "third", "fourth", "escape"] as const) jewel(POS[k], Z.bridge + Z.bridgeT / 2, k === "center" ? 0.5 : 0.38);
    // Кокът — висок, извит, над баланса.
    const ce = add(POS.balance, BAL_R + 2.6, angleTo(POS.center, POS.balance) + 0.5);
    const cock = new THREE.Shape();
    const w = 1.0;
    const ang = angleTo(POS.balance, ce);
    cock.absarc(POS.balance.x, POS.balance.y, 1.15, ang + Math.PI / 2, ang + (3 * Math.PI) / 2, false);
    cock.lineTo(ce.x + 1.8 * w * Math.cos(ang - Math.PI / 2), ce.y + 1.8 * w * Math.sin(ang - Math.PI / 2));
    cock.absarc(ce.x, ce.y, 1.8 * w, ang - Math.PI / 2, ang + Math.PI / 2, false);
    cock.closePath();
    add3(extrude(cock, 0.5, 0.06), m.bridge, 0, 0, Z.cock);
    add3(cyl(1.2, Z.cock), m.steel, ce.x, ce.y, Z.cock / 2);
    screw(ce, Z.cock + 0.25, 0.65);
    jewel(POS.balance, Z.cock + 0.26, 0.42);
    // Камъни в платината под всяка ос.
    for (const k of ["third", "fourth", "escape", "pallet", "balance"] as const) jewel(POS[k], Z.plateTop + 0.06, 0.32);
  }

  /* Стрелковият механизъм — между платината и циферблата. */
  const cannon = arbor(POS.center);
  add3(gearGeo({ teeth: 12, module: 0.08, thickness: 0.3 }), m.steel, 0, 0, Z.motion, cannon);
  add3(cyl(0.3, 1.6), m.steel, 0, 0, Z.motion - 0.7, cannon);
  const minuteW = arbor(POS.minute);
  add3(gearGeo({ teeth: 36, module: 0.08, thickness: 0.22, spokes: 4, hole: 0.1 }), m.gold, 0, 0, Z.motion, minuteW);
  add3(gearGeo({ teeth: 10, module: 0.1, thickness: 0.3 }), m.steel, 0, 0, Z.motion - 0.45, minuteW);
  const hourW = arbor(POS.center);
  add3(gearGeo({ teeth: 40, module: 0.1, thickness: 0.2, spokes: 4, hole: 0.38 }), m.gold, 0, 0, Z.motion - 0.45, hourW);
  add3(extrude(annulus(0.55, 0.38), 0.9, 0.02), m.gold, 0, 0, Z.motion - 0.9, hourW);

  /* Циферблатът: авантюрин, апликирани индекси, стрелки „дофин“. */
  const subdial = { x: POS.fourth.x, y: POS.fourth.y, r: 2.6 };
  {
    const s = new THREE.Shape();
    s.absarc(0, 0, DIAL_R, 0, TAU, false);
    for (const p of [POS.center, POS.fourth]) {
      const h = new THREE.Path();
      h.absarc(p.x, p.y, p === POS.center ? 0.6 : 0.2, 0, TAU, true);
      s.holes.push(h);
    }
    const g = new THREE.ShapeGeometry(s, 128);
    // UV от позицията, огледално — така текстурата се чете правилно отпред (−z).
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 - p.getX(i) / (2 * DIAL_R), 0.5 + p.getY(i) / (2 * DIAL_R));
    const tex = T.dial(subdial, DIAL_R);
    const dmat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.3, roughness: 0.42, side: THREE.DoubleSide });
    const dialMesh = add3(g, dmat, 0, 0, Z.dial);
    dialMesh.userData.tex = tex;
    // Дебелина: пръстен по ръба.
    add3(extrude(annulus(DIAL_R, DIAL_R - 0.2), 0.4, 0.02, 128), m.goldDark, 0, 0, Z.dial + 0.2);
    // Индекси: 12 апликации от жълто злато; 12 часа — двойни.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r = DIAL_R - 3.3;
      // Отпред (поглед към +z) часовниковата посока е +ъгъл около z → x = −sin.
      const x = -Math.sin(a) * r;
      const y = Math.cos(a) * r;
      if (i === 6) continue; // там е малката секундарка
      const len = i % 3 ? 1.6 : 2.2;
      const pairs = i === 0 ? [-0.32, 0.32] : [0];
      for (const off of pairs) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(i % 3 ? 0.34 : 0.48, len, 0.35), m.handGold);
        b.position.set(x + off * Math.cos(a), y + off * Math.sin(a), Z.dial - 0.18);
        b.rotation.z = a;
        root.add(b);
      }
    }
  }
  const hand = (len: number, w: number, tail: number, mat: THREE.Material, z: number, at: V2 = POS.center) => {
    const s = new THREE.Shape();
    s.moveTo(0, -tail);
    s.lineTo(w, 0);
    s.lineTo(w * 0.45, len * 0.82);
    s.lineTo(0, len);
    s.lineTo(-w * 0.45, len * 0.82);
    s.lineTo(-w, 0);
    s.closePath();
    const g = new THREE.Group();
    g.position.set(at.x, at.y, z);
    // Дофин: ребро по средата — две половини под ъгъл.
    const geo = extrude(s, 0.08, 0.02);
    const me = new THREE.Mesh(geo, mat);
    g.add(me);
    const cap = new THREE.Mesh(cyl(w * 1.25, 0.18), mat);
    g.add(cap);
    root.add(g);
    return g;
  };
  const hourHand = hand(DIAL_R * 0.52, 0.55, 1.1, m.handGold, Z.hands);
  const minuteHand = hand(DIAL_R * 0.86, 0.42, 1.5, m.handGold, Z.hands - 0.25);
  const secHand = hand(subdial.r * 0.95, 0.12, 0.6, m.handGold, Z.dial - 0.32, POS.fourth);

  /* Корпусът: платина, двойно стъкло, корона и халка на 12 — джобен часовник на верижка. */
  const caseG = new THREE.Group();
  root.add(caseG);
  {
    const R0 = CASE_R;
    const prof = [
      [R0, Z.front + 0.2],
      [R0 + 1.4, Z.front - 0.2],
      [R0 + 2.4, Z.front + 0.8],
      [R0 + 2.9, (Z.front + Z.back) / 2],
      [R0 + 2.4, Z.back - 0.6],
      [R0 + 1.4, Z.back + 0.5],
      [R0, Z.back + 0.2],
    ].map(([r, z]) => new THREE.Vector2(r, z));
    const lathe = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(60), 160);
    lathe.rotateX(Math.PI / 2);
    const me = new THREE.Mesh(lathe, m.platinum);
    me.material.side = THREE.DoubleSide;
    caseG.add(me);
    for (const z of [Z.front + 0.05, Z.back + 0.15]) {
      const glass = new THREE.Mesh(new THREE.CircleGeometry(R0 + 0.3, 96), m.glass);
      glass.position.z = z;
      caseG.add(glass);
    }
    // Корона и халка.
    const top = R0 + 2.9;
    const pend = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.6, 32), m.platinum);
    pend.position.set(0, top + 0.6, (Z.front + Z.back) / 2);
    caseG.add(pend);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.8, 48), m.platinum);
    crown.position.set(0, top + 2.1, (Z.front + Z.back) / 2);
    caseG.add(crown);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), m.platinum);
      k.position.set(Math.cos(a) * 1.8, top + 2.1, (Z.front + Z.back) / 2 + Math.sin(a) * 1.8);
      k.rotation.y = -a;
      caseG.add(k);
    }
    const bow = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.55, 20, 96, Math.PI * 1.25), m.platinum);
    bow.position.set(0, top + 2.6, (Z.front + Z.back) / 2);
    bow.rotation.z = -Math.PI * 0.125;
    caseG.add(bow);
    // Верижката нагоре в мрака.
    const linkGeo = new THREE.TorusGeometry(1.2, 0.32, 12, 32);
    linkGeo.scale(1, 1.7, 1);
    let y = top + 2.6 + 5.2 + 1.2;
    for (let i = 0; i < 70; i++) {
      const l = new THREE.Mesh(linkGeo, m.platinum);
      l.position.set(0, y, (Z.front + Z.back) / 2);
      l.rotation.y = i % 2 ? Math.PI / 2 : 0;
      caseG.add(l);
      y += 3.0;
    }
  }

  /* ---------------- Кинематика ---------------- */

  const betas = {
    bc: angleTo(POS.barrel, POS.center),
    ct: angleTo(POS.center, POS.third),
    tf: angleTo(POS.third, POS.fourth),
    fe: angleTo(POS.fourth, POS.escape),
    cm: angleTo(POS.center, POS.minute),
    mh: angleTo(POS.minute, POS.center),
  };
  const state = { phase: 0, beat: 0, steps: 0, balance: 0, fork: 0 };

  /**
   * dt — реално време; rate — забавяне (1 = реално). t0 — секунди от полунощ при старта.
   * Връща времето на механизма (s) и дали е паднал нов удар (за звука).
   */
  function update(dt: number, rate: number, t0: number) {
    state.phase += dt * rate * TAU * FREQ * 0.5 * 2; // фаза на баланса
    const ph = state.phase;
    const k = Math.floor(ph / Math.PI);
    const into = (ph - k * Math.PI) / (Math.PI * 0.14);
    const e = into >= 1 ? 1 : into * into * (3 - 2 * into); // импулсът — кратко след минаването през нулата
    const steps = k + e;
    const ticked = k !== state.beat;
    state.beat = k;
    state.steps = steps;

    const bal = AMP * Math.sin(ph);
    balance.rotation.z = bal;
    springUniform.value = bal;
    const side = k % 2 === 0 ? 1 : -1;
    pallet.rotation.z = (-side + 2 * side * e) * 0.13;

    // Ходовата линия — от барабана напред.
    const thBarrel = -(steps * TAU) / 144000;
    const thCenter = meshAngle(thBarrel, 80, 10, betas.bc);
    const thThird = meshAngle(thCenter, 80, 10, betas.ct);
    const thFourth = meshAngle(thThird, 75, 10, betas.tf);
    const thEscape = meshAngle(thFourth, 80, 8, betas.fe);
    barrel.rotation.z = thBarrel;
    center.rotation.z = thCenter;
    third.rotation.z = thThird;
    fourth.rotation.z = thFourth;
    escape.rotation.z = thEscape;

    return { time: t0 + steps * BEAT, ticked, tick: side };
  }

  /** Стрелките и стрелковият механизъм — от показаното време (може да е нагласено). */
  function setHands(display: number, trainTime: number) {
    const mAng = (TAU * display) / 3600;
    minuteHand.rotation.z = mAng;
    hourHand.rotation.z = (TAU * display) / 43200;
    secHand.rotation.z = (TAU * trainTime) / 60;
    cannon.rotation.z = mAng;
    const thMin = meshAngle(mAng, 12, 36, betas.cm);
    minuteW.rotation.z = thMin;
    hourW.rotation.z = meshAngle(thMin, 10, 40, betas.mh);
  }

  root.traverse((o) => {
    const me = o as THREE.Mesh;
    if (!me.isMesh || me.material === m.glass) return;
    me.castShadow = true;
    me.receiveShadow = true;
  });

  return { root, update, setHands, jewels, state, caseG };
}
