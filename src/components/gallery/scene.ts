// The 3D gallery: one WebGL scene that the page scroll drives from the
// title (a ribbon of windows running through it) to the wall of projects, the
// globe behind „За нас“ and the logo. The same windows travel through every
// stretch; only their layout changes (timeline.ts).
//
// Every window shows the best still of its site (4K on a large screen, loaded
// when the window matters); a click plays the site's clip inside the window,
// a second click opens the site. Under the pointer a window bends like paper.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { MARK_BLUE, MARK_CYAN, MARK_POLYGONS, tracePolygon } from "@/components/brand/logo-geometry";
import { CH, clamp01, easeInOut, easeOut, moodAt, seg, smooth, within } from "@/components/gallery/timeline";

export interface GalleryWindow {
  /** Index of the project it belongs to. */
  project: number;
  poster: string;
  poster4k: string;
  mp4: string;
  webm: string;
}

/** One line of the title: parts in the sans and in the display serif. */
export type TitleLine = { text: string; serif: boolean }[];

export interface TitleSpec {
  lines: TitleLine[];
  small: string;
  lang: string;
  /** Canvas font strings for a size in px. */
  sans: (px: number) => string;
  serif: (px: number) => string;
}

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  windows: GalleryWindow[];
  phone: boolean;
  title: TitleSpec;
  /** The window under the pointer (or clicked) changed. */
  onFocus: (window: number | null) => void;
  /** A playing window was clicked again: open its site. */
  onOpen: (window: number) => void;
  /** Where the header keeps the logo, in CSS pixels. */
  logoSlot: () => DOMRect | null;
  /** Called every frame with the smoothed progress (for the HTML layers). */
  onFrame: (p: number) => void;
  /** The device can't keep up, or WebGL died: show the light version. */
  onFail: () => void;
}

const PAPER = new THREE.Color("#E8E8EA");
const NIGHT = new THREE.Color("#0A0D16");
const FOV = 35;
const CAM_Z = 10;

type V3 = [number, number, number];

// Ribbon shapes (control points of one Catmull-Rom curve), for a landscape
// screen; x is narrowed on a phone. The ribbon morphs from one to the next.
const K_HERO: V3[] = [
  [-7.6, -4.4, 1.3], [-4.3, -2.7, 1.1], [-1.7, -1.35, 0.7], [0.7, -0.95, -0.5],
  [2.9, -0.45, -1.0], [4.9, 0.55, -0.3], [7.8, 1.7, 0.9],
];
const K_DIAG: V3[] = [
  [-7.8, -4.6, -0.7], [-4.6, -2.6, 0.5], [-1.9, -0.95, 0.2], [0.8, 0.4, -0.6],
  [3.3, 1.6, -0.2], [5.5, 2.75, 0.5], [8.2, 3.9, -0.7],
];
const K_CLOSE: V3[] = [
  [-5.4, -1.7, 8.7], [-3.5, -0.95, 5.7], [-0.7, -0.55, 4.5], [2.4, -0.25, 5.0],
  [4.4, 0.65, 2.6], [3.0, 2.1, -2.5], [-2.0, 3.4, -7.5],
];
/** Close up on a tall screen: a filmstrip right in front of the camera. */
const K_CLOSE_TALL: V3[] = [
  [-5.5, -1.4, 2.5], [-2.6, -0.7, 4.6], [-0.9, -0.35, 5.3], [0.9, 0.0, 5.3],
  [2.6, 0.45, 4.5], [3.2, 2.2, 0], [0.5, 4.2, -6],
];
const K_AWAY: V3[] = [
  [-3.5, -0.8, -14], [-1.6, 0.4, -15], [0.2, 1.3, -16], [2.0, 2.2, -17],
  [3.6, 3.0, -18], [5.0, 3.8, -19], [6.4, 4.6, -20],
];
/** [progress, shape, twist] stops for the ribbon. */
const RIBBON_STOPS: [number, V3[], number][] = [
  [0, K_HERO, 0.28],
  [CH.hero[1], K_HERO, 0.28],
  [0.09, K_DIAG, 0.6],
  [CH.dive[1], K_CLOSE, 0.18],
  [CH.close[1], K_CLOSE, 0.18],
  [CH.exit[1], K_AWAY, 0.45],
];

const CARD_VS = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vView = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const CARD_FS = /* glsl */ `
  uniform sampler2D map;
  uniform float uHasMap;
  uniform float uAspect;
  uniform float uFade;
  uniform float uDim;
  uniform float uTime;
  uniform float uPhase;
  uniform float uGlow;
  uniform float uPaper;
  uniform vec3 uBg;
  varying vec2 vUv;
  varying float vDepth;
  varying vec3 vView;

  float box(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec2 uv = vUv;
    float back = gl_FrontFacing ? 0.0 : 1.0;
    if (back > 0.5) uv.x = 1.0 - uv.x;
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float d = box(p, vec2(uAspect * 0.5, 0.5), 0.03);
    float aa = fwidth(d);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.01) discard;

    vec3 col = uHasMap > 0.5 ? texture2D(map, uv).rgb : vec3(0.78, 0.78, 0.8);
    // Paper: light catches the bends, and a fine grain shows.
    vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
    float shade = clamp(0.62 + 0.55 * dot(n, normalize(vec3(-0.55, 0.6, 0.55))), 0.5, 1.25);
    float grain = hash(floor(vUv * vec2(uAspect * 520.0, 520.0)));
    col *= mix(1.0, shade * (0.97 + grain * 0.05), uPaper);
    // A soft light that passes over the windows now and then.
    float sweep = fract(uTime * 0.07 + uPhase) * 3.2 - 1.1;
    float band = 1.0 - smoothstep(0.0, 0.16, abs(uv.x * 0.8 + uv.y * 0.45 - sweep));
    col += vec3(1.0) * band * 0.04;
    // A hairline in the logo's blue when the window is in focus.
    float edge = 1.0 - smoothstep(0.0, 0.01, abs(d + 0.005));
    col = mix(col, vec3(0.018, 0.147, 1.0), edge * uGlow);
    // The back of a window is plain paper.
    col = mix(col, vec3(0.8, 0.8, 0.82), back * 0.75);
    // Depth fog, dimming and fading all go towards the background.
    float fog = smoothstep(14.0, 26.0, vDepth);
    col = mix(col, uBg, clamp(fog + uFade + uDim, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const TITLE_FS = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 uShift;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(map, vUv);
    float r = texture2D(map, vUv + uShift).a;
    float b = texture2D(map, vUv - uShift).a;
    float g1 = texture2D(map, vUv + uShift * 2.2).a * 0.22;
    float g2 = texture2D(map, vUv + uShift * 3.6).a * 0.09;
    // Linear values of the logo's cyan and blue.
    vec3 cyan = vec3(0.058, 0.578, 1.0);
    vec3 blue = vec3(0.018, 0.147, 1.0);
    float fr = max(r - c.a, 0.0);
    float fb = max(b - c.a, 0.0);
    float ghost = max(max(g1, g2) - c.a, 0.0);
    vec3 col = c.rgb * c.a + cyan * fr + blue * fb + vec3(0.25) * ghost;
    float a = clamp(c.a + fr + fb + ghost, 0.0, 1.0) * uOpacity;
    if (a < 0.02) discard;
    gl_FragColor = vec4(col / max(c.a + fr + fb + ghost, 0.001), a);
    #include <colorspace_fragment>
  }
`;

const BG_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;
// Display (sRGB) colours: no colour-space conversion here.
const BG_FS = /* glsl */ `
  uniform float uMood;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 p = vUv; p.x *= uAspect;
    vec2 c = vec2(0.5 * uAspect, 0.55);
    float r = length(p - c) / max(uAspect, 1.0);
    vec3 paper = vec3(0.910, 0.910, 0.918) + 0.018 * (1.0 - smoothstep(0.0, 0.8, r)) - 0.03 * smoothstep(0.45, 1.0, r);
    vec3 night = vec3(0.039, 0.051, 0.086);
    vec2 g = vec2(mix(0.5, 0.68, step(1.0, uAspect)) * uAspect, 0.5);
    night += vec3(0.14, 0.42, 1.0) * exp(-pow(length(p - g) / 0.6, 2.0)) * 0.14;
    night += vec3(0.27, 0.78, 1.0) * exp(-pow(length(p - vec2(0.1 * uAspect, 0.9)) / 0.5, 2.0)) * 0.05;
    vec3 col = mix(paper, night, uMood);
    col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) / 255.0 * 2.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Card {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  pos: Float32Array;
  a: Float32Array;
  b: Float32Array;
  /** Face normal per vertex of layout `a`. */
  n: Float32Array;
  win: number;
  /** Only shown in the globe and the ribbon (they need more windows than we have). */
  echo: boolean;
  focus: number;
  /** How much it bends like paper, and where the pointer is on it (uv). */
  paper: number;
  puv: THREE.Vector2;
  seed: [number, number, number, number, number, number];
}

interface Slot {
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  card: Card | null;
  ready: boolean;
}

const rand = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export class GalleryScene {
  private o: SceneOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private logoScene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  private cards: Card[] = [];
  private slot: Slot;
  private curve = new THREE.CatmullRomCurve3(K_HERO.map((v) => new THREE.Vector3(...v)), false, "centripetal");
  private title!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private titleCanvas = document.createElement("canvas");
  private titleTex: THREE.CanvasTexture;
  private bg: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private logo: THREE.Group;
  private pmrem: THREE.PMREMGenerator;
  private envTex: THREE.Texture;
  private segs: number;
  private rows: number;

  /** Stills: the 1280 ones for every window, 4K ones while a window matters. */
  private base = new Map<number, THREE.Texture>();
  private hi = new Map<number, { tex: THREE.Texture | null; used: number }>();
  private useHi: boolean;
  private bgColor = new THREE.Color();
  /** H.264 where the browser has it (Safari, Chrome); VP9 elsewhere. */
  private h264 = document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E"') !== "";

  private target = 0;
  private p = 0;
  private vel = 0;
  private t0 = performance.now();
  private last = performance.now();
  private raf = 0;
  private w = 1;
  private h = 1;
  private sx = 1;
  private cs = 1;
  private pointer = new THREE.Vector2(0, 0);
  private pointerSeen = false;
  private hover: Card | null = null;
  private hoverUv = new THREE.Vector2(0.5, 0.5);
  private playing: Card | null = null;
  private down: { x: number; y: number; t: number } | null = null;
  private spin = 0;
  private spinVel = 0;
  private dragging = false;
  private lastX = 0;
  private nextPick = 0;
  private frames: number[] = [];
  private failed = false;
  private disposed = false;
  private visible = true;
  private ray = new THREE.Raycaster();
  private onResizeBound = () => this.resize();

  constructor(o: SceneOptions) {
    this.o = o;
    const r = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    r.setClearColor(PAPER, 1);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.autoClear = false;
    this.renderer = r;
    this.segs = o.phone ? 12 : 22;
    this.rows = o.phone ? 6 : 10;
    this.useHi = !o.phone && Math.max(window.innerWidth, window.innerHeight) * (window.devicePixelRatio || 1) >= 1800;
    this.camera.position.set(0, 0, CAM_Z);

    this.bg = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: BG_VS,
        fragmentShader: BG_FS,
        depthWrite: false,
        depthTest: false,
        uniforms: { uMood: { value: 0 }, uAspect: { value: 1 }, uTime: { value: 0 } },
      }),
    );
    this.bg.frustumCulled = false;
    this.bg.renderOrder = -10;
    this.scene.add(this.bg);

    // The title lives in the scene, so the ribbon can pass in front of it
    // and behind it.
    this.titleTex = new THREE.CanvasTexture(this.titleCanvas);
    this.titleTex.colorSpace = THREE.SRGBColorSpace;
    this.titleTex.minFilter = THREE.LinearFilter;
    this.titleTex.generateMipmaps = false;
    this.title = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        vertexShader: CARD_VS,
        fragmentShader: TITLE_FS,
        transparent: true,
        uniforms: { map: { value: this.titleTex }, uShift: { value: new THREE.Vector2() }, uOpacity: { value: 1 } },
      }),
    );
    this.title.renderOrder = 2;
    this.scene.add(this.title);

    this.buildCards();

    // One video: the window that was clicked plays its clip.
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.slot = { video, texture, card: null, ready: false };
    video.addEventListener("playing", () => (this.slot.ready = true));

    // The logo, in 3D: its own scene, drawn last, lit by a soft room.
    this.pmrem = new THREE.PMREMGenerator(r);
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.logoScene.environment = this.envTex;
    this.logo = this.buildLogo();
    this.logoScene.add(this.logo);
    const rim = new THREE.DirectionalLight(MARK_CYAN, 1.4);
    rim.position.set(-3, 2, 2);
    this.logoScene.add(rim, new THREE.AmbientLight("#ffffff", 0.2));

    this.resize();
    this.setTitle(o.title);

    window.addEventListener("resize", this.onResizeBound);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    o.canvas.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointerup", this.onUp);
    o.canvas.addEventListener("webglcontextlost", this.onLost);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Scroll progress of the gallery section, 0 → 1. */
  setProgress(p: number) {
    this.target = clamp01(p);
  }

  setTitle(spec: TitleSpec) {
    this.o.title = spec;
    this.drawTitle();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResizeBound);
    window.removeEventListener("pointermove", this.onMove);
    this.o.canvas.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    this.o.canvas.removeEventListener("webglcontextlost", this.onLost);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.slot.video.pause();
    this.slot.video.removeAttribute("src");
    this.slot.video.load();
    this.slot.texture.dispose();
    for (const c of this.cards) {
      c.geo.dispose();
      c.mat.dispose();
    }
    this.base.forEach((t) => t.dispose());
    this.hi.forEach((h) => h.tex?.dispose());
    this.title.geometry.dispose();
    this.title.material.dispose();
    this.titleTex.dispose();
    this.bg.geometry.dispose();
    this.bg.material.dispose();
    this.logo.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.envTex.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }

  // ---------- building ----------

  private buildCards() {
    const loader = new THREE.TextureLoader();
    const n = this.o.windows.length;
    for (let w = 0; w < n; w++) {
      const tex = loader.load(this.o.windows[w].poster, () => this.showStill(w));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      this.base.set(w, tex);
    }

    const echoes = this.o.phone ? 12 : 22;
    const cols = this.segs + 1;
    const count = cols * (this.rows + 1);
    for (let i = 0; i < n + echoes; i++) {
      const echo = i >= n;
      const win = i % n;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const uv = new Float32Array(count * 2);
      const idx: number[] = [];
      for (let j = 0; j <= this.segs; j++) {
        for (let r = 0; r <= this.rows; r++) {
          const k = j * (this.rows + 1) + r;
          uv[k * 2] = j / this.segs;
          uv[k * 2 + 1] = r / this.rows;
          if (j < this.segs && r < this.rows) {
            const a = k;
            const b = k + this.rows + 1;
            idx.push(a, b, a + 1, a + 1, b, b + 1);
          }
        }
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      geo.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        vertexShader: CARD_VS,
        fragmentShader: CARD_FS,
        side: THREE.DoubleSide,
        alphaToCoverage: true,
        uniforms: {
          map: { value: null },
          uHasMap: { value: 0 },
          uAspect: { value: 1.6 },
          uFade: { value: 0 },
          uDim: { value: 0 },
          uTime: { value: 0 },
          uPhase: { value: rand(i, 9) },
          uGlow: { value: 0 },
          uPaper: { value: 0 },
          uBg: { value: PAPER.clone() },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.userData.card = i;
      this.scene.add(mesh);
      this.cards.push({
        mesh, geo, mat, pos,
        a: new Float32Array(count * 3),
        b: new Float32Array(count * 3),
        n: new Float32Array(count * 3),
        win, echo, focus: 0, paper: 0, puv: new THREE.Vector2(0.5, 0.5),
        seed: [rand(i, 1), rand(i, 2), rand(i, 3), rand(i, 4), rand(i, 5), rand(i, 6)],
      });
    }
  }

  /** Puts the best still we have on every window of `win` (unless it plays). */
  private showStill(win: number) {
    const hi = this.hi.get(win)?.tex;
    const tex = hi ?? this.base.get(win);
    if (!tex?.image) return;
    for (const c of this.cards) {
      if (c.win !== win || (this.slot.card === c && this.slot.ready)) continue;
      c.mat.uniforms.map.value = tex;
      c.mat.uniforms.uHasMap.value = 1;
    }
  }

  /** The 4K still of a window, loaded once it matters; at most a few kept. */
  private wantHi(win: number, now: number) {
    if (!this.useHi) return;
    const have = this.hi.get(win);
    if (have) {
      have.used = now;
      return;
    }
    const entry = { tex: null as THREE.Texture | null, used: now };
    this.hi.set(win, entry);
    new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }).load(this.o.windows[win].poster4k, (bmp) => {
      if (this.disposed || this.hi.get(win) !== entry) return bmp.close();
      const t = new THREE.Texture(bmp);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.flipY = false;
      t.needsUpdate = true;
      entry.tex = t;
      this.showStill(win);
    });
    // Keep the memory in check: drop the least recently wanted.
    if (this.hi.size > 5) {
      let oldest: number | null = null;
      for (const [k, v] of this.hi) if (k !== win && (oldest === null || v.used < this.hi.get(oldest)!.used)) oldest = k;
      if (oldest !== null) {
        const old = this.hi.get(oldest)!;
        this.hi.delete(oldest);
        this.showStill(oldest);
        old.tex?.dispose();
      }
    }
  }

  private buildLogo() {
    const group = new THREE.Group();
    const shapes = MARK_POLYGONS.map((poly) => {
      const s = new THREE.Shape();
      tracePolygon(s, poly);
      return s;
    });
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 4, curveSegments: 6,
    });
    geo.center();
    // Blue → cyan across the mark.
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const a = new THREE.Color(MARK_BLUE);
    const b = new THREE.Color(MARK_CYAN);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = clamp01(((pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x)) * 0.7 + ((pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)) * 0.3);
      c.copy(a).lerp(b, t);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.65,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      iridescence: 0.55,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.0,
    });
    group.add(new THREE.Mesh(geo, mat));
    return group;
  }

  // ---------- title ----------

  private drawTitle() {
    const { lines, small, lang, sans, serif } = this.o.title;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(this.w * dpr);
    const H = Math.round(this.h * dpr);
    const cv = this.titleCanvas;
    cv.width = W;
    cv.height = H;
    cv.setAttribute("lang", lang);
    const ctx = cv.getContext("2d")! as CanvasRenderingContext2D & { lang?: string; letterSpacing?: string };
    ctx.lang = lang;
    ctx.clearRect(0, 0, W, H);
    const portrait = this.w / this.h < 0.9;

    // As in the reference: each line pairs a word in the sans with one in
    // the serif. On a phone every part gets its own row.
    const rows: TitleLine[] = portrait ? lines.flatMap((l) => l.map((part) => [part])) : lines;
    const setFont = (part: { serif: boolean }, px: number) => {
      ctx.font = part.serif ? serif(px * 1.2) : sans(px);
      ctx.letterSpacing = part.serif ? `${(-0.02 * px).toFixed(1)}px` : `${(-0.045 * px).toFixed(1)}px`;
    };
    const widthOf = (row: TitleLine, px: number) =>
      row.reduce((sum, part, i) => {
        setFont(part, px);
        return sum + ctx.measureText(part.text).width + (i ? px * 0.24 : 0);
      }, 0);
    const widest = Math.max(...rows.map((r) => widthOf(r, 100)));
    // Two staggered lines, as in the reference: the first to the left, the
    // second to the right, the small line between them.
    const maxW = W * (portrait ? 0.86 : 0.62);
    const fs = Math.min((100 * maxW) / widest, H * (portrait ? 0.105 : 0.16));
    const lh = fs * (portrait ? 1.08 : 1.4);
    const block = lh * (rows.length - 1);
    const top = H * (portrait ? 0.38 : 0.47) - block / 2;
    const margin = W * (portrait ? 0.07 : 0.1);
    ctx.textBaseline = "alphabetic";
    // The grey copy under the letters first (the reference's soft depth),
    // then the ink.
    for (const pass of [0, 1]) {
      rows.forEach((row, i) => {
        const y = top + i * lh;
        let x = i % 2 === 0 ? margin : W - margin - widthOf(row, fs);
        row.forEach((part, k) => {
          if (k) x += fs * 0.24;
          setFont(part, fs);
          ctx.fillStyle = pass ? "#111113" : "rgba(17,17,19,0.16)";
          ctx.fillText(part.text, x + (pass ? 0 : fs * 0.03), y + (pass ? 0 : fs * 0.045));
          x += ctx.measureText(part.text).width;
        });
      });
    }

    // The small line, between the big ones (under them on a phone).
    const sfs = Math.max(12 * dpr, Math.min(fs * 0.14, 16 * dpr));
    ctx.font = `400 ${sfs}px "Manrope Variable", Manrope, sans-serif`;
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "rgba(17,17,19,0.62)";
    const boxW = portrait ? W * 0.8 : Math.min(W * 0.24, sfs * 22);
    const words = small.split(" ");
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width > boxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) out.push(cur);
    const slh = sfs * 1.5;
    const sy = portrait ? top + block + fs * 0.9 : top + lh * 0.42 - ((out.length - 1) * slh) / 2;
    ctx.textAlign = portrait ? "left" : "center";
    out.forEach((l, i) => ctx.fillText(l, portrait ? margin : W * 0.5, sy + i * slh));
    ctx.textAlign = "left";
    this.titleTex.needsUpdate = true;
  }

  // ---------- events ----------

  private onMove = (e: PointerEvent) => {
    this.pointer.set((e.clientX / this.w) * 2 - 1, -(e.clientY / this.h) * 2 + 1);
    this.pointerSeen = e.pointerType === "mouse";
    // Dragging the globe turns it; it keeps turning a little after.
    if (this.dragging) {
      this.spinVel = (e.clientX - this.lastX) * 0.006;
      this.spin += this.spinVel;
    }
    this.lastX = e.clientX;
  };

  private onDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
    this.lastX = e.clientX;
    if (within(this.p, CH.about, 0) > 0.5) this.dragging = true;
  };

  private onUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    this.dragging = false;
    if (!d || e.target !== this.o.canvas) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 500) return;
    this.pointer.set((e.clientX / this.w) * 2 - 1, -(e.clientY / this.h) * 2 + 1);
    const hit = this.pick();
    if (!hit) return;
    // The first click plays the site inside the window, the second opens it.
    if (this.playing === hit) this.o.onOpen(hit.win);
    else {
      this.playing = hit;
      this.nextPick = 0;
      this.o.onFocus(hit.win);
    }
  };

  private onLost = (e: Event) => {
    e.preventDefault();
    this.fail();
  };

  private onVisibility = () => {
    this.visible = document.visibilityState === "visible";
    if (!this.visible) this.slot.video.pause();
    else if (this.slot.card) void this.slot.video.play().catch(() => {});
  };

  private fail() {
    if (this.failed) return;
    this.failed = true;
    this.o.onFail();
  }

  private interactive() {
    return this.p > CH.dive[1] - 0.02 && this.p < CH.wall[1];
  }

  private pick(): Card | null {
    if (!this.interactive()) return null;
    this.ray.setFromCamera(this.pointer, this.camera);
    const ribbon = this.p < CH.exit[1];
    const meshes = this.cards.filter((c) => (ribbon || !c.echo) && c.mesh.visible).map((c) => c.mesh);
    const hit = this.ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    if (hit.uv) this.hoverUv.copy(hit.uv);
    return this.cards[hit.object.userData.card as number];
  }

  // ---------- layout ----------

  private resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const aspect = this.w / this.h;
    const phone = this.o.phone;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.sx = Math.max(0.42, Math.min(1, aspect / 1.6));
    this.cs = aspect < 0.9 ? 0.62 : aspect < 1.3 ? 0.8 : 1;
    const vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    this.title.scale.set(vh * aspect, vh, 1);
    this.bg.material.uniforms.uAspect.value = aspect;
    if (this.o.title) this.drawTitle();
  }

  /** Visible size of the plane z = 0. */
  private view() {
    const vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return { vw: vh * this.camera.aspect, vh };
  }

  private setCurve(p: number) {
    let i = 0;
    while (i < RIBBON_STOPS.length - 2 && p > RIBBON_STOPS[i + 1][0]) i++;
    const [p0, a, t0] = RIBBON_STOPS[i];
    const [p1, b, t1] = RIBBON_STOPS[i + 1];
    const k = easeInOut(clamp01((p - p0) / Math.max(1e-6, p1 - p0)));
    const pts = this.curve.points;
    // On a tall screen the close-up has its own shape, already narrow.
    const tall = this.sx < 0.6;
    const at = (key: V3[], j: number): V3 =>
      tall && key === K_CLOSE ? K_CLOSE_TALL[j] : [key[j][0] * this.sx, key[j][1] * (tall ? 1.15 : 1), key[j][2]];
    for (let j = 0; j < pts.length; j++) {
      const A = at(a, j);
      const B = at(b, j);
      pts[j].set(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
    }
    this.curve.updateArcLengths();
    return t0 + (t1 - t0) * k;
  }

  /** Vertices (and normals) of a card bent along the ribbon, from arc length s. */
  private ribbonVerts(out: Float32Array, nrm: Float32Array, s: number, w: number, h: number, L: number, twist: number, wob: number) {
    const P = new THREE.Vector3();
    const T = new THREE.Vector3();
    const N = new THREE.Vector3();
    const F = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const R = this.rows;
    for (let j = 0; j <= this.segs; j++) {
      const u = clamp01((s + (j / this.segs) * w) / L);
      this.curve.getPointAt(u, P);
      this.curve.getTangentAt(u, T);
      N.copy(up).addScaledVector(T, -T.dot(up)).normalize();
      N.applyAxisAngle(T, twist * Math.sin(u * Math.PI * 2.2 + 0.6) + wob);
      F.crossVectors(T, N).normalize();
      for (let r = 0; r <= R; r++) {
        const k = (j * (R + 1) + r) * 3;
        const o = (r / R - 0.5) * h;
        out[k] = P.x + N.x * o;
        out[k + 1] = P.y + N.y * o;
        out[k + 2] = P.z + N.z * o;
        nrm[k] = F.x;
        nrm[k + 1] = F.y;
        nrm[k + 2] = F.z;
      }
    }
  }

  private flatVerts(out: Float32Array, nrm: Float32Array | null, c: THREE.Vector3, q: THREE.Quaternion, w: number, h: number) {
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const u = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const R = this.rows;
    for (let j = 0; j <= this.segs; j++) {
      const x = (j / this.segs - 0.5) * w;
      for (let rr = 0; rr <= R; rr++) {
        const k = (j * (R + 1) + rr) * 3;
        const y = (rr / R - 0.5) * h;
        out[k] = c.x + r.x * x + u.x * y;
        out[k + 1] = c.y + r.y * x + u.y * y;
        out[k + 2] = c.z + r.z * x + u.z * y;
        if (nrm) {
          nrm[k] = f.x;
          nrm[k + 1] = f.y;
          nrm[k + 2] = f.z;
        }
      }
    }
  }

  /** Paper: the sheet lifts under the pointer, its far corners curl a little
      and a slow wave runs through it. */
  private bendPaper(card: Card, w: number, h: number, time: number) {
    const k = card.paper;
    if (k < 0.002) return;
    const R = this.rows;
    const { x: pu, y: pv } = card.puv;
    const asp = w / h;
    for (let j = 0; j <= this.segs; j++) {
      const u = j / this.segs;
      for (let r = 0; r <= R; r++) {
        const v = r / R;
        const du = (u - pu) * asp;
        const dv = v - pv;
        const lift = Math.exp(-(du * du + dv * dv) / 0.16) * 0.3;
        const cu = Math.max(0, Math.abs(u - 0.5) * 2 - 0.35) / 0.65;
        const cv = Math.max(0, Math.abs(v - 0.5) * 2 - 0.35) / 0.65;
        const curl = (cu * cu * cu + cv * cv * cv * 0.6) * 0.22;
        const wave = Math.sin(u * 7 - time * 2.6 + v * 2) * 0.025 * (1 - lift * 2.5);
        const d = (lift + curl + wave) * h * k;
        const i = (j * (R + 1) + r) * 3;
        card.a[i] += card.n[i] * d;
        card.a[i + 1] += card.n[i + 1] * d;
        card.a[i + 2] += card.n[i + 2] * d;
      }
    }
  }

  /** Grid of the wall: index → centre and size. */
  private wallSlot(i: number) {
    const n = this.o.windows.length;
    const { vw, vh } = this.view();
    const aspect = this.camera.aspect;
    const cols = aspect < 0.9 ? 3 : aspect < 1.3 ? 4 : Math.min(6, Math.ceil(Math.sqrt(n * 1.6)));
    const rows = Math.ceil(n / cols);
    const areaW = aspect < 0.9 ? vw * 0.9 : vw * 0.7;
    const areaH = vh * (aspect < 0.9 ? 0.52 : 0.66);
    const gap = 0.1 * this.cs;
    let cw = (areaW - gap * (cols - 1)) / cols;
    let ch = cw / 1.6;
    if (ch * rows + gap * (rows - 1) > areaH) {
      ch = (areaH - gap * (rows - 1)) / rows;
      cw = ch * 1.6;
    }
    const gw = cols * cw + (cols - 1) * gap;
    const gh = rows * ch + (rows - 1) * gap;
    const cx = aspect < 0.9 ? 0 : vw * 0.5 - gw / 2 - vw * 0.05;
    const cy = aspect < 0.9 ? -vh * 0.2 : -vh * 0.08;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      c: new THREE.Vector3(cx - gw / 2 + cw / 2 + col * (cw + gap), cy + gh / 2 - ch / 2 - row * (ch + gap), 0),
      w: cw,
      h: ch,
    };
  }

  // ---------- frame ----------

  private frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.visible) return;

    // The first seconds tell whether this device keeps up.
    if (this.frames.length < 120 && now - this.t0 > 1200) {
      this.frames.push(dt);
      if (this.frames.length === 120) {
        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        if (avg > 0.05) this.fail();
      }
    }

    const time = (now - this.t0) / 1000;
    const prev = this.p;
    this.p += (this.target - this.p) * (1 - Math.exp(-dt * 7));
    if (Math.abs(this.target - this.p) < 1e-5) this.p = this.target;
    const p = this.p;
    this.vel += ((p - prev) / Math.max(dt, 1e-3) - this.vel) * 0.2;
    this.o.onFrame(p);

    // A little parallax from the pointer.
    const px = this.pointerSeen ? this.pointer.x : 0;
    const py = this.pointerSeen ? this.pointer.y : 0;
    this.camera.position.x += (px * 0.25 - this.camera.position.x) * 0.05;
    this.camera.position.y += (py * 0.15 - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    const mood = moodAt(p);
    const bgu = this.bg.material.uniforms;
    bgu.uTime.value = time;
    bgu.uMood.value = mood;
    this.bgColor.copy(PAPER).lerp(NIGHT, mood);

    this.updateTitle(p, time);

    // Under the pointer (the ribbon close up and the wall).
    let hover: Card | null = null;
    if (this.pointerSeen && this.interactive() && !this.dragging) hover = this.pick();
    if (hover !== this.hover) {
      this.hover = hover;
      this.o.canvas.style.cursor = hover ? "pointer" : "";
      // On the wall: the window under the pointer, else the one playing,
      // else nothing (the invitation shows).
      if (within(p, CH.wall, 0.01) > 0.5) this.o.onFocus(hover?.win ?? this.playing?.win ?? null);
    }
    if (hover) hover.puv.lerp(this.hoverUv, 0.25);
    if (this.playing && !this.interactive()) this.playing = null;

    this.layoutCards(p, time, dt);
    this.updateMedia(p, now);
    this.updateLogo(p, time);

    for (const c of this.cards) c.mat.uniforms.uTime.value = time;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.logoScene, this.camera);
  };

  private updateTitle(p: number, time: number) {
    const u = this.title.material.uniforms;
    const { vw } = this.view();
    const intro = easeOut(clamp01((time - 0.15) / 1.4));
    const out1 = seg(p, [CH.hero[1] - 0.01, 0.11]);
    const back = seg(p, [CH.exit[0], 0.305]);
    const out2 = seg(p, [0.305, CH.exit[1]]);
    let x = 0;
    let op = intro;
    if (p < CH.close[0]) {
      x = -easeInOut(out1) * vw * 0.3;
      op = intro * (1 - smooth(out1));
    } else if (p < CH.exit[0]) op = 0;
    else {
      x = (1 - easeOut(back)) * vw * 0.25 - easeInOut(out2) * vw * 0.12;
      op = smooth(back) * (1 - smooth(out2));
    }
    this.title.position.x = x;
    this.title.visible = op > 0.001;
    u.uOpacity.value = op;
    const v = Math.abs(this.vel) < 0.01 ? 0 : -this.vel * 0.1;
    const blur = Math.max(-0.012, Math.min(0.012, v)) + (1 - intro) * 0.012 + (back > 0 && back < 1 ? (1 - back) * 0.012 : 0) + out2 * 0.012;
    u.uShift.value.set(blur, 0);
  }

  private layoutCards(p: number, time: number, dt: number) {
    const n = this.o.windows.length;
    const cs = this.cs;
    const w = 1.6 * cs;
    const h = 1.0 * cs;
    const pitch = w + 0.1 * cs;
    const ribbon = p < CH.exit[1];
    let L = 0;
    let twist = 0;
    if (ribbon) {
      twist = this.setCurve(p);
      L = this.curve.getLength();
    }
    // Every card rides the ribbon (the globe's extra ones too), so the strip
    // has no gaps.
    const total = Math.max(this.cards.length * pitch, L + pitch);
    const intro = 1 - easeOut(clamp01((time - 0.3) / 2.4));
    const sBase = time * 0.22 + p * 55;
    const ribbonFade = smooth(seg(p, [0.295, CH.exit[1]]));

    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    // Globe.
    const aspect = this.camera.aspect;
    const portrait = aspect < 0.9;
    const globeIn = smooth(seg(p, [CH.glitch[0], CH.glitch[1] + 0.02]));
    const globeAway = easeInOut(seg(p, [CH.logo[0], CH.cta[0] + 0.04]));
    this.spinVel *= Math.pow(0.04, dt);
    if (!this.dragging) this.spin += this.spinVel;
    const gAngle = time * 0.12 + this.spin;
    const gCenter = portrait ? new THREE.Vector3(0, 0.9, -2.5) : new THREE.Vector3(2.3, 0, -1.2);
    gCenter.z -= globeAway * 7;
    gCenter.y += globeAway * (portrait ? 0 : 0.6);
    const R = portrait ? 1.9 : 2.25;
    const gq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.28, gAngle, 0.05));
    const all = this.cards.length;
    const onWall = within(p, CH.wall, 0) > 0;

    for (let i = 0; i < all; i++) {
      const card = this.cards[i];
      const u = card.mat.uniforms;
      const [r1, r2, r3, r4, r5, r6] = card.seed;
      let fade = 0;
      let dim = 0;
      let show = true;
      let cw = w;
      let ch = h;
      const active = this.interactive() && (this.hover === card || this.playing === card);
      card.focus += ((active ? 1 : 0) - card.focus) * Math.min(1, dt * 8);
      card.paper += ((this.interactive() && this.hover === card ? 1 : 0) - card.paper) * Math.min(1, dt * 5);

      if (ribbon) {
        let s = ((((sBase + i * pitch) % total) + total) % total) - pitch * 0.5;
        s -= intro * total;
        if (s < 0 || s + w > L) show = false;
        else {
          const wob = Math.sin(time * 0.7 + i * 1.7) * 0.05;
          this.ribbonVerts(card.a, card.n, s, w, h, L, twist, wob);
          // Ends of the ribbon melt into the background.
          const edge = Math.min(s, L - s - w);
          fade = Math.max(ribbonFade, 1 - smooth(clamp01(edge / 1.6)));
          // The window under the pointer (or playing) turns to face you.
          if (card.focus > 0.001) {
            const m = (Math.floor(this.segs / 2) * (this.rows + 1) + Math.floor(this.rows / 2)) * 3;
            c.set(card.a[m], card.a[m + 1], card.a[m + 2]);
            camDir.copy(this.camera.position).sub(c).normalize();
            q.setFromRotationMatrix(new THREE.Matrix4().lookAt(camDir, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)));
            c.addScaledVector(camDir, 0.3);
            this.flatVerts(card.b, null, c, q, w * 1.06, h * 1.06);
            lerpInto(card.a, card.b, card.focus * 0.7);
          }
        }
      } else if (!card.echo && p < CH.glitch[1] + 0.02) {
        // Drop → wall.
        const slot = this.wallSlot(i);
        const fallAt = CH.drop[0] + (i / n) * 0.045;
        const fall = easeOut(seg(p, [fallAt, fallAt + 0.03]));
        const snap = easeInOut(seg(p, [0.395 + (i / n) * 0.01, CH.drop[1]]));
        const { vw, vh } = this.view();
        const rest = new THREE.Vector3((r1 - 0.5) * vw * 0.8, (r2 - 0.5) * vh * 0.7, (r3 - 0.5) * 2.5);
        const ang = r4 * Math.PI * 2;
        const from = rest.clone().add(new THREE.Vector3(Math.cos(ang) * vw * 0.7, Math.abs(Math.sin(ang)) * vh * 0.9 + vh * 0.3, 2));
        c.copy(from).lerp(rest, fall).lerp(slot.c, snap);
        const restScale = 0.55 + r5 * 0.5;
        cw = THREE.MathUtils.lerp(slot.w * restScale, slot.w, snap);
        ch = THREE.MathUtils.lerp(slot.h * restScale, slot.h, snap);
        // On the wall the windows sway a little and lean towards the pointer.
        const sway = snap * (1 - globeIn);
        let rx = (r6 - 0.5) * 1.2 * (1 - fall) + Math.sin(time * 0.6 + i) * 0.04 * sway;
        let ry = (r1 - 0.5) * 1.4 * (1 - fall) + Math.cos(time * 0.5 + i * 1.3) * 0.06 * sway;
        const rz = (r2 - 0.5) * (1 - fall) * 0.9 + (r3 - 0.5) * 0.2 * (1 - snap);
        if (card.focus > 0.001) {
          rx += -this.pointer.y * 0.18 * card.focus;
          ry += this.pointer.x * 0.18 * card.focus;
          c.z += 0.35 * card.focus;
        }
        q.setFromEuler(e.set(rx, ry, rz));
        const grow = 1 + card.focus * 0.06;
        cw *= grow;
        ch *= grow;
        this.flatVerts(card.a, card.n, c, q, cw, ch);
        fade = 1 - fall;
        show = fall > 0;
        const other = (this.hover ?? this.playing) !== null && !active;
        dim = onWall && other ? 0.18 : 0;
        if (globeIn > 0) {
          this.globeVerts(card.b, i, all, gq, gCenter, R, w * 0.42);
          lerpInto(card.a, card.b, globeIn);
        }
      } else {
        // The globe (the extra windows join it here).
        this.globeVerts(card.a, i, all, gq, gCenter, R, w * 0.42);
        const z = (card.a[2] + card.a[card.a.length - 1]) / 2 - gCenter.z;
        dim = clamp01((-z / R) * 0.55 + 0.2);
        fade = card.echo ? 1 - globeIn : 0;
        fade = Math.max(fade, globeAway * 0.6);
        show = globeIn > 0;
      }

      if (show) {
        this.bendPaper(card, cw, ch, time);
        card.pos.set(card.a);
      }
      card.mesh.visible = show && fade < 0.995;
      u.uFade.value = fade;
      u.uDim.value += (dim - u.uDim.value) * 0.15;
      u.uGlow.value = card.focus;
      u.uPaper.value = card.paper;
      (u.uBg.value as THREE.Color).copy(this.bgColor);
      if (card.mesh.visible) {
        (card.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        card.geo.computeBoundingSphere();
      }
    }
  }

  private globeVerts(out: Float32Array, i: number, n: number, gq: THREE.Quaternion, center: THREE.Vector3, R: number, w: number) {
    // Fibonacci sphere: an even spread of n points.
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    const nrm = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).applyQuaternion(gq);
    const c = center.clone().addScaledVector(nrm, R);
    const q = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(nrm, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)),
    );
    this.flatVerts(out, null, c, q, w, w / 1.6);
  }

  // ---------- stills and the clip ----------

  private updateMedia(p: number, now: number) {
    if (now < this.nextPick) return;
    this.nextPick = now + 200;

    // 4K stills for the windows that are large on screen or in focus.
    if (this.useHi) {
      if (p < CH.exit[0] && p > CH.dive[0]) {
        const v = new THREE.Vector3();
        const m = (Math.floor(this.segs / 2) * (this.rows + 1) + Math.floor(this.rows / 2)) * 3;
        this.cards
          .filter((c) => c.mesh.visible && c.mat.uniforms.uFade.value < 0.4)
          .map((c) => {
            v.set(c.pos[m], c.pos[m + 1], c.pos[m + 2]);
            const d = v.distanceTo(this.camera.position);
            v.project(this.camera);
            return { c, score: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1 ? 1 / d : -1 };
          })
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .forEach((s) => this.wantHi(s.c.win, now));
      }
      if (this.hover) this.wantHi(this.hover.win, now);
      if (this.playing) this.wantHi(this.playing.win, now);
    }

    // The clip of the window that was clicked.
    const s = this.slot;
    const want = this.playing;
    if (s.card && s.card !== want) {
      const old = s.card;
      s.video.pause();
      s.card = null;
      s.ready = false;
      this.showStill(old.win);
    }
    if (want && s.card !== want) {
      s.card = want;
      s.ready = false;
      const win = this.o.windows[want.win];
      s.video.src = this.h264 ? win.mp4 : win.webm;
      s.video.currentTime = 0;
      void s.video.play().catch(() => {});
    }
    if (s.card && s.ready && s.card.mat.uniforms.map.value !== s.texture) {
      s.card.mat.uniforms.map.value = s.texture;
      s.card.mat.uniforms.uHasMap.value = 1;
    }
  }

  // ---------- logo ----------

  private updateLogo(p: number, time: number) {
    const slot = this.o.logoSlot();
    // The logo floats 4 units in front of the camera.
    const d = 4;
    const vh = 2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const upp = vh / this.h;
    let rx = 0;
    let ry = 0;
    let rs = 0.3;
    if (slot && slot.width > 0) {
      rx = (slot.left + slot.width / 2 - this.w / 2) * upp;
      ry = -(slot.top + slot.height / 2 - this.h / 2) * upp;
      rs = slot.height * upp;
    }
    const s = seg(p, CH.logo);
    const bump = smooth(clamp01(s / 0.3)) * (1 - smooth(clamp01((s - 0.7) / 0.3)));
    const big = Math.min(vh * 0.42, (vh * this.camera.aspect * 0.6) / 1.35);
    const x = THREE.MathUtils.lerp(rx, 0, bump);
    const y = THREE.MathUtils.lerp(ry, 0, bump);
    const scale = THREE.MathUtils.lerp(rs, big, bump);
    // Held in front of the camera, so it stays on its slot however the
    // camera moves.
    this.logo.position.set(x, y, -d);
    this.camera.localToWorld(this.logo.position);
    this.logo.scale.setScalar(scale);
    const appear = easeOut(clamp01((time - 0.2) / 1.2));
    this.logo.visible = appear > 0.01;
    const spin = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        Math.sin(time * 0.9) * 0.12 * (1 - bump) + bump * 0.15,
        // A full turn on the way in and one on the way back: at the centre
        // it faces you.
        (easeInOut(clamp01(s / 0.4)) + easeInOut(clamp01((s - 0.6) / 0.4))) * Math.PI * 2 +
          Math.sin(time * 0.7) * 0.35 * (1 - bump),
        0,
      ),
    );
    this.logo.quaternion.copy(this.camera.quaternion).multiply(spin);
    this.logo.scale.multiplyScalar(appear);
  }
}

function lerpInto(a: Float32Array, b: Float32Array, k: number) {
  for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * k;
}
