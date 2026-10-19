"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { Anchor } from "./Anchor";
import { bodyMaterial, darkMatte, glowMaterial, metalMaterial } from "./materials";

/**
 * NOCTA One earbud. PHASE 1 STAND-IN: simple capsules, but already split into
 * the parts the exploded view needs, each on its own group so the real
 * geometry can drop in without touching the choreography.
 *
 * Local frame: origin = centre of the head, stem hangs down -Y, the ear tip
 * points -Z, the outer (touch) face looks +Z. The explode axis is Z.
 */

type Side = "L" | "R";

export function Earbud({ side }: { side: Side }) {
  const root = useRef<THREE.Group>(null);
  const parts = useRef<Record<string, THREE.Object3D | null>>({});
  const mats = useMemo(
    () => ({
      body: bodyMaterial(),
      inner: bodyMaterial("#082C50"),
      metal: metalMaterial(),
      dark: darkMatte(),
      led: glowMaterial(),
      touch: glowMaterial(),
      core: glowMaterial("#EAF8FF"),
      tip: new THREE.MeshPhysicalMaterial({ color: "#0A2E52", roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color("#1E7BFF") }),
    }),
    [],
  );

  const isR = side === "R";
  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const p = isR ? frame.budRPos : frame.budLPos;
    const r = isR ? frame.budRRot : frame.budLRot;
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(r[0], r[1], r[2]);

    // only the right bud opens up
    const e = isR ? frame.explode : 0;
    const set = (k: string, z: number) => {
      const o = parts.current[k];
      if (o) o.position.z = z * e;
    };
    set("outer", 0.62);
    set("inner", 0.34);
    set("grille", -0.12);
    set("d1", -0.24);
    set("d2", -0.34);
    set("d3", -0.44);
    set("battery", 0.16);
    set("tip", -0.7);
    const inner = parts.current.inner;
    if (inner) inner.visible = e > 0.01;

    // LED lights bottom-up
    const led = parts.current.led as THREE.Mesh | null;
    if (led) {
      const l = frame.led;
      led.scale.y = Math.max(0.001, l);
      led.position.y = -0.78 + 0.28 * l;
      mats.led.opacity = 0.35 + 0.65 * l;
    }
    const t = frame.touch;
    mats.touch.opacity = 0.08 + 0.9 * t;
    const c = isR ? frame.core : 0;
    mats.core.color.setRGB(0.92 * (1 + c * 3), 0.97 * (1 + c * 3), 1 * (1 + c * 3));
    const core = parts.current.core;
    if (core) core.visible = c > 0.01 || e > 0.05;
  });

  const reg = (k: string) => (o: THREE.Object3D | null) => {
    parts.current[k] = o;
  };

  return (
    <group ref={root} scale={[isR ? -1 : 1, 1, 1]}>
      {/* outer shell + stem travel together */}
      <group ref={reg("outer")}>
        <mesh material={mats.body} scale={[1, 0.92, 0.82]} castShadow>
          <sphereGeometry args={[0.22, 48, 32]} />
        </mesh>
        <mesh material={mats.body} position={[0.03, -0.42, 0.05]} rotation={[0.08, 0, 0.06]}>
          <capsuleGeometry args={[0.065, 0.52, 8, 24]} />
        </mesh>
        <mesh ref={reg("led") as never} material={mats.led} position={[0.03, -0.5, 0.115]}>
          <boxGeometry args={[0.018, 0.56, 0.01]} />
        </mesh>
        <mesh material={mats.touch} position={[0, 0.02, 0.182]}>
          <circleGeometry args={[0.07, 48]} />
        </mesh>
        <Anchor name={`bud${side}-touch`} position={[0, 0.02, 0.19]} />
        <Anchor name={`bud${side}-stem`} position={[0.03, -0.55, 0.07]} />
      </group>
      <group ref={reg("inner")}>
        <mesh material={mats.inner} scale={[0.85, 0.8, 0.5]}>
          <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      <group ref={reg("battery")}>
        <mesh material={mats.dark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 24]} />
        </mesh>
      </group>
      <group ref={reg("core")}>
        <mesh material={mats.core}>
          <sphereGeometry args={[0.055, 24, 16]} />
        </mesh>
        <Anchor name={`bud${side}-core`} position={[0, 0, 0]} />
      </group>
      <group ref={reg("grille")}>
        <mesh material={mats.metal} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.12, 0.12, 0.01, 32]} />
        </mesh>
      </group>
      {(["d1", "d2", "d3"] as const).map((k, i) => (
        <group key={k} ref={reg(k)}>
          <mesh material={mats.metal} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12 - i * 0.02]}>
            <cylinderGeometry args={[0.13 - i * 0.02, 0.13 - i * 0.02, 0.012, 40]} />
          </mesh>
        </group>
      ))}
      <group ref={reg("tip")}>
        <mesh material={mats.tip} position={[-0.04, -0.01, -0.2]} scale={[1, 1, 0.8]}>
          <sphereGeometry args={[0.1, 32, 16]} />
        </mesh>
        <Anchor name={`bud${side}-tip`} position={[-0.05, -0.02, -0.28]} />
      </group>
      <Anchor name={`bud${side}-head`} position={[0, 0.16, 0]} />
    </group>
  );
}
