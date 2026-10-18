// The hero's one sculptural moment: a drop of ink on paper. A glossy black
// form that breathes like liquid (3D noise displaces a dense sphere in the
// vertex shader, normals rebuilt from neighbouring points so the light stays
// true), lit by a soft studio environment. The page drives it with one number,
// the hero's scroll progress (0 → 1): the drop drifts to the centre, grows and
// moves more freely. It leans towards the pointer and renders only while the
// hero is on screen. Loaded on demand with three.js.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface InkScene {
  setProgress(p: number): void;
  setPointer(x: number, y: number): void;
  setActive(on: boolean): void;
  resize(): void;
  dispose(): void;
}

// Ashima / Stefan Gustavson 3D simplex noise (MIT).
const NOISE = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
// A point on the unit sphere, pushed out by two octaves of slow noise.
vec3 inkShape(vec3 dir){
  float n = snoise(dir * uFreq + vec3(0.0, uTime * 0.16, uTime * 0.1)) * 0.85
          + snoise(dir * uFreq * 1.9 - vec3(uTime * 0.08)) * 0.15;
  return dir * (1.0 + uAmp * n);
}
`;

export function createInkScene(canvas: HTMLCanvasElement, opts: { light: boolean; still: boolean }): InkScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.light ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-4, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4e6, 0.8);
  rim.position.set(4, -2, -3);
  scene.add(rim);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.14 },
    uFreq: { value: 0.72 },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0c0b0a,
    roughness: 0.16,
    metalness: 0.0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.15,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${NOISE}`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 inkDir = normalize(position);
        vec3 inkP = inkShape(inkDir);
        vec3 inkT = normalize(abs(inkDir.y) > 0.99 ? cross(inkDir, vec3(1.0, 0.0, 0.0)) : cross(inkDir, vec3(0.0, 1.0, 0.0)));
        vec3 inkB = cross(inkDir, inkT);
        float inkE = 0.01;
        vec3 inkP1 = inkShape(normalize(inkDir + inkT * inkE));
        vec3 inkP2 = inkShape(normalize(inkDir + inkB * inkE));
        vec3 objectNormal = normalize(cross(inkP1 - inkP, inkP2 - inkP));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = inkP;");
  };

  const detail = opts.light ? 40 : 72;
  const drop = new THREE.Mesh(new THREE.IcosahedronGeometry(1, detail), material);
  scene.add(drop);

  let progress = 0;
  let shown = 0;
  let px = 0, py = 0, lx = 0, ly = 0;
  let active = true;
  let frame = 0;
  let wide = true;
  const t0 = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  function draw() {
    frame = 0;
    const time = (performance.now() - t0) / 1000;
    shown += (progress - shown) * (opts.still ? 1 : 0.07);
    lx += (px - lx) * 0.04;
    ly += (py - ly) * 0.04;
    const p = ease(Math.min(1, Math.max(0, shown)));

    uniforms.uTime.value = opts.still ? 2 : time;
    uniforms.uAmp.value = 0.14 + 0.08 * p;
    // Wide screens: from the right of the words up to the centre, above the
    // promise. Phones: centred, rising a little.
    const float = opts.still ? 0 : Math.sin(time * 0.6) * 0.05;
    drop.position.x = (wide ? 1.55 * (1 - p) : 0) + lx * 0.2;
    drop.position.y = (wide ? -0.05 + 0.6 * p : 0.05 + 0.2 * p) + float - ly * 0.12;
    drop.rotation.y = time * 0.05 + lx * 0.6;
    drop.rotation.x = ly * 0.4 + p * 0.6;
    drop.scale.setScalar(wide ? 1.05 - 0.2 * p : 0.95);

    renderer.render(scene, camera);
    if (active && !opts.still) frame = requestAnimationFrame(draw);
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w / h > 1.1;
    camera.position.z = w / h < 1 ? 8 / Math.max(0.6, w / h) : 8;
    camera.updateProjectionMatrix();
    if (!frame) frame = requestAnimationFrame(draw);
  }
  resize();

  const kick = () => {
    if (!frame && active) frame = requestAnimationFrame(draw);
  };
  return {
    setProgress(p) {
      progress = p;
      kick();
    },
    setPointer(x, y) {
      px = x;
      py = y;
      kick();
    },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) kick();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    resize,
    dispose() {
      cancelAnimationFrame(frame);
      drop.geometry.dispose();
      material.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
