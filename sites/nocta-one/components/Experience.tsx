"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type BloomEffect } from "postprocessing";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { anchors, live, setUI, type Tier } from "@/lib/store";
import { frame, sample } from "@/lib/timeline";
import { anchorObjects } from "./three/Anchor";
import { Case } from "./three/Case";
import { Earbud } from "./three/Earbud";
import { Particles } from "./three/Particles";
import { RippleRings } from "./three/RippleRings";
import { WireGrid } from "./three/WireGrid";

const TIER = {
  low: { dpr: 1.25, particles: 1500, ca: false },
  mid: { dpr: 1.5, particles: 3000, ca: true },
  high: { dpr: 2, particles: 6000, ca: true },
} satisfies Record<Tier, unknown>;

/* ------------------------------------------------------------------ rig -- */

const tmpV = new THREE.Vector3();
const tmpT = new THREE.Vector3();

/** Samples the timeline once per frame and drives the camera. Runs first. */
function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame((state) => {
    sample(live.progress);

    const portrait = size.height > size.width;
    live.portrait = portrait;

    // camera position: on phones pull back so the whole product fits the tall frame
    tmpT.set(...frame.camTarget);
    tmpV.set(...frame.camPos);
    if (portrait) {
      const aspect = size.width / size.height;
      const k = THREE.MathUtils.clamp(1.0 / aspect, 1, 2.1) * 0.78;
      tmpV.sub(tmpT).multiplyScalar(k).add(tmpT);
    }
    // a whisper of mouse parallax
    tmpV.x += live.pointer.x * 0.06;
    tmpV.y += live.pointer.y * 0.04;

    // shake (never with reduced motion)
    const s = live.reduced ? 0 : frame.shake;
    if (s > 0.001) {
      const t = state.clock.elapsedTime * 60;
      tmpV.x += (Math.sin(t * 1.3) + Math.sin(t * 2.9)) * 0.006 * s;
      tmpV.y += (Math.cos(t * 1.7) + Math.sin(t * 3.7)) * 0.006 * s;
    }

    camera.position.copy(tmpV);
    camera.up.set(Math.sin(frame.camRoll), Math.cos(frame.camRoll), 0);
    camera.lookAt(tmpT);
    if (camera.fov !== frame.camFov) camera.fov = frame.camFov;

    // framing: push the subject right on desktop, down on phones
    const W = size.width;
    const H = size.height;
    const fx = portrait ? 0 : frame.frameX;
    const fy = portrait ? -0.1 : 0;
    camera.setViewOffset(W, H, -fx * W, fy * H, W, H);
    camera.updateProjectionMatrix();
  }, -2);

  return null;
}

/** The whole product, swaying gently while idle in the hero. */
function Product() {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const o = g.current;
    if (!o) return;
    const t = state.clock.elapsedTime;
    const k = frame.idle * (live.reduced ? 0.4 : 1);
    o.rotation.set(Math.sin(t * 0.5) * 0.035 * k, Math.sin(t * 0.37) * 0.05 * k, Math.cos(t * 0.43) * 0.03 * k);
    o.position.y = Math.sin(t * 0.8) * 0.025 * k;
  });
  return (
    <group ref={g}>
      <Case />
      <Earbud side="L" />
      <Earbud side="R" />
    </group>
  );
}

/** Projects the named 3D anchors to screen pixels for the HUD. */
function AnchorProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = new THREE.Vector3();
  useFrame(() => {
    anchorObjects.forEach((o, name) => {
      o.getWorldPosition(v);
      v.project(camera);
      const a = (anchors[name] ??= { x: 0, y: 0, visible: false });
      a.x = (v.x * 0.5 + 0.5) * size.width;
      a.y = (-v.y * 0.5 + 0.5) * size.height;
      a.visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    });
  });
  return null;
}

function Effects({ tier }: { tier: Tier }) {
  const bloom = useRef<BloomEffect>(null);
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = frame.bloom;
  });
  const t = TIER[tier];
  return (
    <EffectComposer multisampling={tier === "high" ? 4 : 0}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.8} radius={0.75} />
      {t.ca ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0004)}
          radialModulation
          modulationOffset={0.35}
        />
      ) : (
        <></>
      )}
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      <Vignette offset={0.25} darkness={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

function Studio() {
  // dark studio: two long cyan strips and one warm softbox
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#02040A"]} />
      <Lightformer form="rect" intensity={6} color="#4FE3FF" position={[-4, 1.5, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 0.25, 1]} />
      <Lightformer form="rect" intensity={4} color="#1E7BFF" position={[4, -1, 1.5]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 0.2, 1]} />
      <Lightformer form="rect" intensity={2.2} color="#FFF3E6" position={[0, 4, 3]} rotation={[-Math.PI / 2.4, 0, 0]} scale={[4, 3, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#4FE3FF" position={[0, 0, -5]} scale={3} />
    </Environment>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1E7BFF" />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#EAF8FF" />
      <pointLight position={[-3, 1, 2]} intensity={6} distance={10} color="#4FE3FF" />
      <pointLight position={[2.5, -1.5, -1]} intensity={8} distance={8} color="#1E7BFF" />
    </>
  );
}

/** Stop rendering while the tab is hidden. */
function useVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

/** Tells the preloader once a few real frames have been drawn. */
function Ready() {
  const n = useRef(0);
  useFrame(() => {
    if (++n.current === 6) setUI({ loaded: true });
  });
  return null;
}

export default function Experience() {
  const [tier, setTier] = useState<Tier | null>(null);
  const visible = useVisible();

  useEffect(() => {
    let alive = true;
    import("detect-gpu")
      .then(({ getGPUTier }) => getGPUTier())
      .then((r) => {
        const t: Tier = r.isMobile ? "low" : r.tier >= 3 ? "high" : r.tier === 2 ? "mid" : "low";
        if (alive) setTier(t);
      })
      .catch(() => alive && setTier("mid"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (tier) live.tier = tier;
  }, [tier]);

  if (!tier) return null;
  const t = TIER[tier];

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, t.dpr]}
      frameloop={visible ? "always" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ fov: 30, near: 0.05, far: 80, position: [1.55, 1.25, 5.1] }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor("#03060D");
      }}
    >
      <color attach="background" args={["#03060D"]} />
      <fog attach="fog" args={["#03060D", 14, 34]} />
      <Rig />
      <Studio />
      <Lights />
      <RippleRings />
      <WireGrid />
      <Particles count={t.particles} />
      <Product />
      <AnchorProjector />
      <Effects tier={tier} />
      <Ready />
    </Canvas>
  );
}
