import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FLAVOURS } from "../data/flavours";
import { addJob } from "./scroll";
import { CAN_H, FRUIT_KIND, createCan, drawLabel, drawSlice, loadFonts, type Can, type FruitKind } from "./can";

/*
  Сцената — едно WebGL платно зад/над цялата страница.

  Кенчетата не знаят за секциите. Всяка секция слага в DOM „котва“
  (data-anchor="hero" | "tour" | "burst" | "line-0…5" | "shop") и кенчето
  отива там, където е котвата на екрана, с височината ѝ. Между секциите
  позата се смесва по това колко от следващата секция е влязла в екрана
  (data-stage="…"), а пружина върху всяка стойност дава удара и отскока.

  Кенчета: 0–5 — по едно за вкус; 6–7 — копия на избрания (стекът в магазина).
*/

const N_CANS = 8;
const K = 7; // x y z rx ry rz s
type Pose = number[];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const easeOut = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const mix = (a: Pose, b: Pose, w: number): Pose => (w <= 0 ? a : w >= 1 ? b : a.map((v, i) => v + (b[i] - v) * w));

type Rect = { x: number; y: number; w: number; h: number };

type Particle = {
  dir: THREE.Vector3;
  dist: number;
  axis: THREE.Vector3;
  spin: number;
  size: number;
  fx: number;
  fy: number;
  fz: number;
  phase: number;
};

function makeParticles(n: number, sizeMin: number, sizeMax: number): Particle[] {
  return Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.8, 0.15 + Math.random() * 0.75).normalize();
    // Плаващите в hero-то: по краищата, не върху кенчетата.
    let fx = Math.random() - 0.5;
    if (Math.abs(fx) < 0.18) fx = Math.sign(fx || 1) * (0.18 + Math.random() * 0.3);
    return {
      dir,
      dist: 4 + Math.random() * 7,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      spin: 2 + Math.random() * 7,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      fx,
      fy: Math.random() - 0.5,
      fz: -2.5 + Math.random() * 4,
      phase: Math.random() * 10,
    };
  });
}

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private cans: Can[] = [];
  private labels: THREE.CanvasTexture[] = [];
  private pos: Float32Array = new Float32Array(N_CANS * K);
  private vel: Float32Array = new Float32Array(N_CANS * K);
  private lastSlot: number[] = new Array(N_CANS).fill(0);
  private stop: () => void = () => undefined;
  private hidden = false;
  private dpr = 1;
  private frameAvg = 0.016;
  private frameCount = 0;
  private last = 0;
  private t = 0;
  private mobile = false;
  private maxDt = new URLSearchParams(location.search).has("shot") ? 2 : 0.05;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private rim: THREE.DirectionalLight;

  sel = 0;
  hover = -1;
  shopSpin = 0;
  private shake = 0;
  private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  private introAt = Infinity;
  private els = new Map<string, Element>();

  // Частици
  private fruit!: Record<FruitKind, THREE.InstancedMesh>;
  private ice!: THREE.InstancedMesh;
  private drops!: THREE.InstancedMesh;
  private pFruit: Particle[] = [];
  private pIce: Particle[] = [];
  private pDrops: Particle[] = [];
  private sliceCanvas = document.createElement("canvas");
  private sliceTex!: THREE.CanvasTexture;
  private rindMat!: THREE.MeshStandardMaterial;
  private berryMat!: THREE.MeshPhysicalMaterial;
  private cubeMat!: THREE.MeshPhysicalMaterial;
  private dropMat!: THREE.MeshPhysicalMaterial;
  private dummy = new THREE.Object3D();

  constructor(private canvas: HTMLCanvasElement) {
    this.mobile = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-4, 6, 8);
    this.scene.add(key);
    this.rim = new THREE.DirectionalLight(0xffffff, 3.2);
    this.rim.position.set(6, 2, -5);
    this.scene.add(this.rim);

    this.camera.position.set(0, 0, 12);
  }

  async init() {
    await loadFonts();
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    this.labels = FLAVOURS.map((f) => {
      const tex = new THREE.CanvasTexture(drawLabel(f));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, aniso);
      return tex;
    });
    for (let i = 0; i < N_CANS; i++) {
      const can = createCan(this.labels[i < 6 ? i : 0]);
      can.group.rotation.order = "ZXY";
      this.scene.add(can.group);
      this.cans.push(can);
      // Начало: над екрана — падат при интрото.
      this.pos[i * K + 1] = 9 + i;
      this.pos[i * K + 6] = i < 6 ? 1 : 0;
    }
    this.buildParticles();
    // Шейдърите и текстурите — сега, докато върви интрото, а не при първата
    // експлозия (иначе тя засича за част от секундата).
    this.resize();
    this.renderer.compile(this.scene, this.camera);
    for (const tex of this.labels) this.renderer.initTexture(tex);
    this.setFlavour(this.sel, false);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
  }

  private buildParticles() {
    const nf = this.mobile ? 22 : 40;
    const ni = this.mobile ? 10 : 18;
    const nd = this.mobile ? 30 : 70;
    this.pFruit = makeParticles(nf, 0.7, 1.25);
    this.pIce = makeParticles(ni, 0.7, 1.2);
    this.pDrops = makeParticles(nd, 0.4, 1.1);

    this.sliceTex = new THREE.CanvasTexture(this.sliceCanvas);
    this.sliceTex.colorSpace = THREE.SRGBColorSpace;
    this.rindMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
    const face = new THREE.MeshPhysicalMaterial({ map: this.sliceTex, roughness: 0.35, clearcoat: 0.6, transparent: true });
    const slice = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 48), [this.rindMat, face, face], nf);

    this.berryMat = new THREE.MeshPhysicalMaterial({ roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
    const berry = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 24, 16), this.berryMat, nf);
    this.cubeMat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.8, sheen: 0.3 });
    const cube = new THREE.InstancedMesh(new RoundedBoxGeometry(0.32, 0.32, 0.32, 3, 0.06), this.cubeMat, nf);
    this.fruit = { slice, berry, cube };

    // Без transmission: тя рисува цялата сцена втори път всеки кадър.
    const iceMat = new THREE.MeshPhysicalMaterial({ color: "#eef9ff", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false });
    this.ice = new THREE.InstancedMesh(new RoundedBoxGeometry(0.42, 0.42, 0.42, 3, 0.08), iceMat, ni);
    this.dropMat = new THREE.MeshPhysicalMaterial({ roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.85 });
    this.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 12, 8), this.dropMat, nd);

    for (const m of [slice, berry, cube, this.ice, this.drops]) {
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(m);
    }
  }

  setFlavour(i: number, kick = true) {
    const prev = this.sel;
    this.sel = i;
    const f = FLAVOURS[i];
    drawSlice(f, this.sliceCanvas);
    this.sliceTex.needsUpdate = true;
    this.rindMat.color.set(f.rind);
    this.berryMat.color.set(f.flesh);
    this.cubeMat.color.set(f.flesh);
    this.dropMat.color.set(f.flesh);
    this.rim.color.set(f.id === "nula" ? f.accent : f.accent === "#0a0a0a" ? "#ffffff" : f.accent);
    const kind = FRUIT_KIND[f.id];
    (Object.keys(this.fruit) as FruitKind[]).forEach((k) => (this.fruit[k].visible = k === kind));
    for (const c of this.cans.slice(6)) c.body.map = this.labels[i];
    if (kick && prev !== i && !this.reduced) this.shake = 1;
  }

  /** Пуска кенчетата да паднат (след интрото). */
  drop() {
    this.introAt = this.t;
  }

  kick(amount = 1) {
    if (!this.reduced) this.shake = Math.max(this.shake, amount);
  }

  /**
   * Върви в общия цикъл (lib/scroll.ts): първо всички четения от DOM, после
   * записите — така браузърът не преизчислява оформлението по няколко пъти на кадър.
   */
  start() {
    this.last = performance.now();
    this.stop = addJob((now) => {
      // ?shot — за снимки в бавен браузер: по-голяма стъпка, пружината стига целта.
      const raw = (now - this.last) / 1000;
      const dt = Math.min(this.maxDt, raw);
      this.last = now;
      const draw = this.frame(dt);
      return () => {
        const hidden = !draw;
        if (hidden !== this.hidden) {
          this.hidden = hidden;
          this.canvas.style.visibility = hidden ? "hidden" : "";
        }
        if (draw) {
          this.renderer.render(this.scene, this.camera);
          this.adapt(raw);
        }
      };
    });
  }

  /**
   * Адаптивна резолюция: ако средният кадър е над ~20 мс (под 50 fps),
   * намаляме pixel ratio на стъпки до 1; ако е лесно — връщаме нагоре.
   */
  private adapt(raw: number) {
    if (raw > 0.25 || this.maxDt > 0.05) return; // скрит таб / режим за снимки
    this.frameAvg += (raw - this.frameAvg) * 0.05;
    if (++this.frameCount < 90) return;
    this.frameCount = 0;
    const max = Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 1.75);
    let next = this.dpr;
    if (this.frameAvg > 0.02) next = Math.max(1, this.dpr - 0.25);
    else if (this.frameAvg < 0.0135) next = Math.min(max, this.dpr + 0.25);
    if (next !== this.dpr) {
      this.dpr = next;
      this.renderer.setPixelRatio(next);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  }

  dispose() {
    this.stop();
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointer);
    this.renderer.dispose();
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.mobile = Math.min(w, h) < 700;
    this.dpr = Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 1.5);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private el(sel: string) {
    let e = this.els.get(sel);
    if (!e || !e.isConnected) {
      e = document.querySelector(sel) ?? undefined;
      if (e) this.els.set(sel, e);
    }
    return e;
  }

  /** Котвата в световни координати (равнината z = 0). */
  private anchor(name: string): Rect | null {
    const e = this.el(`[data-anchor="${name}"]`);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const H = window.innerHeight;
    const W = window.innerWidth;
    const wpp = this.visH() / H;
    return { x: (r.left + r.width / 2 - W / 2) * wpp, y: -(r.top + r.height / 2 - H / 2) * wpp, w: r.width * wpp, h: r.height * wpp };
  }

  private section(name: string) {
    const e = this.el(`[data-stage="${name}"]`);
    const H = window.innerHeight;
    if (!e) return { w: 0, p: 0, top: Infinity };
    const r = e.getBoundingClientRect();
    return { w: smooth((H - r.top) / H), p: clamp(-r.top / Math.max(1, r.height - H)), top: r.top };
  }

  private visH() {
    return 2 * 12 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
  }

  /** Смята кадъра; връща false, ако няма какво да се рисува. */
  private frame(dt: number): boolean {
    if (!this.cans.length) return false;
    this.t += dt;
    const t = this.t;
    const visH = this.visH();
    const visW = visH * this.camera.aspect;
    const narrow = this.camera.aspect < 0.8;

    const tour = this.section("tour");
    const burst = this.section("burst");
    const line = this.section("line");
    const shop = this.section("shop");
    const faq = this.section("faq");

    // Под FAQ платното е покрито — не рисуваме.
    if (faq.top <= 0) return false;

    const p = this.pointer;
    p.sx += (p.x - p.sx) * Math.min(1, dt * 4);
    p.sy += (p.y - p.sy) * Math.min(1, dt * 4);
    const heroVis = 1 - tour.w;

    const sel = this.sel;
    const aHero = this.anchor("hero");
    const aTour = this.anchor("tour");
    const aBurst = this.anchor("burst");
    const aShop = this.anchor("shop");
    const fit = (r: Rect | null) => (r ? r.h / CAN_H : 1);

    for (let i = 0; i < N_CANS; i++) {
      const isClone = i >= 6;
      const isSel = i === sel;
      const away: Pose = [
        (i % 2 ? 1 : -1) * visW * 0.7,
        -visH * 0.95 - (i % 3) * 0.6,
        -2,
        0.4,
        i * 1.3,
        (i % 2 ? -1 : 1) * 1.1,
        fit(aTour) * 0.8,
      ];

      // HERO — ветрило около избраното кенче.
      let hero: Pose;
      if (isClone) {
        hero = [0, -visH, -3, 0, 0, 0, 0];
      } else {
        const d = ((i - sel + 6 + 2) % 6) - 2; // −2…3
        if (Math.abs(d - this.lastSlot[i]) > 3 && heroVis > 0.5) {
          // Кенчето, което „прескача“ от единия край на другия, влита отвън.
          this.pos[i * K] += Math.sign(d - this.lastSlot[i]) * visW * 0.7;
          this.vel[i * K] = 0;
        }
        this.lastSlot[i] = d;
        const a = aHero ?? { x: 0, y: 0, w: visW, h: visH * 0.6 };
        const s0 = fit(a);
        const ad = Math.abs(d);
        const sp = narrow ? Math.min(visW * 0.27, a.h * 0.42) : Math.min(a.h * 0.5, visW * 0.16);
        const bob = Math.sin(t * 1.3 + i * 1.7) * 0.06 * a.h;
        hero = [
          a.x + d * sp + p.sx * 0.25 * (ad + 1),
          a.y - ad * a.h * 0.05 + bob - p.sy * 0.12,
          -ad * 1.1 + (d === 0 ? 0.6 : 0),
          0.06 + p.sy * 0.12,
          (d === 0 ? Math.sin(t * 0.7) * 0.4 : d * 0.32) + p.sx * 0.5,
          -d * 0.17 + (d === 0 ? -0.06 : 0),
          s0 * (d === 0 ? 1 : 0.84 - ad * 0.05),
        ];
      }

      // TOUR — избраното кенче се върти до твърденията.
      let tourP: Pose = away;
      if (isClone) tourP = [...away.slice(0, 6), 0];
      else if (isSel && aTour) {
        tourP = [aTour.x, aTour.y, 0.5, 0.12, -0.35 + tour.p * Math.PI * 2, -0.24 + Math.sin(tour.p * Math.PI) * 0.12, fit(aTour)];
      }

      // BURST — трепери, после се пръска.
      let burstP: Pose = isClone ? [...away.slice(0, 6), 0] : away;
      if (isSel && aBurst) {
        const pre = clamp(burst.p / 0.3);
        const post = easeOut((burst.p - 0.3) / 0.7);
        const amp = this.reduced ? 0 : pre * pre * (1 - post) * 0.09;
        const j = (k: number) => Math.sin(t * (47 + k * 13) + k) * amp;
        burstP = [
          aBurst.x + j(1) * 2,
          aBurst.y + j(2) * 2 + post * aBurst.h * 0.06,
          1 + post * 0.6,
          0.1 + j(3),
          post * Math.PI * 5,
          -0.1 + j(4) * 3 - post * 0.15,
          fit(aBurst) * (1 + pre * 0.12 + post * 0.06),
        ];
      }

      // LINE — всички шест в редица.
      let lineP: Pose = isClone ? [...away.slice(0, 6), 0] : away;
      if (!isClone) {
        const a = this.anchor(`line-${i}`);
        if (a) {
          const hov = this.hover === i;
          lineP = [
            a.x,
            a.y + (hov ? a.h * 0.07 : Math.sin(t * 1.1 + i) * a.h * 0.012),
            hov ? 0.8 : 0,
            0.06,
            hov ? t * 4 : Math.sin(t * 0.6 + i) * 0.25,
            hov ? 0 : (i - 2.5) * -0.03,
            fit(a) * (hov ? 1.06 : 1),
          ];
        }
      }

      // SHOP — избраното кенче + двете копия зад него.
      let shopP: Pose = isClone ? [...away.slice(0, 6), 0] : away;
      if (aShop && (isSel || isClone)) {
        const s = fit(aShop);
        const spin = this.shopSpin + t * 0.35;
        if (isSel) shopP = [aShop.x, aShop.y, 0.6, 0.05, spin, -0.1, s];
        else {
          const side = i === 6 ? -1 : 1;
          shopP = [aShop.x + side * s * 0.62, aShop.y + s * 0.12, -1.4, 0.05, spin * 0.6 + side * 0.5, side * -0.1, s * 0.92];
        }
      }

      let pose = mix(hero, tourP, tour.w);
      pose = mix(pose, burstP, burst.w);
      pose = mix(pose, lineP, line.w);
      pose = mix(pose, shopP, shop.w);

      // Интро: докато не е пуснато, кенчетата чакат над екрана.
      if (t < this.introAt + (i % 6) * 0.07) pose = [pose[0], pose[1] + visH * 1.4, pose[2], pose[3], pose[4] + 1, pose[5], pose[6]];

      this.spring(i, pose, dt);
      const o = i * K;
      const g = this.cans[i].group;
      g.position.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]);
      g.rotation.set(this.pos[o + 3], this.pos[o + 4], this.pos[o + 5]);
      const sc = Math.max(0, this.pos[o + 6]);
      g.scale.setScalar(sc);
      g.visible = sc > 0.01;
    }

    this.updateParticles(heroVis * (t > this.introAt + 0.3 ? 1 : 0), burst, line.w, aHero, aBurst, visW, visH);

    // Камера: паралакс в hero-то + трус.
    const burstShake = this.reduced ? 0 : burst.w > 0.9 ? Math.max(0, 1 - Math.abs(burst.p - 0.31) * 9) * 0.5 : 0;
    this.shake *= Math.exp(-dt * 4.5);
    const sh = Math.max(this.shake * 0.18, burstShake * 0.25);
    this.camera.position.set(
      p.sx * 0.3 * heroVis + Math.sin(t * 71) * sh,
      -p.sy * 0.2 * heroVis + Math.cos(t * 63) * sh,
      12,
    );
    this.camera.rotation.z = Math.sin(t * 57) * sh * 0.04;

    return true;
  }

  private spring(i: number, target: Pose, dt: number) {
    const k = 150;
    const c = 2 * Math.sqrt(k) * 0.74;
    const steps = Math.max(2, Math.ceil(dt / 0.01));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (let j = 0; j < K; j++) {
        const o = i * K + j;
        const a = k * (target[j] - this.pos[o]) - c * this.vel[o];
        this.vel[o] += a * h;
        this.pos[o] += this.vel[o] * h;
      }
    }
  }

  private updateParticles(
    heroVis: number,
    burst: { w: number; p: number },
    lineW: number,
    aHero: Rect | null,
    aBurst: Rect | null,
    visW: number,
    visH: number,
  ) {
    const t = this.t;
    const d = this.dummy;
    const post = easeOut((burst.p - 0.3) / 0.7);
    const fired = burst.w > 0.6 && burst.p > 0.3;
    const pop = clamp((burst.p - 0.3) * 25);
    const burstVis = fired ? pop * (1 - lineW) : 0;
    const ox = aBurst?.x ?? 0;
    const oy = aBurst?.y ?? 0;
    const hy = aHero?.y ?? 0;

    const place = (m: THREE.InstancedMesh, list: Particle[], k: number, inHero: number, scale: number) => {
      // Рисуваме само видимите: в hero-то — първите няколко, при експлозията — всички.
      const shown = burstVis > 0 ? list.length : heroVis > 0 ? inHero : 0;
      m.count = shown;
      if (!shown) return;
      list.forEach((q, n) => {
        if (n >= shown) return;
        let vis = 0;
        if (burstVis > 0) {
          vis = burstVis;
          d.position.set(ox + q.dir.x * q.dist * post, oy + q.dir.y * q.dist * post, 0.5 + q.dir.z * q.dist * post * 0.75);
          d.quaternion.setFromAxisAngle(q.axis, q.spin * post * 2 + q.phase);
        } else if (n < inHero && heroVis > 0) {
          vis = heroVis;
          d.position.set(
            q.fx * visW * 1.05,
            hy + q.fy * visH * 0.9 + Math.sin(t * 0.8 + q.phase) * 0.18 + (1 - heroVis) * 2,
            q.fz,
          );
          d.quaternion.setFromAxisAngle(q.axis, t * 0.25 * k + q.phase);
        }
        d.scale.setScalar(q.size * scale * vis);
        d.updateMatrix();
        m.setMatrixAt(n, d.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    };

    const kind = FRUIT_KIND[FLAVOURS[this.sel].id];
    place(this.fruit[kind], this.pFruit, 1, this.mobile ? 6 : 12, 1);
    place(this.ice, this.pIce, 0.7, this.mobile ? 3 : 6, 1);
    place(this.drops, this.pDrops, 2, 0, 1);
  }
}
