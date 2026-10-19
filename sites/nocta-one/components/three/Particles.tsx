"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { live } from "@/lib/store";

/** Dust in the hero, stars further in. One instanced point cloud. */

const vert = /* glsl */ `
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uPixel;
uniform float uWarp;
varying float vAlpha;
void main() {
  vec3 p = position;
  // slow drift, each grain on its own orbit
  p.x += sin(uTime * 0.07 + aSeed * 31.0) * 0.25;
  p.y += cos(uTime * 0.05 + aSeed * 17.0) * 0.2 + mod(uTime * 0.03 * (0.3 + aSeed), 1.0) * 0.2;
  // warp: stretch towards the camera
  p.z += uWarp * (aSeed - 0.3) * 6.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 40.0);
  vAlpha = twinkle * smoothstep(30.0, 4.0, -mv.z) * smoothstep(0.2, 1.2, -mv.z);
  gl_PointSize = aSize * uPixel * (6.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 col = mix(vec3(0.31, 0.89, 1.0), vec3(0.92, 0.97, 1.0), a);
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;

export function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // denser on the left and behind, where the headline is not
      const r = Math.random();
      pos[i * 3] = (Math.random() - 0.62) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = -Math.random() * 12 + 2.5;
      seed[i] = Math.random();
      size[i] = r < 0.03 ? 3.2 : r < 0.25 ? 1.6 : 0.9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPixel: { value: 1 }, uOpacity: { value: 1 }, uWarp: { value: 0 } }),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms,
        depthWrite: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useFrame((state, dt) => {
    uniforms.uTime.value += dt * (live.reduced ? 0.3 : 1);
    uniforms.uPixel.value = state.gl.getPixelRatio() * 2.2;
    uniforms.uOpacity.value = frame.particles;
    uniforms.uWarp.value = live.reduced ? 0 : Math.max(frame.streaks, frame.tunnel);
    const p = ref.current;
    if (p) {
      p.rotation.y = (live.progress - 0.5) * 0.5;
      p.rotation.x = live.pointer.y * 0.02;
    }
  });

  return (
    <points ref={ref} material={material} geometry={geometry} renderOrder={-8}>
    </points>
  );
}
