// The Варовик building and its day. Everything is built from primitives here -
// no models, no photos - so the concept carries no third-party imagery.
// Scroll progress picks a point on the camera path and an hour of the day; the
// hour moves the sun, re-colours the sky and lights the windows at dusk.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { clamp01, hourAt, nightAt, smoothstep } from "./day";

export interface SceneOptions {
  /** Phones and weak GPUs: no mirror pool, no bloom, smaller shadows. */
  lite: boolean;
  /** prefers-reduced-motion: no intro flight, no idle drift, no easing. */
  still: boolean;
  /** Called every frame with the eased progress the picture is showing. */
  onFrame?: (progress: number) => void;
}

export interface VarovikScene {
  setProgress(p: number): void;
  resize(): void;
  setActive(active: boolean): void;
  dispose(): void;
}

/* ---------------------------------------------------------------- palette */

const STONE = 0xe4d8c4;
const STONE_DARK = 0xcbbba2;
const PAVING = 0xddd0bb;
const GROUND = 0xffffff; // tinted by the meadow texture
const FOLIAGE = 0x7c8460;
const CYPRESS = 0x56603f;
const TRUNK = 0x6b5a48;

/* --------------------------------------------------- light through the day */

type Key = { h: number; v: number | string };
const track = (pairs: [number, number | string][]): Key[] => pairs.map(([h, v]) => ({ h, v }));

const SUN_COLOR = track([[5.8, "#ff9d6b"], [7, "#ffc48d"], [9.5, "#ffe5c6"], [12.5, "#fff3e3"], [16, "#ffe0b8"], [18.3, "#ffa25a"], [19.2, "#ff7442"], [20.2, "#ff5a3c"], [21, "#000000"]]);
const SUN_INT = track([[5.8, 0.6], [7, 2.6], [9.5, 3.3], [12.5, 3.6], [16, 3.3], [18.3, 2.9], [19.2, 1.2], [20, 0], [21, 0]]);
const SKY_TOP = track([[5.8, "#8a93ad"], [7, "#93a9c4"], [9.5, "#8eaccc"], [12.5, "#7ea2cc"], [16, "#8fa8c6"], [18.3, "#7e86a8"], [19.2, "#4c5480"], [20.2, "#1b2440"], [21, "#10152a"]]);
const SKY_LOW = track([[5.8, "#f0c09a"], [7, "#f1d6ba"], [9.5, "#e6dccb"], [12.5, "#e2dccf"], [16, "#eed6b6"], [18.3, "#f0a670"], [19.2, "#de7f58"], [20.2, "#5f4c60"], [21, "#2a2a3e"]]);
const HEMI = track([[5.8, 0.28], [7, 0.4], [12.5, 0.55], [16, 0.5], [18.3, 0.4], [19.2, 0.3], [20.2, 0.16], [21, 0.12]]);
const EXPOSURE = track([[5.8, 1], [9.5, 0.9], [12.5, 0.8], [16, 0.86], [18.3, 0.95], [20.2, 0.95]]);
const ENV = track([[5.8, 0.14], [7, 0.22], [12.5, 0.34], [16, 0.3], [18.3, 0.24], [19.2, 0.16], [20.2, 0.08], [21, 0.06]]);

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function sampleNumber(keys: Key[], h: number) {
  if (h <= keys[0].h) return keys[0].v as number;
  for (let i = 1; i < keys.length; i++) {
    if (h <= keys[i].h) {
      const t = (h - keys[i - 1].h) / (keys[i].h - keys[i - 1].h);
      return (keys[i - 1].v as number) + t * ((keys[i].v as number) - (keys[i - 1].v as number));
    }
  }
  return keys[keys.length - 1].v as number;
}

function sampleColor(keys: Key[], h: number, out: THREE.Color) {
  if (h <= keys[0].h) return out.set(keys[0].v as string);
  for (let i = 1; i < keys.length; i++) {
    if (h <= keys[i].h) {
      const t = (h - keys[i - 1].h) / (keys[i].h - keys[i - 1].h);
      tmpA.set(keys[i - 1].v as string);
      tmpB.set(keys[i].v as string);
      return out.copy(tmpA).lerp(tmpB, t);
    }
  }
  return out.set(keys[keys.length - 1].v as string);
}

/** Sun direction for an hour: rises in the east (+x), south is +z (the
 *  facade), sets in the west. Clamped a little above the horizon so the
 *  shadows stay finite while the light fades out. */
function sunDirection(hour: number, out: THREE.Vector3) {
  const f = (hour - 5.9) / (19.4 - 5.9);
  const az = Math.PI * f;
  // a little artistic licence: never below 9°, so morning and evening
  // shadows stay long but still land on the ground
  const el = THREE.MathUtils.degToRad(9 + Math.sin(Math.PI * clamp01(f)) * 50);
  return out.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el) * 0.6 + 0.25).normalize();
}

/* ------------------------------------------------------------- camera path */

// Building centred on the origin, facade toward +z, pool in front of it.
const CAM_POS = [
  new THREE.Vector3(-66, 40, 90), // dawn: the whole site from above
  new THREE.Vector3(-44, 15, 54), // morning: approach on the diagonal
  new THREE.Vector3(-36, 15, 34), // noon: along the terraces
  new THREE.Vector3(27, 2.6, 36), // sunset: down at the water, along the pool
  new THREE.Vector3(2, 9, 80), // dusk: step back, the house lit
];
const CAM_LOOK = [
  new THREE.Vector3(0, 6, -2),
  new THREE.Vector3(0, 8, 0),
  new THREE.Vector3(8, 7.5, -1),
  new THREE.Vector3(-3, 6, 11),
  new THREE.Vector3(0, 7.5, 0),
];
const INTRO_OFFSET = new THREE.Vector3(-40, 46, 70);

/* ----------------------------------------------------------- deterministic */

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Dry meadow and gravel: soft blotches, tiled far across the site. */
function meadowTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const r = seeded(5);
  ctx.fillStyle = "#d2c2a3";
  ctx.fillRect(0, 0, size, size);
  const tones = ["#c6bc96", "#cdbb98", "#dacbac", "#bfb68f", "#d5c4a2"];
  for (let i = 0; i < 520; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 8 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const tone = tones[Math.floor(r() * tones.length)];
    g.addColorStop(0, tone + "66");
    g.addColorStop(1, tone + "00");
    ctx.fillStyle = g;
    // draw wrapped so the tile has no seams
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      ctx.restore();
    }
  }
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(120,110,80,0.18)" : "rgba(240,228,205,0.2)";
    ctx.fillRect(r() * size, r() * size, 1.2, 1.2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(70, 70);
  return tex;
}

/* ------------------------------------------------------------------- scene */

export function createVarovikScene(host: HTMLElement, opts: SceneOptions): VarovikScene | null {
  const { lite, still } = opts;
  const canvas = document.createElement("canvas");
  canvas.className = "absolute inset-0 block size-full";
  canvas.setAttribute("aria-hidden", "true");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  host.appendChild(canvas);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.3 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 2400);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTex = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTex;
  room.dispose();
  pmrem.dispose();

  scene.fog = new THREE.Fog(0xebe4d9, 260, 1500);

  /* sky: a gradient dome with a soft sun, following the camera */
  const skyUniforms = {
    uTop: { value: new THREE.Color() },
    uLow: { value: new THREE.Color() },
    uSun: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunVis: { value: 1 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uLow; uniform vec3 uSun;
        uniform vec3 uSunDir; uniform float uSunVis;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(uLow, uTop, smoothstep(-0.02, 0.5, h));
          col = mix(col, uLow * 0.92, smoothstep(0.0, -0.2, h));
          float s = max(dot(d, normalize(uSunDir)), 0.0);
          col += uSun * (pow(s, 900.0) * 6.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.08) * uSunVis;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  sky.renderOrder = -1;
  scene.add(sky);

  /* lights */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb39a7a, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -62;
  sc.right = 62;
  sc.top = 52;
  sc.bottom = -52;
  sc.near = 10;
  sc.far = 320;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  sun.shadow.radius = 3;
  sun.target.position.set(0, 4, 4);
  scene.add(sun, sun.target);

  /* materials */
  const mat = {
    stone: new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.92 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 0.95 }),
    paving: new THREE.MeshStandardMaterial({ color: PAVING, roughness: 0.95 }),
    ground: new THREE.MeshStandardMaterial({ color: GROUND, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x22252a,
      metalness: 0.85,
      roughness: 0.06,
      transparent: true,
      opacity: 0.58,
      envMapIntensity: 1.4,
    }),
    rail: new THREE.MeshStandardMaterial({ color: 0xcfd6d6, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false }),
    frame: new THREE.MeshStandardMaterial({ color: 0x3a342e, roughness: 0.6, metalness: 0.3 }),
    roomLit: new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 1, emissive: new THREE.Color(0xff9a4a), emissiveIntensity: 0 }),
    roomDim: new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 1, emissive: new THREE.Color(0xff9c55), emissiveIntensity: 0 }),
    foliage: new THREE.MeshStandardMaterial({ color: FOLIAGE, roughness: 0.9, flatShading: true }),
    cypress: new THREE.MeshStandardMaterial({ color: CYPRESS, roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: TRUNK, roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0x2c2620, emissive: new THREE.Color(0xffc27a), emissiveIntensity: 0 }),
  };

  const root = new THREE.Group();
  scene.add(root);

  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, cast = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  /* ground and site */
  const groundTex = meadowTexture();
  groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  mat.ground.map = groundTex;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1100, 64), mat.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const PLINTH = 1.1;
  box(52, PLINTH, 32, mat.stoneDark, 0, PLINTH / 2, 0.5);
  box(60, 0.12, 30, mat.paving, 2, 0.06, 28, false); // pool deck
  // steps from the deck up to the plinth
  for (let i = 0; i < 4; i++) box(10, 0.28, 0.9, mat.stone, -14, 0.14 + i * 0.27, 17.4 - i * 0.9);

  /* the building: five stepped floors, deep cantilevered terraces */
  const FLOOR_H = 3.5;
  const SLAB = 0.42;
  const TERRACE = 3.4;
  const FLOORS = [
    { w: 40, d: 15, z: 0 },
    { w: 38, d: 14, z: -1.6 },
    { w: 36, d: 13, z: -3.2 },
    { w: 32, d: 12, z: -4.8 },
    { w: 21, d: 10, z: -6.6, x: -4 },
  ];
  const rand = seeded(1333);
  const planterSpots: THREE.Vector3[] = [];
  const lamps: THREE.Vector3[] = [];

  FLOORS.forEach((f, i) => {
    const x0 = f.x ?? 0;
    const y0 = PLINTH + i * FLOOR_H;
    const front = f.z + f.d / 2;
    const roomH = FLOOR_H - SLAB;

    // floor slab with the terrace in front; it is also the roof of the floor
    // below, so it is never narrower than that floor
    const below = FLOORS[i - 1];
    const sw = Math.max(f.w, below?.w ?? 0) + 1.6;
    const sx = below && below.w > f.w ? below.x ?? 0 : x0;
    box(sw, SLAB, f.d + TERRACE, mat.stone, sx, y0 + SLAB / 2, f.z + TERRACE / 2);
    // upstand on the slab edge
    box(sw, 0.28, 0.3, mat.stone, sx, y0 + SLAB + 0.14, front + TERRACE - 0.15);
    // glass balustrade
    const rail = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.2, 1.05), mat.rail);
    rail.position.set(sx, y0 + SLAB + 0.8, front + TERRACE - 0.08);
    root.add(rail);

    // solid ends and back wall
    box(0.7, roomH, f.d, mat.stone, x0 - f.w / 2 + 0.35, y0 + SLAB + roomH / 2, f.z);
    box(0.7, roomH, f.d, mat.stone, x0 + f.w / 2 - 0.35, y0 + SLAB + roomH / 2, f.z);
    box(f.w, roomH, 0.6, mat.stone, x0, y0 + SLAB + roomH / 2, f.z - f.d / 2 + 0.3);

    // rooms behind the glass, split into homes so dusk lights them unevenly
    const inner = f.w - 1.4;
    const homes = i === 4 ? 2 : 4;
    for (let k = 0; k < homes; k++) {
      const w = inner / homes;
      const lit = i === 4 || rand() > 0.3;
      box(w - 0.04, roomH - 0.02, f.d - 1.6, lit ? mat.roomLit : mat.roomDim, x0 - inner / 2 + w * (k + 0.5), y0 + SLAB + roomH / 2, f.z - 0.4, false);
    }

    // front glazing with slim mullions and stone fins every other bay
    const bays = Math.round(inner / 2.6);
    const bw = inner / bays;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(inner, roomH), mat.glass);
    glass.position.set(x0, y0 + SLAB + roomH / 2, front + 0.02);
    root.add(glass);
    for (let b = 0; b <= bays; b++) {
      const bx = x0 - inner / 2 + b * bw;
      if (b % 2 === 0) box(0.22, roomH, 0.7, mat.stone, bx, y0 + SLAB + roomH / 2, front + 0.35);
      else box(0.06, roomH, 0.1, mat.frame, bx, y0 + SLAB + roomH / 2, front + 0.06, false);
    }
    // planters along part of the terrace edge
    const pw = f.w * (0.3 + rand() * 0.15);
    const px = x0 + (rand() > 0.5 ? 1 : -1) * (f.w / 2 - pw / 2 - 1.2);
    box(pw, 0.62, 0.9, mat.stone, px, y0 + SLAB + 0.31, front + TERRACE - 0.75);
    for (let s = 0; s < pw / 0.8; s++) {
      planterSpots.push(new THREE.Vector3(px - pw / 2 + 0.4 + s * 0.8 + (rand() - 0.5) * 0.3, y0 + SLAB + 0.75, front + TERRACE - 0.75 + (rand() - 0.5) * 0.3));
    }
    // a soft light under each cantilever for the evening
    lamps.push(new THREE.Vector3(x0 - f.w / 4, y0, front + 0.7));
    lamps.push(new THREE.Vector3(x0 + f.w / 4, y0, front + 0.7));
  });

  // roof over the penthouse
  const top = FLOORS[4];
  const roofY = PLINTH + 5 * FLOOR_H;
  box(top.w + 2.4, SLAB, top.d + 3.4, mat.stone, top.x ?? 0, roofY + SLAB / 2, top.z + 1.4);

  // recessed downlights: small emissive discs under the slabs
  const lampGeo = new THREE.CircleGeometry(0.18, 12);
  const lampMesh = new THREE.InstancedMesh(lampGeo, mat.lamp, lamps.length * 4);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  let li = 0;
  for (const l of lamps) {
    for (let k = 0; k < 4; k++) {
      m4.compose(new THREE.Vector3(l.x - 4.5 + k * 3, l.y + FLOOR_H - 0.02, l.z), q, new THREE.Vector3(1, 1, 1));
      lampMesh.setMatrixAt(li++, m4);
    }
  }
  root.add(lampMesh);

  /* water */
  let water: THREE.Mesh;
  const POOL = { w: 30, d: 6.5, x: 4, z: 28 };
  if (!lite) {
    const reflector = new Reflector(new THREE.PlaneGeometry(POOL.w, POOL.d), {
      textureWidth: Math.min(1024, window.innerWidth),
      textureHeight: Math.min(1024, window.innerHeight),
      color: new THREE.Color(0x8fa3a3),
      clipBias: 0.003,
    });
    water = reflector;
  } else {
    water = new THREE.Mesh(
      new THREE.PlaneGeometry(POOL.w, POOL.d),
      new THREE.MeshStandardMaterial({ color: 0x3f6f7a, roughness: 0.06, metalness: 0.7, envMapIntensity: 2.2 }),
    );
  }
  water.rotation.x = -Math.PI / 2;
  water.position.set(POOL.x, 0.15, POOL.z);
  root.add(water);
  // coping
  box(POOL.w + 1.2, 0.26, 0.6, mat.stone, POOL.x, 0.13, POOL.z - POOL.d / 2 - 0.3, false);
  box(POOL.w + 1.2, 0.26, 0.6, mat.stone, POOL.x, 0.13, POOL.z + POOL.d / 2 + 0.3, false);
  box(0.6, 0.26, POOL.d, mat.stone, POOL.x - POOL.w / 2 - 0.3, 0.13, POOL.z, false);
  box(0.6, 0.26, POOL.d, mat.stone, POOL.x + POOL.w / 2 + 0.3, 0.13, POOL.z, false);
  // two loungers and a low wall: scale cues for the eye
  box(0.8, 0.35, 2, mat.stone, POOL.x - 6, 0.3, POOL.z - POOL.d / 2 - 2.2);
  box(0.8, 0.35, 2, mat.stone, POOL.x - 4.4, 0.3, POOL.z - POOL.d / 2 - 2.2);
  box(18, 1, 0.5, mat.stoneDark, -30, 0.5, 30);

  /* planting */
  const blob = new THREE.IcosahedronGeometry(1, 1);
  const plants = new THREE.InstancedMesh(blob, mat.foliage, planterSpots.length);
  planterSpots.forEach((p, k) => {
    const s = 0.35 + rand() * 0.25;
    m4.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(), rand(), rand())), new THREE.Vector3(s * 1.2, s, s));
    plants.setMatrixAt(k, m4);
  });
  plants.castShadow = true;
  root.add(plants);

  const olives: THREE.Vector3[] = [];
  const isFree = (x: number, z: number) =>
    !(Math.abs(x) < 31 && z > -18 && z < 21) && !(Math.abs(x - POOL.x) < 22 && Math.abs(z - POOL.z) < 9) && !(x < -6 && x > -24 && z > 14 && z < 30);
  for (let tries = 0; olives.length < (lite ? 46 : 80) && tries < 2000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = 26 + Math.pow(rand(), 0.7) * 150;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * 0.8 + 10;
    if (isFree(x, z) && z < 120) olives.push(new THREE.Vector3(x, 0, z));
  }
  // a short olive grove by the pool, placed by hand
  [[-22, 40], [-12, 44], [24, 40], [30, 20], [-34, 14], [-38, 24]].forEach(([x, z]) => olives.push(new THREE.Vector3(x, 0, z)));

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6);
  trunkGeo.translate(0, 1.1, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, mat.trunk, olives.length);
  const crowns = new THREE.InstancedMesh(blob, mat.foliage, olives.length * 3);
  olives.forEach((o, k) => {
    const s = 0.8 + rand() * 0.6;
    m4.compose(o, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * 6, (rand() - 0.5) * 0.3)), new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(k, m4);
    for (let c = 0; c < 3; c++) {
      const p = new THREE.Vector3(o.x + (rand() - 0.5) * 2.2 * s, (2.4 + rand() * 0.9) * s, o.z + (rand() - 0.5) * 2.2 * s);
      const cs = (1.1 + rand() * 0.6) * s;
      m4.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(), rand(), rand())), new THREE.Vector3(cs * 1.25, cs * 0.8, cs * 1.15));
      crowns.setMatrixAt(k * 3 + c, m4);
    }
  });
  trunks.castShadow = crowns.castShadow = true;
  root.add(trunks, crowns);

  // a row of cypresses behind the house
  const cyGeo = new THREE.ConeGeometry(1.15, 10, 7);
  cyGeo.translate(0, 5, 0);
  const cyCount = 22;
  const cypresses = new THREE.InstancedMesh(cyGeo, mat.cypress, cyCount);
  for (let k = 0; k < cyCount; k++) {
    const x = -48 + k * 4.6 + (rand() - 0.5) * 1.4;
    const s = 0.8 + rand() * 0.45;
    m4.compose(new THREE.Vector3(x, 0, -22 - rand() * 4), new THREE.Quaternion(), new THREE.Vector3(s, s * (0.9 + rand() * 0.4), s));
    cypresses.setMatrixAt(k, m4);
  }
  cypresses.castShadow = true;
  root.add(cypresses);

  /* mountains: two flat ridgelines, coloured with the sky instead of fog */
  const ridge = (z: number, width: number, base: number, peak: number, seed: number) => {
    const r = seeded(seed);
    const seg = 160;
    const geo = new THREE.PlaneGeometry(width, 1, seg, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const phase = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const h =
        base +
        peak *
          (0.55 * Math.pow(Math.sin(u * Math.PI), 1.4) +
            0.25 * Math.sin(u * 7.1 + phase[0]) +
            0.12 * Math.sin(u * 17.3 + phase[1]) +
            0.05 * Math.sin(u * 41 + phase[2]));
      pos.setY(i, Math.max(h, 4)); // top row
      pos.setY(i + seg + 1, -5); // bottom row
    }
    const m = new THREE.ShaderMaterial({
      uniforms: { uRidge: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() } },
      fog: false,
      vertexShader: /* glsl */ `
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uRidge; uniform vec3 uHaze; varying float vY;
        void main() {
          // haze pools at the foot of the range, the crest stays crisp
          float t = smoothstep(0.0, ${(base + peak * 0.8).toFixed(1)}, vY);
          gl_FragColor = vec4(mix(uHaze, uRidge, pow(t, 0.7)), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(0, 0, z);
    scene.add(mesh);
    return m.uniforms as { uRidge: { value: THREE.Color }; uHaze: { value: THREE.Color } };
  };
  const farRidge = ridge(-1000, 3400, 30, 190, 7);
  const nearRidge = ridge(-700, 2600, 6, 90, 19);

  /* post */
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (!lite) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // contact shadows under slabs and planters: what makes it read as built, not drawn
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 1.6, distanceExponent: 1.4, thickness: 2, scale: 1.1 });
    ao.blendIntensity = 0.85;
    composer.addPass(ao);
    bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.25, 0.6, 0.86);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* ------------------------------------------------------------- per frame */

  const posCurve = new THREE.CatmullRomCurve3(CAM_POS, false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(CAM_LOOK, false, "centripetal");
  const sunDir = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const cTop = new THREE.Color();
  const cLow = new THREE.Color();
  const cSun = new THREE.Color();

  let target = 0;
  let shown = 0;
  let intro = still ? 0 : 1;
  let active = true;
  let raf = 0;
  let last = performance.now();
  const born = last;
  let portrait = false;

  function applyDay(p: number) {
    const hour = hourAt(p);
    const night = nightAt(hour);
    sampleColor(SKY_TOP, hour, cTop);
    sampleColor(SKY_LOW, hour, cLow);
    sampleColor(SUN_COLOR, hour, cSun);
    sunDirection(hour, sunDir);

    skyUniforms.uTop.value.copy(cTop);
    skyUniforms.uLow.value.copy(cLow);
    skyUniforms.uSun.value.copy(cSun);
    skyUniforms.uSunDir.value.copy(sunDir);
    skyUniforms.uSunVis.value = 1 - smoothstep(19.3, 20, hour);

    sun.color.copy(cSun);
    sun.intensity = sampleNumber(SUN_INT, hour);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 160);
    hemi.color.copy(cTop).lerp(cLow, 0.4);
    hemi.groundColor.set(0xb39a7a).multiplyScalar(1 - night * 0.6);
    hemi.intensity = sampleNumber(HEMI, hour);
    scene.environmentIntensity = sampleNumber(ENV, hour);
    (scene.fog as THREE.Fog).color.copy(cLow);

    farRidge.uHaze.value.copy(cLow);
    farRidge.uRidge.value.copy(cLow).lerp(cTop, 0.45).multiplyScalar(0.94);
    nearRidge.uHaze.value.copy(cLow).multiplyScalar(0.97);
    nearRidge.uRidge.value.copy(cLow).lerp(cTop, 0.6).multiplyScalar(0.8 - night * 0.2);

    mat.roomLit.emissiveIntensity = night * (lite ? 1.9 : 1.5);
    mat.roomDim.emissiveIntensity = night * 0.18;
    mat.glass.opacity = 0.62 - night * 0.42;
    mat.lamp.emissiveIntensity = night * 5;
    // bloom only after dark: by day it would turn the white stone milky
    if (bloom) bloom.strength = night * 0.6;
    renderer.toneMappingExposure = sampleNumber(EXPOSURE, hour);
  }

  function frame(now: number) {
    raf = active ? requestAnimationFrame(frame) : 0;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    const k = still ? 1 : 1 - Math.pow(1 - 0.075, dt * 60);
    shown += (target - shown) * k;
    if (Math.abs(target - shown) < 1e-5) shown = target;
    if (!still) {
      const t = Math.min((now - born) / 3200, 1);
      intro = 1 - (1 - Math.pow(1 - t, 3));
    }

    applyDay(shown);

    posCurve.getPoint(shown, camPos);
    lookCurve.getPoint(shown, camLook);
    if (portrait) {
      // tall screens: pull back along the view so the building still fits
      const back = camPos.clone().sub(camLook).multiplyScalar(0.55);
      camPos.add(back);
    }
    camPos.addScaledVector(INTRO_OFFSET, intro);
    if (!still) {
      const t = now / 1000;
      camPos.x += Math.sin(t * 0.21) * 0.5;
      camPos.y += Math.sin(t * 0.17) * 0.25;
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    sky.position.copy(camera.position);

    if (composer) composer.render();
    else renderer.render(scene, camera);
    opts.onFrame?.(shown);
  }

  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    portrait = w / h < 0.9;
    camera.aspect = w / h;
    camera.fov = portrait ? 48 : 36;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
  }

  resize();
  applyDay(0);
  raf = requestAnimationFrame(frame);

  return {
    setProgress(p) {
      target = clamp01(p);
    },
    resize,
    setActive(a) {
      if (a === active) return;
      active = a;
      if (a && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    dispose() {
      active = false;
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      if (water instanceof Reflector) water.dispose();
      envTex.dispose();
      groundTex.dispose();
      composer?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
