"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { Anchor } from "./Anchor";
import { earbudGeometry } from "./earbudGeometry";
import { chromeMaterial, darkMatte, metalMaterial, shellMaterial, siliconeMaterial } from "./materials";

/**
 * NOCTA One earbud: the moulded shell (SDF, see earbudGeometry) plus the
 * internals that only show in the exploded view. Every part sits on its own
 * group and travels along local Z (the explode axis) by `frame.explode`.
 *
 * Local frame: origin = centre of the head, stem down -Y, ear tip -Z, the
 * flat touch face +Z. The right bud is the left one mirrored on X.
 */

type Side = "L" | "R";

/** explode travel per part, local Z */
const TRAVEL = {
  shell: 0.42,
  pcb: 0.24,
  battery: 0.14,
  core: 0.0,
  chassis: -0.07,
  driver: -0.17,
  grille: -0.27,
  tip: -0.4,
} as const;

/* -------------------------------------------------------------- shaders -- */

const ledVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
// the pipe fills from the bottom (uv.x = 1) to the top (uv.x = 0)
const ledFrag = /* glsl */ `
uniform float uFill;
uniform float uTime;
varying vec2 vUv;
void main() {
  float t = 1.0 - vUv.x;
  float lit = smoothstep(uFill + 0.02, uFill - 0.04, t);
  float head = exp(-pow((t - uFill) * 18.0, 2.0)) * step(0.02, uFill) * step(uFill, 0.98);
  float base = 0.06;
  vec3 c = vec3(0.31, 0.89, 1.0);
  float shimmer = 0.85 + 0.15 * sin(t * 40.0 - uTime * 3.0);
  vec3 col = c * (base + lit * 1.25 * shimmer) + vec3(0.6, 0.95, 1.0) * head * 1.2;
  gl_FragColor = vec4(col, 1.0);
}
`;

const padVert = ledVert;
// concentric dotted rings, a crosshair and a pulse wave
const padFrag = /* glsl */ `
uniform float uOn;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float a = atan(p.y, p.x);
  float rings = 0.0;
  for (int i = 1; i <= 4; i++) {
    float rr = float(i) * 0.2;
    float dots = smoothstep(0.55, 0.0, abs(fract(a / 6.2831 * float(i) * 12.0) - 0.5) * 2.0 - 0.2);
    rings += smoothstep(0.022, 0.0, abs(r - rr)) * dots;
  }
  float edge = smoothstep(0.012, 0.0, abs(r - 0.96));
  float cross = (smoothstep(0.012, 0.0, abs(p.x)) + smoothstep(0.012, 0.0, abs(p.y))) * smoothstep(0.18, 0.1, r) * step(0.05, r);
  float pulse = smoothstep(0.08, 0.0, abs(r - fract(uTime * 0.6) * 1.2)) * (1.0 - r);
  float idle = 0.12;
  float v = (rings * 0.8 + edge * 0.6 + cross) * mix(idle, 1.0, uOn) + pulse * uOn * 1.4;
  vec3 col = vec3(0.31, 0.89, 1.0) * v * 2.2;
  gl_FragColor = vec4(col, clamp(v, 0.0, 1.0) * step(r, 1.0));
}
`;

const coreFrag = /* glsl */ `
uniform float uOn;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
  float flick = 0.94 + 0.06 * sin(uTime * 23.0) * sin(uTime * 7.0);
  vec3 hot = vec3(0.92, 0.97, 1.0) * (1.0 + uOn * 9.0) * flick;
  vec3 col = mix(hot, vec3(0.31, 0.89, 1.0) * (0.5 + uOn * 6.0), f);
  gl_FragColor = vec4(col * (0.04 + uOn), 1.0);
}
`;
const coreVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/* ------------------------------------------------------- internal parts -- */

function useInternals() {
  return useMemo(() => {
    // dynamic driver: a shallow cone with a surround and a magnet
    const conePts = [
      new THREE.Vector2(0.0, -0.012),
      new THREE.Vector2(0.02, -0.01),
      new THREE.Vector2(0.06, 0.0),
      new THREE.Vector2(0.085, 0.006),
      new THREE.Vector2(0.092, 0.006),
    ];
    const cone = new THREE.LatheGeometry(conePts, 64);
    const surround = new THREE.TorusGeometry(0.094, 0.006, 12, 64);
    const magnet = new THREE.CylinderGeometry(0.05, 0.05, 0.035, 48);
    const basket = new THREE.CylinderGeometry(0.1, 0.1, 0.012, 64, 1, true);
    // battery button cell
    const cell = new THREE.CylinderGeometry(0.072, 0.072, 0.05, 64);
    const cellCap = new THREE.CylinderGeometry(0.062, 0.062, 0.004, 64);
    // board
    const pcb = new THREE.CylinderGeometry(0.115, 0.115, 0.006, 64);
    // chassis ring
    const chassis = new THREE.TorusGeometry(0.135, 0.008, 12, 96);
    // core
    const core = new THREE.SphereGeometry(0.036, 48, 32);
    const coreHalo = new THREE.IcosahedronGeometry(0.058, 2);
    // grille
    const grille = new THREE.CircleGeometry(0.062, 64);
    const grilleRing = new THREE.TorusGeometry(0.063, 0.004, 8, 64);
    return { cone, surround, magnet, basket, cell, cellCap, pcb, chassis, core, coreHalo, grille, grilleRing };
  }, []);
}

let grilleTex: THREE.Texture | null = null;
function perforation() {
  if (grilleTex || typeof document === "undefined") return grilleTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#000";
  const s = 11;
  for (let y = 0; y < 256 + s; y += s * 0.866) {
    const row = Math.round(y / (s * 0.866));
    for (let x = (row % 2) * (s / 2); x < 256 + s; x += s) {
      g.beginPath();
      g.arc(x, y, s * 0.32, 0, Math.PI * 2);
      g.fill();
    }
  }
  grilleTex = new THREE.CanvasTexture(c);
  return grilleTex;
}

let traceTex: THREE.Texture | null = null;
function traces() {
  if (traceTex || typeof document === "undefined") return traceTex;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#fff";
  g.lineWidth = 2;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    let x = rnd() * 512, y = rnd() * 512;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.5) x += (rnd() - 0.5) * 160;
      else y += (rnd() - 0.5) * 160;
      g.lineTo(x, y);
    }
    g.stroke();
    g.beginPath();
    g.arc(x, y, 4, 0, Math.PI * 2);
    g.fillStyle = "#fff";
    g.fill();
  }
  traceTex = new THREE.CanvasTexture(c);
  return traceTex;
}

/* ---------------------------------------------------------------- bud -- */

export function Earbud({ side }: { side: Side }) {
  const geo = earbudGeometry();
  const parts = useInternals();
  const root = useRef<THREE.Group>(null);
  const groups = useRef<Partial<Record<keyof typeof TRAVEL, THREE.Group | null>>>({});
  const isR = side === "R";

  const mats = useMemo(() => {
    const led = new THREE.ShaderMaterial({
      vertexShader: ledVert,
      fragmentShader: ledFrag,
      uniforms: { uFill: { value: 0.3 }, uTime: { value: 0 } },
      toneMapped: false,
    });
    const pad = new THREE.ShaderMaterial({
      vertexShader: padVert,
      fragmentShader: padFrag,
      uniforms: { uOn: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const core = new THREE.ShaderMaterial({
      vertexShader: coreVert,
      fragmentShader: coreFrag,
      uniforms: { uOn: { value: 0 }, uTime: { value: 0 } },
      toneMapped: false,
    });
    const halo = new THREE.MeshBasicMaterial({
      color: "#4FE3FF",
      wireframe: true,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const grille = metalMaterial();
    grille.alphaMap = perforation();
    grille.alphaTest = 0.5;
    grille.side = THREE.DoubleSide;
    const pcb = new THREE.MeshPhysicalMaterial({
      color: "#06162B",
      roughness: 0.5,
      metalness: 0.3,
      emissive: new THREE.Color("#1E7BFF"),
      emissiveMap: traces(),
      emissiveIntensity: 0.0,
    });
    const cell = new THREE.MeshPhysicalMaterial({ color: "#3A4452", metalness: 0.9, roughness: 0.3, clearcoat: 0.5, envMapIntensity: 2.2 });
    return {
      shell: shellMaterial(),
      tip: siliconeMaterial(),
      chrome: chromeMaterial(),
      metal: metalMaterial(),
      dark: darkMatte(),
      led,
      pad,
      core,
      halo,
      grille,
      pcb,
      cell,
    };
  }, []);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const p = isR ? frame.budRPos : frame.budLPos;
    const r = isR ? frame.budRRot : frame.budLRot;
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(r[0], r[1], r[2]);

    const t = state.clock.elapsedTime;
    // only the right bud opens up
    const e = isR ? frame.explode : 0;
    for (const k in TRAVEL) {
      const o = groups.current[k as keyof typeof TRAVEL];
      if (o) o.position.z = TRAVEL[k as keyof typeof TRAVEL] * e;
    }
    // internals are hidden inside the shell; skip them when closed
    const open = e > 0.002;
    for (const k of ["pcb", "battery", "core", "chassis", "driver", "grille"] as const) {
      const o = groups.current[k];
      if (o) o.visible = open || (k === "core" && isR && frame.core > 0.01);
    }

    mats.led.uniforms.uFill.value = frame.led;
    mats.led.uniforms.uTime.value = t;
    mats.pad.uniforms.uOn.value = isR ? frame.touch : 0;
    mats.pad.uniforms.uTime.value = t;
    const c = isR ? frame.core : 0;
    mats.core.uniforms.uOn.value = c;
    mats.core.uniforms.uTime.value = t;
    mats.halo.opacity = c * 0.5;
    mats.pcb.emissiveIntensity = 0.2 + c * 2.5;
    const halo = groups.current.core?.children[1];
    if (halo) halo.rotation.set(t * 0.3, t * 0.5, 0);
  });

  const reg = (k: keyof typeof TRAVEL) => (o: THREE.Group | null) => {
    groups.current[k] = o;
  };
  const R90: [number, number, number] = [Math.PI / 2, 0, 0];

  return (
    <group ref={root} scale={[isR ? -1 : 1, 1, 1]}>
      {/* moulded shell + stem + light pipe + touch face */}
      <group ref={reg("shell")}>
        <mesh geometry={geo.shell} material={mats.shell} />
        <mesh geometry={geo.led} material={mats.led} />
        <mesh material={mats.pad} position={[0, 0.01, geo.touchZ]}>
          <circleGeometry args={[0.058, 64]} />
        </mesh>
        <Anchor name={`bud${side}-touch`} position={[0, 0.01, geo.touchZ + 0.01]} />
        <Anchor name={`bud${side}-stem`} position={geo.stemFront} />
      </group>

      <group scale={1}>
      <group ref={reg("pcb")}>
        <mesh geometry={parts.pcb} material={mats.pcb} rotation={R90} position={[0, -0.005, 0.07]} />
      </group>
      <group ref={reg("battery")}>
        <mesh geometry={parts.cell} material={mats.cell} rotation={R90} position={[0, -0.005, 0.035]} />
        <mesh geometry={parts.cellCap} material={mats.chrome} rotation={R90} position={[0, -0.005, 0.0615]} />
      </group>
      <group ref={reg("core")}>
        <mesh geometry={parts.core} material={mats.core} />
        <mesh geometry={parts.coreHalo} material={mats.halo} />
        <Anchor name={`bud${side}-core`} position={[0, 0, 0]} />
      </group>
      <group ref={reg("chassis")}>
        <mesh geometry={parts.chassis} material={mats.chrome} position={[0, -0.005, -0.02]} />
      </group>
      <group ref={reg("driver")}>
        <group position={[0, -0.005, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={parts.cone} material={mats.metal} />
          <mesh geometry={parts.surround} material={mats.dark} rotation={R90} position={[0, 0.006, 0]} />
          <mesh geometry={parts.basket} material={mats.chrome} position={[0, -0.004, 0]} />
          <mesh geometry={parts.magnet} material={mats.cell} position={[0, -0.03, 0]} />
        </group>
      </group>
      <group ref={reg("grille")}>
        <group position={[-0.045, -0.02, -0.16]} rotation={[0, Math.PI, 0]}>
          <mesh geometry={parts.grille} material={mats.grille} />
          <mesh geometry={parts.grilleRing} material={mats.chrome} />
        </group>
      </group>
      </group>
      <group ref={reg("tip")}>
        <mesh geometry={geo.tip} material={mats.tip} />
        <Anchor name={`bud${side}-tip`} position={[geo.tipCenter[0] - 0.01, geo.tipCenter[1], geo.tipCenter[2] - 0.08]} />
      </group>
      <Anchor name={`bud${side}-head`} position={[0, 0.17, 0]} />
    </group>
  );
}
