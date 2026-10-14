import * as THREE from "three";
import type { Flavour } from "../data/flavours";

/*
  Кенчето — истинска геометрия, не картинка.
  Тяло: цилиндър с етикет (CanvasTexture, рисуван тук). Горе и долу: струговани
  профили от алуминий. Отгоре: капак и халка.
  Размер: R = 0.5, тяло 2.0 → цялото кенче е ~2.37 високо (за изчисленията в stage.ts).
*/

export const CAN_R = 0.5;
export const BODY_H = 2.0;
export const CAN_H = 2.37;

const LABEL_W = 2048;
// Етикетът не трябва да се разтяга: височината спрямо обиколката.
const LABEL_H = Math.round((LABEL_W * BODY_H) / (2 * Math.PI * CAN_R));

const DISPLAY = '"Archivo Variable", "Archivo", sans-serif';
// Тясната тежка ширина на Archivo — през shorthand-а на canvas (font-stretch).
const TIGHT = "extra-condensed";
const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace';

export async function loadFonts() {
  await Promise.all([
    document.fonts.load(`900 ${TIGHT} 120px ${DISPLAY}`, "FERAL"),
    document.fonts.load(`700 40px ${MONO}`, "FERAL 0"),
    document.fonts.load(`400 40px ${MONO}`, "FERAL 0"),
  ]).catch(() => undefined);
}

/** Вертикален надпис, вписан в ширина w (по височината на кенчето). */
function verticalWord(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  fitWidth: number,
  maxSize: number,
  weight = 900,
  family = DISPLAY,
) {
  ctx.save();
  let size = maxSize;
  const stretch = family === DISPLAY ? TIGHT : "normal";
  ctx.font = `${weight} ${stretch} ${size}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > fitWidth) size = Math.floor((size * fitWidth) / w);
  ctx.font = `${weight} ${stretch} ${size}px ${family}`;
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
  return size;
}

function hazard(ctx: CanvasRenderingContext2D, y: number, h: number, a: string, b: string) {
  ctx.save();
  ctx.fillStyle = b;
  ctx.fillRect(0, y, LABEL_W, h);
  ctx.beginPath();
  ctx.rect(0, y, LABEL_W, h);
  ctx.clip();
  ctx.fillStyle = a;
  const step = 56;
  for (let x = -h; x < LABEL_W + h; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + step / 2, y + h);
    ctx.lineTo(x + step / 2 + h, y);
    ctx.lineTo(x + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Три следи от нокти — през целия етикет, малко по-тъмни от фона. */
function claws(ctx: CanvasRenderingContext2D, cx: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let k = 0; k < 3; k++) {
    const x0 = cx + k * 120 - 120;
    ctx.beginPath();
    ctx.moveTo(x0 + 210, 40);
    ctx.lineTo(x0 + 250, 60);
    ctx.lineTo(x0 - 160, LABEL_H - 50);
    ctx.lineTo(x0 - 190, LABEL_H - 80);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawLabel(f: Flavour): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = LABEL_W;
  c.height = LABEL_H;
  const ctx = c.getContext("2d")!;
  const front = LABEL_W / 2;

  ctx.fillStyle = f.can;
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);

  claws(ctx, front + 330, f.ink, 0.12);
  claws(ctx, 260, f.ink, 0.06);

  // Лента горе и долу — като предупредителна.
  const band = 64;
  hazard(ctx, 0, band, f.accent === f.ink ? f.can : f.accent, f.ink);
  hazard(ctx, LABEL_H - band, band, f.accent === f.ink ? f.can : f.accent, f.ink);

  // Главното: ЗВЯР вертикално, през цялата височина.
  ctx.fillStyle = f.ink;
  const usable = LABEL_H - band * 2 - 70;
  const s = verticalWord(ctx, "FERAL", front - 60, LABEL_H / 2, usable, 760);

  // Вкусът — до него.
  verticalWord(ctx, f.name, front + s * 0.5 + 60, LABEL_H / 2, usable * 0.92, 210);
  ctx.save();
  ctx.font = `700 30px ${MONO}`;
  ctx.translate(front + s * 0.5 + 215, LABEL_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(`${f.fruit.toUpperCase()} · ENERGY DRINK`, 0, 0);
  ctx.restore();

  // Отляво на лицето: малки маркери.
  ctx.save();
  ctx.font = `700 34px ${MONO}`;
  ctx.translate(front - s * 0.5 - 150, LABEL_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("ZERO SUGAR ■ 160 MG CAFFEINE ■ 500 ML", 0, 0);
  ctx.restore();

  // Гърбът: таблица и предупреждение (виждат се при завъртане).
  const tx = 1490;
  const tw = 430;
  let ty = band + 90;
  ctx.strokeStyle = f.ink;
  ctx.fillStyle = f.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(tx, ty, tw, 640);
  ctx.font = `900 ${TIGHT} 64px ${DISPLAY}`;
  ctx.fillText("NUTRITION", tx + 24, ty + 70);
  ctx.fillText("FACTS", tx + 24, ty + 128);
  ctx.font = `400 26px ${MONO}`;
  ctx.fillText("per 100 ml", tx + 24, ty + 164);
  ty += 190;
  const rows: [string, string][] = [
    ["Energy", `${f.kcal} kcal`],
    ["Fat", "0 g"],
    ["Carbohydrate", "1.1 g"],
    ["  of which sugars", f.sugar],
    ["Protein", "0 g"],
    ["Salt", "0.06 g"],
    ["Caffeine", "32 mg"],
    ["Vitamin B6", "0.4 mg"],
    ["Vitamin B12", "0.5 µg"],
  ];
  ctx.font = `700 26px ${MONO}`;
  for (const [k, v] of rows) {
    ctx.fillRect(tx + 24, ty - 30, tw - 48, 3);
    ctx.textAlign = "left";
    ctx.fillText(k, tx + 24, ty + 2);
    ctx.textAlign = "right";
    ctx.fillText(v, tx + tw - 24, ty + 2);
    ty += 48;
  }
  ctx.textAlign = "left";

  const wx = 120;
  ctx.font = `900 ${TIGHT} 60px ${DISPLAY}`;
  ctx.fillText("WARNING.", wx, band + 150);
  ctx.font = `400 26px ${MONO}`;
  const warn = [
    "High caffeine content",
    "(32 mg/100 ml). Not recommended",
    "for children or pregnant or",
    "breastfeeding women. Do not",
    "exceed 2 cans per day.",
    "",
    "Ingredients: carbonated water,",
    `fruit juice 12% (${f.fruit.toLowerCase()}),`,
    "citric acid, caffeine from",
    "green coffee, erythritol, stevia,",
    "vitamins B3, B6, B12.",
    "",
    "A concept by 13:33.",
  ];
  warn.forEach((l, i) => ctx.fillText(l, wx, band + 210 + i * 40));

  return c;
}

export type FruitKind = "slice" | "berry" | "cube";
export const FRUIT_KIND: Record<string, FruitKind> = {
  yarost: "slice",
  kiselina: "slice",
  "noshtna-smyana": "berry",
  grum: "cube",
  led: "berry",
  nula: "berry",
};

/** Срез на цитрус — за лицето на резенчетата. */
export function drawSlice(f: Flavour, canvas?: HTMLCanvasElement): HTMLCanvasElement {
  const c = canvas ?? document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const r = 256;
  ctx.clearRect(0, 0, 512, 512);
  ctx.fillStyle = f.rind;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff6e0";
  ctx.beginPath();
  ctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  const n = 10;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2 + 0.035;
    const a1 = ((k + 1) / n) * Math.PI * 2 - 0.035;
    const g = ctx.createRadialGradient(r, r, 20, r, r, r * 0.84);
    g.addColorStop(0, "#fff6e0");
    g.addColorStop(0.25, f.flesh);
    g.addColorStop(1, f.flesh);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos((a0 + a1) / 2) * 18, r + Math.sin((a0 + a1) / 2) * 18);
    ctx.arc(r, r, r * 0.84, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  // Сокови точки.
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let k = 0; k < 140; k++) {
    const a = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * r * 0.75;
    ctx.beginPath();
    ctx.ellipse(r + Math.cos(a) * d, r + Math.sin(a) * d, 4 + Math.random() * 6, 2, a, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

function lathe(points: [number, number][], material: THREE.Material) {
  const g = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    96,
  );
  return new THREE.Mesh(g, material);
}

export type Can = {
  group: THREE.Group;
  body: THREE.MeshPhysicalMaterial;
};

const shared: { metal?: THREE.MeshStandardMaterial; lid?: THREE.MeshStandardMaterial; geo?: THREE.CylinderGeometry; tab?: THREE.BufferGeometry } = {};

function sharedParts() {
  if (!shared.metal) {
    shared.metal = new THREE.MeshStandardMaterial({ color: "#d4d7dc", metalness: 1, roughness: 0.22 });
    shared.lid = new THREE.MeshStandardMaterial({ color: "#b9bdc4", metalness: 1, roughness: 0.32 });
    shared.geo = new THREE.CylinderGeometry(CAN_R, CAN_R, BODY_H, 96, 1, true, Math.PI);
    const s = new THREE.Shape();
    s.moveTo(-0.11, -0.05);
    s.lineTo(0.11, -0.05);
    s.quadraticCurveTo(0.15, 0.18, 0, 0.3);
    s.quadraticCurveTo(-0.15, 0.18, -0.11, -0.05);
    const hole = new THREE.Path();
    hole.absellipse(0, 0.14, 0.06, 0.08, 0, Math.PI * 2, true);
    s.holes.push(hole);
    shared.tab = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false, curveSegments: 16 });
  }
  return shared as Required<typeof shared>;
}

export function createCan(label: THREE.Texture): Can {
  const { metal, lid, geo, tab } = sharedParts();
  const group = new THREE.Group();

  const body = new THREE.MeshPhysicalMaterial({
    map: label,
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const bodyMesh = new THREE.Mesh(geo, body);
  group.add(bodyMesh);

  const h = BODY_H / 2;
  // Долу: скосяване към дъното и вдлъбнатото дъно.
  group.add(
    lathe(
      [
        [0.0, -h - 0.1],
        [0.3, -h - 0.08],
        [0.38, -h - 0.15],
        [0.42, -h - 0.16],
        [0.47, -h - 0.1],
        [CAN_R, -h - 0.02],
        [CAN_R, -h + 0.001],
      ],
      metal,
    ),
  );
  // Горе: шия, ръб, капак.
  group.add(
    lathe(
      [
        [CAN_R, h - 0.001],
        [CAN_R, h + 0.03],
        [0.46, h + 0.12],
        [0.43, h + 0.17],
        [0.445, h + 0.19],
        [0.44, h + 0.215],
        [0.415, h + 0.205],
        [0.405, h + 0.15],
        [0.0, h + 0.15],
      ],
      metal,
    ),
  );
  const lidMesh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 64), lid);
  lidMesh.rotation.x = -Math.PI / 2;
  lidMesh.position.y = h + 0.152;
  group.add(lidMesh);
  const tabMesh = new THREE.Mesh(tab, metal);
  tabMesh.rotation.x = -Math.PI / 2;
  tabMesh.position.set(0, h + 0.158, 0.06);
  group.add(tabMesh);

  // Центърът на групата — по средата на цялото кенче.
  group.children.forEach((m) => (m.position.y -= 0.02));
  return { group, body };
}
