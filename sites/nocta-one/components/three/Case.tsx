"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { Anchor } from "./Anchor";
import { darkMatte, glowMaterial } from "./materials";

/**
 * Glass case: a soft pill-box, lid on a hinge at the back. PHASE 1 STAND-IN
 * geometry. `caseBuild` draws it bottom-up with a clipping plane.
 */

const W = 1.72;
const D = 0.98;
const BASE_H = 0.62;
const LID_H = 0.34;

export function Case() {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 10), []);

  const mats = useMemo(() => {
    const glass = new THREE.MeshPhysicalMaterial({
      // frosted, smoked glass: reads as a premium shell instead of a blue block
      color: "#E8F4FF",
      transmission: 1,
      thickness: 0.32,
      roughness: 0.22,
      ior: 1.5,
      attenuationColor: new THREE.Color("#B8DCFF"),
      attenuationDistance: 4,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 0.25,
      iridescenceIOR: 1.3,
      specularIntensity: 1,
      envMapIntensity: 1.6,
      clippingPlanes: [clip],
    });
    const tray = darkMatte();
    tray.clippingPlanes = [clip];
    const seam = glowMaterial();
    seam.clippingPlanes = [clip];
    return { glass, tray, seam };
  }, [clip]);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const b = frame.caseBuild;
    g.visible = b > 0.001;
    const p = frame.casePos;
    const r = frame.caseRot;
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(r[0], r[1], r[2]);
    // keep points with y below the cut; above 1.0 nothing is cut
    clip.constant = b >= 0.999 ? 100 : THREE.MathUtils.lerp(-0.6, 1.4, b) + p[1];
    mats.seam.opacity = 0.6 + 0.4 * Math.sin(performance.now() * 0.002);
    if (lid.current) lid.current.rotation.x = -frame.caseLid;
  });

  return (
    <group ref={root}>
      {/* base */}
      <RoundedBox args={[W, BASE_H, D]} radius={0.28} smoothness={8} position={[0, -BASE_H / 2, 0]} material={mats.glass} />
      {/* tray with two slots */}
      <mesh material={mats.tray} position={[0, -0.07, 0]}>
        <boxGeometry args={[W - 0.24, 0.12, D - 0.24]} />
      </mesh>
      {/* the thin light seam on the rim */}
      <mesh material={mats.seam} position={[0, 0.0, D / 2 - 0.005]}>
        <boxGeometry args={[W * 0.5, 0.012, 0.01]} />
      </mesh>
      {/* lid hinged on the back edge */}
      <group ref={lid} position={[0, 0, -D / 2 + 0.02]}>
        <RoundedBox args={[W, LID_H, D]} radius={0.17} smoothness={8} position={[0, LID_H / 2, D / 2 - 0.02]} material={mats.glass} />
      </group>
      <Anchor name="case-top" position={[0.6, 0.35, 0.3]} />
    </group>
  );
}
