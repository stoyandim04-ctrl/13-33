import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildMovement, materials, POS } from "./movement";
import { SHOTS, type Shot } from "./shots";

/*
  Едно платно за целия сайт. Скролът (0 → 1) избира място по пътя на камерата;
  пътят е списък от кадри (`shots.ts`), между тях — Catmull-Rom по позиция и
  по точка на поглед, а обективът, мъглата, светлината и забавянето на времето
  се смесват плавно. Финалът (13:33) нагласява само стрелките.
*/

const GRADE = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVig: { value: 1.1 },
    uAb: { value: 0.0015 },
    uFlash: { value: 0 },
    uLift: { value: new THREE.Vector3(0.0, 0.004, 0.012) },
    uGain: { value: new THREE.Vector3(1.05, 0.97, 0.88) },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uVig, uAb, uFlash;
    uniform vec3 uLift, uGain;
    uniform vec2 uRes;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float d = length(c);
      vec3 col = clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0);
      // Тийл в сенките, кехлибар в светлото.
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col + uLift * (1.0 - l), col * uGain, smoothstep(0.0, 0.8, l));
      // Плътност: по-дълбоки сенки, наситени цветове.
      col = max(col - 0.012, 0.0) * 1.03;
      col = col * col * (3.0 - 2.0 * col) * 0.35 + col * 0.65;
      l = dot(col, vec3(0.299, 0.587, 0.114));
      col = clamp(mix(vec3(l), col, 1.22), 0.0, 1.0);
      // Винетка.
      col *= smoothstep(1.05, 0.15, d * uVig);
      // Бяла светкавица при минаване през стъкло/циферблат.
      col = mix(col, vec3(1.0, 0.96, 0.9), uFlash);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Frame = { time: number; display: number; ticked: boolean; tick: number; rate: number; inside: number };

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.004, 2000);
  composer!: EffectComposer;
  grade!: ShaderPass;
  bloom!: UnrealBloomPass;
  movement!: ReturnType<typeof buildMovement>;
  watch = new THREE.Group();
  lite: boolean;
  progress = 0;
  private posCurve!: THREE.CatmullRomCurve3;
  private tgtCurve!: THREE.CatmullRomCurve3;
  private t0: number;
  private fog = new THREE.FogExp2(0x030405, 0.002);
  private probe = new THREE.PointLight(0xffd9a8, 0, 18, 1.6);
  private key = new THREE.SpotLight(0xffc98a, 260, 0, 0.42, 0.75, 1.2);
  private rim = new THREE.SpotLight(0x4fb2c8, 160, 0, 0.5, 0.8, 1.2);
  private setOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.lite = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lite, powerPreference: "high-performance" });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const now = new Date();
    this.t0 = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  }

  async init() {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('300 40px "Cormorant Garamond"'),
      document.fonts.load('400 20px "Geist Mono Variable"'),
    ]).catch(() => {});

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.32;
    this.scene.background = new THREE.Color(0x030405);
    this.scene.fog = this.fog;

    const mats = materials(this.lite);
    this.movement = buildMovement(mats);
    this.watch.add(this.movement.root);
    this.scene.add(this.watch);

    // Светлина: топъл ключ отгоре вляво, студен контражур отзад, „сонда“ до камерата вътре.
    this.key.position.set(-60, 90, -40);
    this.key.target.position.set(0, 0, 0);
    this.rim.position.set(70, 30, 80);
    this.rim.target.position.set(0, 0, 0);
    this.scene.add(this.key, this.key.target, this.rim, this.rim.target, this.probe);
    const inner = new THREE.PointLight(0xffb070, 7, 30, 1.6);
    inner.position.set(-6, 10, 9);
    this.watch.add(inner);
    const innerCool = new THREE.PointLight(0x58b8d8, 5, 26, 1.6);
    innerCool.position.set(10, -10, 8);
    this.watch.add(innerCool);
    const dialLight = new THREE.PointLight(0xffe2b8, 0, 40, 1.2);
    dialLight.position.set(-8, 12, -14);
    this.watch.add(dialLight);
    this.dialLight = dialLight;

    this.buildPath();

    const rp = new RenderPass(this.scene, this.camera);
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: this.lite ? 2 : 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(rp);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.16, 0.35, 0.95);
    this.composer.addPass(this.bloom);
    // Градацията е след тонмапинга — работи върху крайните цветове (0–1).
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GRADE);
    this.composer.addPass(this.grade);

    this.resize();
    // Шейдърите се компилират предварително — първото скролване не засича.
    this.renderer.compile(this.scene, this.camera);
  }

  private dialLight!: THREE.PointLight;

  private buildPath() {
    this.posCurve = new THREE.CatmullRomCurve3(SHOTS.map((s) => s.pos.clone()), false, "centripetal");
    this.tgtCurve = new THREE.CatmullRomCurve3(SHOTS.map((s) => s.look.clone()), false, "centripetal");
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, this.lite ? 1.5 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.grade.uniforms.uRes.value.set(w * dpr, h * dpr);
  }

  /** Къде сме между кадрите: индекс и локален напредък с „задържане“ на всеки кадър. */
  private locate(p: number) {
    let i = 0;
    while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++;
    const a = SHOTS[i];
    const b = SHOTS[i + 1];
    const t = clamp((p - a.at) / Math.max(1e-6, b.at - a.at));
    const e = smooth(t);
    // Параметърът по кривата — равномерно по кадри.
    const u = (i + e) / (SHOTS.length - 1);
    return { a, b, e, u };
  }

  private mix<K extends keyof Shot>(a: Shot, b: Shot, e: number, k: K, def: number) {
    const va = (a[k] as number | undefined) ?? def;
    const vb = (b[k] as number | undefined) ?? def;
    return lerp(va, vb, e);
  }

  private last = performance.now();
  private elapsed = 0;

  render(now: number): Frame {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.elapsed += dt;
    const p = this.progress;
    const { a, b, e, u } = this.locate(p);

    // Камерата — в координатите на часовника (той леко се люлее на верижката).
    const swing = Math.sin(this.elapsed * 0.35) * 0.012 * (1 - this.mix(a, b, e, "inside", 0));
    this.watch.rotation.set(0, Math.sin(this.elapsed * 0.21) * 0.03 * (1 - this.mix(a, b, e, "inside", 0)), swing);
    this.watch.updateMatrixWorld();
    const pos = this.posCurve.getPoint(u);
    const look = this.tgtCurve.getPoint(u);
    // Портрет: във финала часовникът се качва над текста.
    if (this.camera.aspect < 1) {
      const lift = 42 * smooth(this.mix(a, b, e, "set", 0)) * (1 - this.camera.aspect);
      pos.y -= lift;
      look.y -= lift;
    }
    // Лек „ръчен“ трус — по-силен отвън.
    const hand = 0.06 * this.mix(a, b, e, "shake", 1);
    pos.x += Math.sin(this.elapsed * 0.7) * hand;
    pos.y += Math.sin(this.elapsed * 0.53 + 1) * hand;
    this.camera.position.copy(pos).applyMatrix4(this.watch.matrixWorld);
    const up = new THREE.Vector3(0, 1, 0);
    const roll = this.mix(a, b, e, "roll", 0);
    up.applyAxisAngle(new THREE.Vector3().subVectors(look, pos).normalize(), roll);
    this.camera.up.copy(up.transformDirection(this.watch.matrixWorld));
    this.camera.lookAt(look.applyMatrix4(this.watch.matrixWorld));
    let fov = this.mix(a, b, e, "fov", 30);
    // Портрет: пазим хоризонталния кадър на 16:9 — часовникът не излиза от екрана.
    if (this.camera.aspect < 16 / 9) {
      const h = Math.tan((fov * Math.PI) / 360) * (16 / 9) / this.camera.aspect;
      fov = Math.min(105, (Math.atan(h) * 360) / Math.PI);
    }
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // Атмосфера.
    const inside = this.mix(a, b, e, "inside", 0);
    this.fog.density = lerp(0.002, 0.018, inside);
    this.fog.color.setRGB(lerp(0.008, 0.006, inside), lerp(0.01, 0.009, inside), lerp(0.014, 0.014, inside));
    (this.scene.background as THREE.Color).copy(this.fog.color);
    this.probe.position.copy(this.camera.position);
    this.probe.intensity = 1.2 * inside;
    this.dialLight.intensity = 14 * this.mix(a, b, e, "dial", 0);
    this.key.intensity = lerp(260, 60, inside);
    this.rim.intensity = lerp(160, 40, inside);

    // Времето: забавяне вътре; часовникът тиктака винаги.
    const rate = this.mix(a, b, e, "rate", 1);
    const mv = this.movement.update(dt, rate, this.t0);
    // Финалът: стрелките се нагласят на 13:33 (през стрелковия механизъм, ходът не спира).
    const set = this.mix(a, b, e, "set", 0);
    const target = 13 * 3600 + 33 * 60;
    let fwd = (target - mv.time) % 43200;
    if (fwd < 0) fwd += 43200;
    // fwd намалява с времето; за да не „пълзи“ в края, нагласяме към крайния ъгъл.
    this.setOffset = fwd * smooth(set);
    const display = mv.time + this.setOffset;
    this.movement.setHands(display, mv.time);

    // Пост-обработка.
    this.grade.uniforms.uTime.value = this.elapsed;
    this.grade.uniforms.uFlash.value = this.mix(a, b, e, "flash", 0);
    this.bloom.strength = 0.16;
    this.composer.render(dt);
    return { time: mv.time, display, ticked: mv.ticked, tick: mv.tick, rate, inside };
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const me = o as THREE.Mesh;
      me.geometry?.dispose();
    });
  }
}

export { POS };
