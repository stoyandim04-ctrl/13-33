import * as THREE from "three";
import { POS } from "./movement";

/*
  Кадрите на филма — в координатите на часовника (мм). `at` е мястото в скрола
  (0 → 1). Между кадрите всичко се смесва плавно:
  fov — обективът; inside — мъгла/прах/сонда (0 отвън, 1 вътре);
  rate — скоростта на времето (1 = реално, 0.1 = десет пъти забавено);
  flash — бяла светкавица (минаване през стъкло); set — стрелките към 13:33;
  dial — светлина върху циферблата; shake — „ръчната“ камера; roll — наклон.
*/
export type Shot = {
  at: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov?: number;
  inside?: number;
  rate?: number;
  flash?: number;
  set?: number;
  dial?: number;
  shake?: number;
  roll?: number;
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const { barrel, third, fourth, escape, balance, minute } = POS;
const win = { x: 9.2 * Math.cos((215 * Math.PI) / 180), y: 9.2 * Math.sin((215 * Math.PI) / 180) };

export const SHOTS: Shot[] = [
  // Пролог — часовникът виси в мрак.
  { at: 0.0, pos: v(0, 10, -150), look: v(0, 8, 0), fov: 24, dial: 1 },
  { at: 0.07, pos: v(-12, 3, -64), look: v(0, 0.5, 0), fov: 27, dial: 1 },
  // Обикаляме към гърба — стъклото на капака.
  { at: 0.14, pos: v(-72, 12, 6), look: v(0, 0, 1), fov: 28, dial: 0.5 },
  { at: 0.21, pos: v(-18, 9, 54), look: v(0, 0, 2), fov: 30 },
  { at: 0.26, pos: v(-5, 3, 17), look: v(-1, 1, 2), fov: 40, inside: 0.3 },
  // През стъклото.
  { at: 0.29, pos: v(-4.5, 2.5, 6.7), look: v(-2, 2, 1), fov: 56, inside: 0.85, flash: 0.3, rate: 0.6, shake: 0.4 },
  // I. Ходовата линия — ниско, между колелата.
  { at: 0.33, pos: v(-7.2, 0.6, 0.5), look: v(-1.4, 2.7, 1.1), fov: 72, inside: 1, rate: 0.35, shake: 0.15 },
  { at: 0.39, pos: v(-1.6, -1.6, 0.42), look: v(third.x, third.y, 1.5), fov: 74, inside: 1, rate: 0.35, shake: 0.12, roll: 0.18 },
  { at: 0.45, pos: v(4.9, -2.1, 1.35), look: v(fourth.x + 0.6, fourth.y + 0.4, 1.5), fov: 70, inside: 1, rate: 0.3, shake: 0.12 },
  { at: 0.5, pos: v(5.6, -5.0, 1.45), look: v(escape.x, escape.y, 0.9), fov: 66, inside: 1, rate: 0.25, shake: 0.1 },
  // II. Балансът — махалото с размер на сграда.
  { at: 0.56, pos: v(10.2, -2.6, 2.25), look: v(balance.x, balance.y, 3.3), fov: 78, inside: 1, rate: 0.1, shake: 0.08, roll: 0.1 },
  { at: 0.63, pos: v(12.6, -10.6, 2.7), look: v(balance.x, balance.y, 3.0), fov: 62, inside: 1, rate: 0.1, shake: 0.08, roll: -0.22 },
  // III. Рубините и пружината.
  { at: 0.69, pos: v(3.9, -6.3, 1.25), look: v(escape.x + 0.6, escape.y + 0.3, 0.9), fov: 64, inside: 1, rate: 0.15, shake: 0.08 },
  { at: 0.75, pos: v(-0.9, 1.6, 2.7), look: v(barrel.x - 0.6, barrel.y + 1.2, 0.8), fov: 70, inside: 1, rate: 0.3, shake: 0.1 },
  { at: 0.8, pos: v(-7.6, 2.6, 2.6), look: v(win.x, win.y, 0), fov: 66, inside: 1, rate: 0.3, shake: 0.1 },
  // IV. Надолу през платината — към стрелковия механизъм и циферблата.
  { at: 0.85, pos: v(win.x + 0.2, win.y + 0.9, 1.3), look: v(win.x + 0.3, win.y, -2), fov: 70, inside: 1, rate: 0.3, shake: 0.1 },
  { at: 0.89, pos: v(win.x + 1.2, win.y + 1.0, -1.5), look: v(minute.x, minute.y, -1.3), fov: 72, inside: 1, rate: 0.3, dial: 0.3, shake: 0.1 },
  { at: 0.92, pos: v(-3.6, -2.6, -1.95), look: v(-3.2, -2.2, -6), fov: 64, inside: 1, rate: 0.5, dial: 0.6 },
  { at: 0.935, pos: v(-3.0, -2.1, -3.2), look: v(-2.2, -1.5, -8), fov: 60, inside: 0.6, rate: 0.7, flash: 0.6, dial: 1 },
  // Отпред: стрелките застават на 13:33.
  { at: 0.955, pos: v(-1.6, -1.2, -13), look: v(0, 0, -2), fov: 46, inside: 0.1, rate: 1, dial: 1, set: 0.25 },
  { at: 1.0, pos: v(0, -13, -122), look: v(0, -13, -2), fov: 30, rate: 1, dial: 1, set: 1 },
];
