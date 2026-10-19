"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { live } from "@/lib/store";

/**
 * Deep space wireframe: a jittered triangle net far behind the product, like
 * a star chart. `gridWarp` pulls the middle back into a gravity well.
 */

const NX = 30;
const NY = 18;
const W = 44;
const H = 26;

function buildGeometry() {
  const rand = mulberry(1333);
  const pts: THREE.Vector3[] = [];
  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      const edge = i === 0 || j === 0 || i === NX || j === NY;
      const jx = edge ? 0 : (rand() - 0.5) * 0.8;
      const jy = edge ? 0 : (rand() - 0.5) * 0.8;
      pts.push(new THREE.Vector3(((i + jx) / NX - 0.5) * W, ((j + jy) / NY - 0.5) * H, 0));
    }
  }
  const idx = (i: number, j: number) => j * (NX + 1) + i;
  const pos: number[] = [];
  const seg = (a: THREE.Vector3, b: THREE.Vector3) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let j = 0; j <= NY; j++) {
    for (let i = 0; i <= NX; i++) {
      if (i < NX) seg(pts[idx(i, j)], pts[idx(i + 1, j)]);
      if (j < NY) seg(pts[idx(i, j)], pts[idx(i, j + 1)]);
      if (i < NX && j < NY) {
        if (rand() > 0.5) seg(pts[idx(i, j)], pts[idx(i + 1, j + 1)]);
        else seg(pts[idx(i + 1, j)], pts[idx(i, j + 1)]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vert = /* glsl */ `
uniform float uWarp;
uniform float uTime;
varying float vFade;
void main() {
  vec3 p = position;
  float d2 = dot(p.xy, p.xy);
  // bowl: the net curves towards the viewer at the edges, gives perspective
  p.z += d2 * 0.018;
  // gravity well behind the product
  p.z -= uWarp * 9.0 * exp(-d2 / 30.0);
  // slow breathing
  p.z += sin(p.x * 0.3 + uTime * 0.25) * 0.25 + cos(p.y * 0.35 + uTime * 0.2) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vFade = clamp(1.0 - (-mv.z - 4.0) / 26.0, 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
uniform float uOpacity;
uniform float uWarp;
varying float vFade;
void main() {
  vec3 c = mix(vec3(0.12, 0.42, 0.9), vec3(0.31, 0.89, 1.0), clamp(uWarp * 0.6, 0.0, 1.0));
  gl_FragColor = vec4(c * 1.4, uOpacity * (0.1 + 0.32 * vFade) * (1.0 + uWarp * 0.8));
}
`;

export function WireGrid() {
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(buildGeometry, []);
  const uniforms = useMemo(
    () => ({ uOpacity: { value: 0 }, uWarp: { value: 0 }, uTime: { value: 0 } }),
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

  useFrame((_, dt) => {
    const l = ref.current;
    if (!l) return;
    const o = frame.gridOpacity;
    l.visible = o > 0.001;
    if (!l.visible) return;
    uniforms.uOpacity.value = o;
    uniforms.uWarp.value = frame.gridWarp;
    uniforms.uTime.value += dt * (live.reduced ? 0.2 : 1);
    // the net drifts with the scroll so it reads as space, not wallpaper
    const p = live.progress;
    l.rotation.set(-0.18 + Math.sin(p * Math.PI * 2) * 0.12, (p - 0.5) * 0.7 + live.pointer.x * 0.03, p * 0.4);
  });

  return (
    <lineSegments ref={ref} material={material} geometry={geometry} position={[0, 0, -9]} renderOrder={-9}>
    </lineSegments>
  );
}
