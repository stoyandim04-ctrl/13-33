import * as THREE from "three";

/*
  Довършването на механизма се рисува в <canvas> — без снимки и външни модели.
  Перлаж (кръгчета) за платината, „Côtes de Genève“ (ивици) за мостовете,
  циферблатът с минутната скала и надписите.
*/

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, repeat: number, color = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Перлаж: застъпващи се кръгчета с радиална шлифовка. 1 плочка = 4 мм. */
export function perlage() {
  const S = 512;
  const [c, g] = canvas(S, S);
  g.fillStyle = "#8a8a8a";
  g.fillRect(0, 0, S, S);
  const step = S / 8;
  const r = step * 0.78;
  for (let row = -1; row <= 9; row++) {
    for (let col = -1; col <= 9; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      const y = row * step * 0.86;
      for (let i = 0; i < 26; i++) {
        const k = i / 26;
        g.strokeStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${0.03 + 0.04 * (1 - k)})`;
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(x, y, r * (1 - k), 0, Math.PI * 2);
        g.stroke();
      }
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(40,40,40,0.35)");
      grd.addColorStop(0.7, "rgba(170,170,170,0.0)");
      grd.addColorStop(1, "rgba(220,220,220,0.25)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  return tex(c, 1 / 4);
}

/** Женевски ивици: широки диагонални ленти, всяка с полиран гребен. 1 плочка = 6 мм. */
export function cotes() {
  const S = 512;
  const [c, g] = canvas(S, S);
  const bands = 4;
  const w = S / bands;
  for (let b = 0; b < bands; b++) {
    const grd = g.createLinearGradient(b * w, 0, (b + 1) * w, 0);
    grd.addColorStop(0, "#5a5a5a");
    grd.addColorStop(0.45, "#d8d8d8");
    grd.addColorStop(0.55, "#bdbdbd");
    grd.addColorStop(1, "#4a4a4a");
    g.fillStyle = grd;
    g.fillRect(b * w, 0, w, S);
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1, 3 + Math.random() * 8);
  }
  const t = tex(c, 1 / 6);
  t.rotation = 0.5;
  return t;
}

/**
  Кръгово шлифоване (circular graining) за колелата: фини концентрични следи,
  центрирани на оста — геометрията на всяко колело е в собствени координати,
  така че кръговете са около неговата ос. 1 плочка = 14 мм.
*/
export function graining() {
  const S = 1024;
  const [c, g] = canvas(S, S);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, S, S);
  for (let r = 1; r < S * 0.72; r += 1.5) {
    const v = 110 + Math.random() * 60;
    g.strokeStyle = `rgba(${v},${v},${v},0.55)`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 16;
  t.repeat.set(1 / 14, 1 / 14);
  t.offset.set(0.5, 0.5);
  return t;
}

/** Слънчеви лъчи — за дъното на барабана и ротора. */
export function sunray() {
  const S = 512;
  const [c, g] = canvas(S, S);
  g.translate(S / 2, S / 2);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2;
    const v = 120 + Math.random() * 100;
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * S, Math.sin(a) * S);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/**
  Циферблатът: плътен дълбок син лак, минутна скала, подциферблат
  за малката секундарка и надписите. Рисува се огледално, защото гледаме платината
  отзад: x на текстурата е обърнат така, че отпред да се чете правилно.
*/
export function dial(subdial: { x: number; y: number; r: number }, R: number) {
  const S = 2048;
  const [c, g] = canvas(S, S);
  const k = S / (2 * R); // пиксели на мм
  const P = (x: number, y: number) => [S / 2 - x * k, S / 2 - y * k] as const; // огледално по x, y надолу

  const bg = g.createRadialGradient(S * 0.45, S * 0.4, 0, S / 2, S / 2, S * 0.7);
  bg.addColorStop(0, "#15306a");
  bg.addColorStop(0.55, "#0a1a44");
  bg.addColorStop(1, "#030a1e");
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);

  g.save();
  g.translate(S / 2, S / 2);
  // Минутна скала („железопътна линия“).
  const r1 = (R - 1.2) * k;
  const r2 = (R - 2.0) * k;
  g.strokeStyle = "rgba(232,210,160,0.85)";
  g.lineWidth = 2;
  for (const r of [r1, r2]) {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const len = i % 5 ? 0 : 0.5 * k;
    g.lineWidth = i % 5 ? 2 : 5;
    g.beginPath();
    g.moveTo(Math.sin(a) * (r2 - len), -Math.cos(a) * (r2 - len));
    g.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
    g.stroke();
  }
  g.restore();

  // Подциферблат на малката секундарка: концентрични вдлъбнатини.
  const [sx, sy] = P(subdial.x, subdial.y);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(255,255,255,${i % 2 ? 0.05 : 0.0})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(sx, sy, ((subdial.r * k) * (i + 1)) / 40, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = "rgba(232,210,160,0.8)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(sx, sy, subdial.r * k, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const l = (i % 15 ? 0.35 : 0.7) * k;
    g.lineWidth = i % 15 ? 1.5 : 3;
    g.beginPath();
    g.moveTo(sx + Math.sin(a) * (subdial.r * k - l), sy - Math.cos(a) * (subdial.r * k - l));
    g.lineTo(sx + Math.sin(a) * subdial.r * k, sy - Math.cos(a) * subdial.r * k);
    g.stroke();
  }

  g.fillStyle = "rgba(236,214,166,0.95)";
  g.textAlign = "center";
  g.font = `300 ${1.9 * k}px "Cormorant Garamond", Georgia, serif`;
  g.letterSpacing = `${0.55 * k}px`;
  g.fillText("KAIROS", S / 2, S / 2 - 5.6 * k);
  g.font = `400 ${0.62 * k}px "Geist Mono Variable", ui-monospace, monospace`;
  g.letterSpacing = `${0.22 * k}px`;
  g.fillStyle = "rgba(236,214,166,0.7)";
  g.fillText("CALIBRE K-13  ·  18 000 A/H", S / 2, S / 2 - 4.2 * k);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}


