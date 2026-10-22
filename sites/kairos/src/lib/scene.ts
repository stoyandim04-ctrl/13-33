import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
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
    uGain: { value: new THREE.Vector3(1.02, 1.0, 0.97) },
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
      col = col * col * (3.0 - 2.0 * col) * 0.25 + col * 0.75;
      l = dot(col, vec3(0.299, 0.587, 0.114));
      col = clamp(mix(vec3(l), col, 1.1), 0.0, 1.0);
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
  private probe = new THREE.PointLight(0xfff2e2, 0, 14, 2);
  // Два студийни прожектора със сенки: един през задното стъкло (механизмът), един отпред (циферблатът).
  private key = new THREE.DirectionalLight(0xfff0dc, 2.6);
  private front = new THREE.DirectionalLight(0xfff4e8, 2.2);
  private bokeh?: BokehPass;
  private focus = 50;
  private frame = 0;
  private ray = new THREE.Raycaster();
  private setOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.lite = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lite, powerPreference: "high-performance" });
    // AgX — мек, фотографски тонмапинг: светлото не пресища, сенките остават плътни.
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
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
    // Истинско студийно HDRI (Poly Haven, CC0) — металите отразяват реални софтбоксове.
    try {
      const hdr = await new HDRLoader().loadAsync("studio.hdr");
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
    } catch {
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    }
    this.scene.environmentIntensity = 0.75;
    this.scene.environmentRotation.set(0.3, 0.8, 0);
    this.scene.background = new THREE.Color(0x030405);
    this.scene.fog = this.fog;

    const mats = materials(this.lite);
    this.movement = buildMovement(mats);
    this.glassMat = mats.glass;
    this.watch.add(this.movement.root);
    this.scene.add(this.watch);

    // Светлината е в координатите на часовника — сенките падат правилно по платината.
    const shadow = (l: THREE.DirectionalLight) => {
      l.castShadow = true;
      l.shadow.mapSize.set(this.lite ? 1024 : 2048, this.lite ? 1024 : 2048);
      const c = l.shadow.camera;
      c.left = c.bottom = -21;
      c.right = c.top = 21;
      c.near = 1;
      c.far = 120;
      l.shadow.bias = -0.0004;
      l.shadow.normalBias = 0.02;
      l.shadow.radius = 3;
    };
    this.key.position.set(-18, 22, 48);
    this.front.position.set(-22, 26, -46);
    shadow(this.key);
    shadow(this.front);
    this.watch.add(this.key, this.key.target, this.front, this.front.target, this.probe);
    const dialLight = new THREE.PointLight(0xffefd8, 0, 40, 1.2);
    dialLight.position.set(-8, 12, -14);
    this.watch.add(dialLight);
    this.dialLight = dialLight;

    this.buildPath();

    const rp = new RenderPass(this.scene, this.camera);
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: this.lite ? 2 : 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(rp);
    // Макро обектив: малка дълбочина на рязкост, фокусът следва това, което е в центъра.
    if (!this.lite) {
      this.bokeh = new BokehPass(this.scene, this.camera, { focus: 50, aperture: 0.00005, maxblur: 0.009 });
      this.composer.addPass(this.bokeh);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.08, 0.3, 0.97);
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
  private focusTarget = 50;
  private glassMat?: THREE.Material;

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
    this.fog.density = lerp(0.001, 0.008, inside);
    this.fog.color.setRGB(lerp(0.008, 0.006, inside), lerp(0.01, 0.009, inside), lerp(0.014, 0.014, inside));
    (this.scene.background as THREE.Color).copy(this.fog.color);
    this.probe.position.copy(this.camera.position);
    this.probe.intensity = 0.25 * inside;
    this.scene.environmentIntensity = lerp(0.75, 0.42, inside);
    const dial = this.mix(a, b, e, "dial", 0);
    this.dialLight.intensity = 3 * dial;
    this.key.intensity = 2.6 * (1 - 0.6 * dial);
    this.front.intensity = 2.4 * dial;

    // Автофокус: на всеки няколко кадъра — лъч от центъра на кадъра.
    if (this.bokeh) {
      if (this.frame++ % 4 === 0) {
        this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const hit = this.ray.intersectObject(this.movement.root, true).find((h) => (h.object as THREE.Mesh).material !== this.glassMat);
        if (hit) this.focusTarget = hit.distance;
      }
      this.focus += (this.focusTarget - this.focus) * 0.15;
      const u = this.bokeh.uniforms as Record<string, THREE.IUniform>;
      u.focus.value = this.focus;
      u.aperture.value = lerp(0.00003, 0.0022, inside);
    }

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
    this.bloom.strength = 0.08;
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
