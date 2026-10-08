// The Three.js half of the Horizon hero, lifted out of the component so React
// only owns the lifecycle. Stars, nebula, ridgelines and atmosphere are the
// original's; colours moved to the 13:33 palette (electric blue + ice glow over
// graphite silhouettes), and everything it creates is tracked and disposed.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export interface HorizonSceneOptions {
  /** Phones: fewer stars, coarser nebula, lighter bloom, lower pixel ratio. */
  lite: boolean;
  /** No floating, no easing, no pulse - frames are drawn only when asked. */
  still: boolean;
}

export interface HorizonScene {
  /** Local progress through the hero, 0..1. */
  setProgress(p: number): void;
  resize(): void;
  /** Pause/resume the frame loop (off-screen, hidden tab). */
  setActive(active: boolean): void;
  dispose(): void;
}

const BG = 0x080a0f;
const ACCENT = new THREE.Color(0x5b7cfa);
const ICE = new THREE.Color(0xa8d8ff);
const BONE = new THREE.Color(0xf4f1eb);

/* Camera path. Starts close and pulls back on load (the original's intro),
   then the scroll carries it up and in over the ridgelines toward the light. */
const CAM_INTRO = { x: 0, y: 30, z: 100 };
const CAM_FROM = { x: 0, y: 30, z: 300 };
const CAM_TO = { x: 0, y: 150, z: -30 };
const LOOK_AT = new THREE.Vector3(0, 10, -600);
const SMOOTHING = 0.05;

/** Deterministic noise so the ridgelines do not reshuffle on every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function createHorizonScene(
  host: HTMLElement,
  { lite, still }: HorizonSceneOptions,
): HorizonScene | null {
  // A fresh canvas per mount: a StrictMode remount, or a context lost on the
  // last one, must not leave us drawing into a dead context.
  const canvas = document.createElement("canvas");
  canvas.className = "absolute inset-0 block size-full";
  canvas.setAttribute("aria-hidden", "true");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lite,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  host.appendChild(canvas);

  const size = () => ({
    w: Math.max(1, host.clientWidth),
    h: Math.max(1, host.clientHeight),
  });
  let { w, h } = size();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(BG, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.55;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.00025);

  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
  // A portrait screen would crop the 75° view into a narrow, over-bright slice
  // of the glow. Keep at least ~52° across by opening the vertical angle.
  const fitFov = () => {
    const minH = THREE.MathUtils.degToRad(52);
    const needed = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minH / 2) / camera.aspect));
    camera.fov = Math.min(100, Math.max(75, needed));
    camera.updateProjectionMatrix();
  };
  fitFov();
  camera.position.set(CAM_INTRO.x, CAM_INTRO.y, CAM_INTRO.z);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(lite ? w / 2 : w, lite ? h / 2 : h),
    lite ? 0.32 : 0.6,
    0.4,
    0.85,
  );
  composer.addPass(bloom);
  composer.setSize(w, h);

  const rand = seeded(1333);

  // Stars: three shells that turn at slightly different speeds.
  const stars: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  const starCount = lite ? 1400 : 4200;
  for (let layer = 0; layer < 3; layer++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    for (let j = 0; j < starCount; j++) {
      const radius = 200 + rand() * 800;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[j * 3 + 2] = radius * Math.cos(phi);
      const pick = rand();
      const c = pick < 0.72 ? BONE : pick < 0.92 ? ICE : ACCENT;
      const dim = 0.75 + rand() * 0.25;
      colors[j * 3] = c.r * dim;
      colors[j * 3 + 1] = c.g * dim;
      colors[j * 3 + 2] = c.b * dim;
      sizes[j] = rand() * 2 + 0.5;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, depth: { value: layer } },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float depth;
        void main() {
          vColor = color;
          vec3 pos = position;
          float angle = time * 0.05 * (1.0 - depth * 0.3);
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          pos.xy = rot * pos.xy;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    stars.push(points);
  }

  // Nebula: the original blue/pink veil, recoloured to accent → ice.
  const seg = lite ? 40 : 100;
  const nebula = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 4000, seg, seg),
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: ACCENT.clone() },
        color2: { value: ICE.clone() },
        opacity: { value: lite ? 0.13 : 0.2 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
          pos.z += elevation;
          vElevation = elevation;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
          vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
          float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
          alpha *= 1.0 + vElevation * 0.01;
          gl_FragColor = vec4(color, max(alpha, 0.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  nebula.position.z = -1050;
  scene.add(nebula);

  // Ridgelines: graphite silhouettes, nearer = darker and solid, farther =
  // lighter and thinner so the glow reads through them as haze.
  const layers = [
    { distance: -50, height: 60, color: 0x0a0d13, opacity: 1 },
    { distance: -100, height: 80, color: 0x0e1320, opacity: 0.86 },
    { distance: -150, height: 100, color: 0x141c2e, opacity: 0.66 },
    { distance: -200, height: 120, color: 0x1b2742, opacity: 0.46 },
  ];
  const mountains = layers.map((layer, index) => {
    const points: THREE.Vector2[] = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments - 0.5) * 1000;
      const y =
        Math.sin(i * 0.1) * layer.height +
        Math.sin(i * 0.05) * layer.height * 0.5 +
        rand() * layer.height * 0.2 -
        100;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(5000, -1500));
    points.push(new THREE.Vector2(-5000, -1500));
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(new THREE.Shape(points)),
      new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(0, 50, layer.distance);
    mesh.userData = { index, baseOpacity: layer.opacity };
    scene.add(mesh);
    return mesh;
  });

  // Atmosphere: the shell of light around everything, in ice blue.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(600, lite ? 24 : 32, lite ? 24 : 32),
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, strength: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        uniform float time;
        uniform float strength;
        void main() {
          float intensity = pow(max(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
          vec3 atmosphere = vec3(0.36, 0.62, 1.0) * intensity;
          atmosphere *= (sin(time * 2.0) * 0.1 + 0.9) * strength;
          gl_FragColor = vec4(atmosphere, intensity * 0.25 * strength);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  scene.add(atmosphere);

  // ---- state -----------------------------------------------------------
  const cam = still ? { ...CAM_FROM } : { ...CAM_INTRO };
  const target = { ...CAM_FROM };
  let progress = 0;
  let frame = 0;
  let running = false;
  let disposed = false;
  const t0 = performance.now();

  const draw = () => {
    const time = still ? 0 : (performance.now() - t0) * 0.001;
    for (const s of stars) s.material.uniforms.time.value = time;
    nebula.material.uniforms.time.value = time * 0.5;
    atmosphere.material.uniforms.time.value = time;

    const k = still ? 1 : SMOOTHING;
    cam.x += (target.x - cam.x) * k;
    cam.y += (target.y - cam.y) * k;
    cam.z += (target.z - cam.z) * k;
    const floatX = still ? 0 : Math.sin(time * 0.1) * 2;
    const floatY = still ? 0 : Math.cos(time * 0.15);
    camera.position.set(cam.x + floatX, cam.y + floatY, cam.z);
    camera.lookAt(LOOK_AT);

    // Parallax sway, as in the original - nearer ridges move more.
    mountains.forEach((m, i) => {
      const f = 1 + i * 0.5;
      m.position.x = still ? 0 : Math.sin(time * 0.1) * 2 * f;
      m.position.y = 50 + (still ? 0 : Math.cos(time * 0.15) * f);
    });

    composer.render();
  };

  const loop = () => {
    if (!running || disposed) return;
    frame = requestAnimationFrame(loop);
    draw();
  };

  const applyProgress = () => {
    const e = smooth(progress);
    target.x = CAM_FROM.x + (CAM_TO.x - CAM_FROM.x) * e;
    target.y = CAM_FROM.y + (CAM_TO.y - CAM_FROM.y) * e;
    target.z = CAM_FROM.z + (CAM_TO.z - CAM_FROM.z) * e;
    // The light disperses as we cross the ridges.
    const fade = 1 - smooth(Math.min(1, Math.max(0, (progress - 0.35) / 0.65)));
    nebula.material.uniforms.opacity.value = (lite ? 0.13 : 0.2) * (0.35 + 0.65 * fade);
    atmosphere.material.uniforms.strength.value = 0.4 + 0.6 * fade;
    bloom.strength = (lite ? 0.32 : 0.6) * (0.5 + 0.5 * fade);
    // The nearest ridge thins as the camera passes over it, so the flight
    // never ends staring into a flat slab.
    mountains.forEach((m) => {
      const { index, baseOpacity } = m.userData as {
        index: number;
        baseOpacity: number;
      };
      const pass = index === 0 ? 1 - smooth(Math.max(0, (progress - 0.6) / 0.4)) : 1;
      m.material.opacity = baseOpacity * pass;
    });
  };
  applyProgress();

  return {
    setProgress(p) {
      const next = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
      if (next === progress) return;
      progress = next;
      applyProgress();
      if (still && !disposed) draw();
    },
    resize() {
      if (disposed) return;
      ({ w, h } = size());
      camera.aspect = w / h;
      fitFov();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      if (lite) bloom.resolution.set(w / 2, h / 2);
      if (still || !running) draw();
    },
    setActive(active) {
      if (disposed) return;
      if (still) {
        if (active) draw();
        return;
      }
      if (active === running) return;
      running = active;
      if (running) frame = requestAnimationFrame(loop);
      else cancelAnimationFrame(frame);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      cancelAnimationFrame(frame);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      scene.clear();
      bloom.dispose();
      renderPass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
