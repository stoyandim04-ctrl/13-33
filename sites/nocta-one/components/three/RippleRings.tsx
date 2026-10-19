"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { live } from "@/lib/store";

/**
 * Concentric sound waves, like a stone in dark water. The middle stays dark
 * so the glass case reads against it. Lives as a wall behind the case in the
 * hero and folds down into a floor during the lift-off (ringsTilt).
 */

const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const frag = /* glsl */ `
precision highp float;
#define SIZE 16.0
uniform float uTime;
uniform float uOpacity;
uniform vec2 uCenter;
uniform float uPulse;
varying vec2 vUv;

// hash / value noise / fbm
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  // world units: the plane is SIZE wide, the case is ~1.7
  vec2 p = (vUv - 0.5) * SIZE - uCenter;
  float r = length(p);
  float n = fbm(p * 0.9 + uTime * 0.06);
  float rr = r + (n - 0.5) * 0.12;

  // travelling waves, wavelength ~0.42 world units; amplitude varies
  // around the ring and along the radius so it reads as water, not a target
  float phase = rr * 11.0 - uTime * 0.9;
  float w = sin(phase);
  float amp = 0.45 + 0.55 * fbm(p / max(r, 0.001) * 1.6 + vec2(r * 0.5 - uTime * 0.08, 0.0));
  float soft = (0.5 + 0.5 * w) * amp;
  float crest = pow(0.5 + 0.5 * w, 6.0) * amp;

  // dark well where the case sits, strongest mid-field, fading far out
  float well = smoothstep(0.7, 1.9, r);
  float far = 1.0 - smoothstep(3.2, 6.0, r);
  float env = well * far;

  vec3 abyss = vec3(0.012, 0.024, 0.05);
  vec3 navy = vec3(0.025, 0.09, 0.2);
  vec3 blue = vec3(0.06, 0.3, 0.68);
  vec3 cyan = vec3(0.3, 0.86, 1.0);

  vec3 col = mix(abyss, navy, soft * env * 0.9);
  col = mix(col, blue, crest * env * 0.55);
  col += cyan * pow(crest, 3.0) * env * 0.12;
  // halo directly behind the case
  col += blue * 0.25 * exp(-r * r * 0.8) * (1.0 - well);

  // the energy pulse at the end of the loop rolls out from the centre
  float pr = uPulse * 6.0;
  col += cyan * smoothstep(0.35, 0.0, abs(r - pr)) * uPulse * 2.0;

  col = mix(vec3(0.0118, 0.0235, 0.051), col, uOpacity);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0 * 3.0;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function RippleRings() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uCenter: { value: new THREE.Vector2() },
      uPulse: { value: 0 },
    }),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms,
        depthWrite: false,
        
        
      }),
    [uniforms],
  );

  // wall (hero) and floor (lift-off) placements
  const wall = useMemo(() => ({ pos: new THREE.Vector3(0, 0, -1.6), rot: new THREE.Euler(0, 0, 0) }), []);
  const floor = useMemo(() => ({ pos: new THREE.Vector3(0, -1.1, 0.2), rot: new THREE.Euler(-1.3, 0, 0) }), []);
  const q0 = useMemo(() => new THREE.Quaternion().setFromEuler(wall.rot), [wall]);
  const q1 = useMemo(() => new THREE.Quaternion().setFromEuler(floor.rot), [floor]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const o = frame.ringsOpacity;
    m.visible = o > 0.001;
    if (!m.visible) return;
    const speed = live.reduced ? 0.3 : 1;
    uniforms.uTime.value += dt * speed * (1 + Math.min(Math.abs(live.velocity) * 0.02, 2));
    uniforms.uOpacity.value = o;
    uniforms.uPulse.value = frame.tunnel;
    // the mouse nudges the centre of the waves a few pixels
    const c = uniforms.uCenter.value;
    c.x += (live.pointer.x * 0.025 - c.x) * 0.05;
    c.y += (live.pointer.y * 0.02 - c.y) * 0.05;
    const t = frame.ringsTilt;
    m.position.lerpVectors(wall.pos, floor.pos, t);
    m.quaternion.slerpQuaternions(q0, q1, t);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10}>
      <planeGeometry args={[16, 16, 1, 1]} />
    </mesh>
  );
}
