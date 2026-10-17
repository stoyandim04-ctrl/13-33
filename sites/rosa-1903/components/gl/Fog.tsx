"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { deviceTier, type Tier } from "@/lib/gpu";

/**
 * Scene I's fog: fbm noise drifting low over the field. The cursor (or a
 * finger) clears it like breath on glass and it closes back slowly.
 * `state.progress` (0–1 through the scene) thins it and warms its colour.
 */
export type FogState = { progress: number };

const TRAIL = 24;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uP;
  uniform float uAspect;
  uniform vec3 uTrail[${TRAIL}];
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.035;
    // two layers drifting at different speeds = depth
    float f1 = fbm(p * 2.2 + vec2(t * 1.6, t * 0.2));
    float f2 = fbm(p * 4.5 + vec2(-t * 2.4, t * 0.5) + f1);
    float fog = smoothstep(0.32, 0.9, f1 * 0.6 + f2 * 0.55);
    // it hugs the ground and lifts as the sun nears
    float band = smoothstep(0.85, 0.25, uv.y) * smoothstep(-0.1, 0.25, uv.y);
    fog *= band * mix(1.0, 0.25, uP);

    // breath on glass
    float clear = 0.0;
    for (int i = 0; i < ${TRAIL}; i++) {
      vec3 tr = uTrail[i];
      vec2 d = vec2((uv.x - tr.x) * uAspect, uv.y - tr.y);
      float age = uTime - tr.z;
      clear = max(clear, exp(-dot(d, d) / 0.018) * exp(-age * 0.7));
    }
    fog *= 1.0 - smoothstep(0.0, 0.9, clear);

    vec3 cool = vec3(0.62, 0.68, 0.73);
    vec3 warm = vec3(0.86, 0.72, 0.66);
    vec3 col = mix(cool, warm, smoothstep(0.2, 0.9, uP));
    gl_FragColor = vec4(col, fog * 0.85);
  }
`;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

function Layer({ state }: { state: FogState }) {
  const { size } = useThree();
  const trail = useRef(Array.from({ length: TRAIL }, () => new THREE.Vector3(-9, -9, -99)));
  const head = useRef(0);
  const last = useRef({ x: -1, y: -1 });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uP: { value: 0 },
          uAspect: { value: 1 },
          uTrail: { value: trail.current },
        },
      }),
    [],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      const dx = x - last.current.x;
      const dy = y - last.current.y;
      if (dx * dx + dy * dy < 0.0004) return;
      last.current = { x, y };
      trail.current[head.current].set(x, y, material.uniforms.uTime.value);
      head.current = (head.current + 1) % TRAIL;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      material.dispose();
    };
  }, [material]);

  useFrame((_, dt) => {
    const u = material.uniforms;
    u.uTime.value += Math.min(dt, 0.05);
    u.uP.value += (state.progress - u.uP.value) * 0.1;
    u.uAspect.value = size.width / size.height;
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function Fog({ state, active }: { state: FogState; active: boolean }) {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    deviceTier().then(setTier);
  }, []);
  if (!tier) return null;
  // fog is soft; it never needs more than half resolution on phones
  const dpr = tier.mobile ? 0.5 : tier.tier >= 3 ? 1 : 0.75;
  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      gl={{ antialias: false, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Layer state={state} />
    </Canvas>
  );
}
