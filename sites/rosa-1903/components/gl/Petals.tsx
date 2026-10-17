"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { sampleBottle } from "@/lib/bottle";
import { deviceTier, maxDpr, petalCount, type Tier } from "@/lib/gpu";
import { filmClock, filmMode } from "@/lib/film";

/**
 * Scene II's petals, all on the GPU: they fall and shy away from the cursor
 * (0–30 %), a curl of wind pulls them into a vortex (30–70 %), they settle on
 * the surface of the bottle and glow rose-gold (70–92 %), then fall away as
 * drops. `state.progress` is written by the scene's timeline.
 */
export type PetalState = { progress: number };

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uP;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform float uPR;
  uniform float uSize;
  attribute vec3 aTarget;
  attribute vec4 aSeed;
  attribute vec3 aColor;
  varying float vRot;
  varying float vGlow;
  varying float vDrop;
  varying vec3 vColor;
  varying float vAlpha;

  float e3(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }

  void main() {
    float t = uTime;
    vec3 s = position;

    // falling, with a little sway; wraps top to bottom
    float H = 7.0;
    vec3 fall = s;
    fall.y = mod(s.y - t * (0.22 + aSeed.x * 0.3) + H * 0.5, H) - H * 0.5;
    fall.x += sin(t * 0.55 + aSeed.y * 6.2831) * 0.28;
    fall.z += cos(t * 0.45 + aSeed.z * 6.2831) * 0.22;

    // the cursor pushes them aside
    vec2 d = fall.xy - uMouse;
    float m = exp(-dot(d, d) * 1.6) * uMouseOn;
    fall.xy += normalize(d + 1e-4) * m * 0.75;

    // the vortex: a funnel, wide above, tight below, spinning faster as it narrows
    float v = smoothstep(0.28, 0.66, uP);
    float r = length(fall.xz);
    float h = clamp((fall.y + 3.5) / 7.0, 0.0, 1.0);
    float funnel = (0.12 + h * h * 2.1) * (0.7 + aSeed.x * 0.6);
    float ang = atan(fall.z, fall.x) + v * (2.0 + aSeed.w * 4.0) + t * v * (1.6 + (1.0 - h) * 2.4);
    float rr = mix(r, funnel, v);
    vec3 swirl = vec3(cos(ang) * rr, mix(fall.y, (h - 0.5) * 4.2, v), sin(ang) * rr);

    // the bottle
    float k = e3(clamp((uP - 0.66 - aSeed.y * 0.1) / 0.18, 0.0, 1.0));
    vec3 pos = mix(swirl, aTarget, k);

    // drops
    float dr = clamp((uP - 0.9 - aSeed.z * 0.05) / 0.1, 0.0, 1.0);
    pos.y -= dr * dr * (4.5 + aSeed.x * 3.0);
    pos.x *= 1.0 - dr * 0.3;

    vRot = aSeed.w * 6.2831 + t * (0.4 + aSeed.x) * (1.0 - k);
    vGlow = k;
    vDrop = dr;
    vColor = aColor;
    // only a third of the petals fall at first; the wind gathers the rest
    vAlpha = mix(step(aSeed.z, 0.33), 1.0, smoothstep(0.3, 0.55, uP));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aSeed.y * 0.9);
    size *= mix(1.0, 0.42, k) * mix(1.0, 0.8, dr);
    gl_PointSize = size * uPR / -mv.z;
  }
`;

const fragment = /* glsl */ `
  varying float vRot;
  varying float vGlow;
  varying float vDrop;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    uv = mat2(c, -s, s, c) * uv;
    // a petal (narrow at the base, round at the tip); drops are round
    float stretch = mix(1.85, 1.0, max(vDrop, vGlow * 0.6));
    vec2 q = vec2(uv.x * stretch * (1.0 + uv.y * 0.6), uv.y);
    float d = length(q) * 2.0;
    float a = smoothstep(1.0, 0.7, d);
    if (a < 0.02) discard;
    vec3 col = mix(vColor * 0.75, vColor * 1.15, uv.y + 0.5);
    col = mix(col, vec3(0.98, 0.7, 0.58) * (1.05 + uv.y * 0.4), vGlow * 0.8);
    gl_FragColor = vec4(col, a * 0.9 * vAlpha);
  }
`;

const PALETTE = ["#e8b4b8", "#d98f9a", "#c9917a", "#f2d5cf", "#b86a78", "#f2e6dc"].map((c) => new THREE.Color(c));

function Field({ count, state, pointer }: { count: number; state: PetalState; pointer: React.RefObject<{ x: number; y: number; on: number }> }) {
  const { size, viewport, camera } = useThree();
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const start = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    const color = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      start[i * 3] = (Math.random() - 0.5) * 9;
      start[i * 3 + 1] = (Math.random() - 0.5) * 7;
      start[i * 3 + 2] = (Math.random() - 0.5) * 5;
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random();
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      color.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(sampleBottle(count), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    return g;
  }, [count]);

  const tick = useMemo(() => filmClock(), []);
  const film = useMemo(() => filmMode(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uP: { value: 0 },
          uMouse: { value: new THREE.Vector2(99, 99) },
          uMouseOn: { value: 0 },
          uPR: { value: 1 },
          uSize: { value: 1 },
        },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, dt) => {
    const u = material.uniforms;
    const d = tick(dt);
    u.uTime.value += d;
    u.uP.value = film ? state.progress : u.uP.value + (state.progress - u.uP.value) * 0.12;
    u.uPR.value = Math.min(window.devicePixelRatio, 2);
    // petals read ~1.2 % of the screen height on any device
    u.uSize.value = size.height * 0.1;
    const p = pointer.current!;
    u.uMouse.value.set((p.x * viewport.width) / 2, (p.y * viewport.height) / 2);
    u.uMouseOn.value += (p.on * (1 - smooth(0.28, 0.5, u.uP.value)) - u.uMouseOn.value) * 0.08;
    void camera;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Petals({ state, active }: { state: PetalState; active: boolean }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const pointer = useRef({ x: 9, y: 9, on: 0 });

  useEffect(() => {
    deviceTier().then(setTier);
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.current.on = 1;
    };
    const leave = () => (pointer.current.on = 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  if (!tier) return null;
  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={active ? "always" : "never"}
      dpr={[1, maxDpr(tier)]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 35, position: [0, 0, 9], near: 0.1, far: 50 }}
      style={{ pointerEvents: "none" }}
    >
      <Field count={petalCount(tier)} state={state} pointer={pointer} />
    </Canvas>
  );
}
