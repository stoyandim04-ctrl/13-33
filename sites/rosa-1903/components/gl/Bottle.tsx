"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { bodyGeometry, capGeometry, labelGeometry, liquidGeometry, stopperGeometry } from "@/lib/bottle";
import { deviceTier, type Tier } from "@/lib/gpu";
import { filmClock } from "@/lib/film";

/**
 * The flacon in glass: transmission + IOR 1.5 + a hint of iridescence, a
 * rose-tinted liquid, a faceted rose-gold cap, a ground-glass stopper and a
 * paper label. The scene's timeline writes `state`; the bottle eases toward it.
 */
export type BottleState = {
  /** 0 = in darkness, only rims; 1 = fully lit */
  light: number;
  /** 0 = assembled, 1 = exploded view */
  explode: number;
  /** extra turns (1 = 360°) */
  spin: number;
  /** 0 … 1, a line of light crossing the glass */
  sweep: number;
  /** a short kick when the parts click home */
  shake: number;
  /** cross-fade between backdrops (0, 1, 2 …) */
  backdrop: number;
  /** vertical framing offset in world units */
  lift: number;
};

export const bottleState = (): BottleState => ({ light: 0, explode: 0, spin: 0, sweep: 0, shake: 0, backdrop: 0, lift: 0 });

const ease = (a: number, b: number, k: number) => a + (b - a) * k;

function labelTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 720;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efe4d6";
  g.fillRect(0, 0, c.width, c.height);
  // paper fibre
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(120,90,70,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 1 + Math.random() * 2, 1);
  }
  g.strokeStyle = "#b8733f";
  g.lineWidth = 3;
  g.strokeRect(40, 40, c.width - 80, c.height - 80);
  g.lineWidth = 1;
  g.strokeRect(56, 56, c.width - 112, c.height - 112);
  g.fillStyle = "#2a0e12";
  g.textAlign = "center";
  g.font = '300 132px "Cormorant Garamond", serif';
  g.fillText("РОЗА", c.width / 2, 300);
  g.font = 'italic 300 112px "Cormorant Garamond", serif';
  g.fillStyle = "#9c5f45";
  g.fillText("1903", c.width / 2, 420);
  g.font = '500 30px "Manrope Variable", sans-serif';
  g.fillStyle = "#2a0e12";
  // letter-spaced small caps
  const line = (t: string, y: number) => {
    const spaced = t.split("").join(String.fromCharCode(8202) + String.fromCharCode(8202));
    g.fillText(spaced, c.width / 2, y);
  };
  line("EXTRAIT DE PARFUM", 520);
  line("№ 01 · КАЗАНЛЪК", 580);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A full-frame image (or gradient) behind the glass, so it has something to refract. */
function Backdrop({ urls, state }: { urls: string[]; state: BottleState }) {
  const { camera, size } = useThree();
  const material = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const blank = new THREE.DataTexture(new Uint8Array([10, 9, 8, 255]), 1, 1);
    blank.needsUpdate = true;
    const tex = [0, 1, 2].map((i) => {
      if (!urls[i]) return blank;
      const t = loader.load(urls[i], (tt) => {
        m.uniforms[`uA${i}`].value = (tt.image as HTMLImageElement).width / (tt.image as HTMLImageElement).height;
      });
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });
    const m = new THREE.ShaderMaterial({
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uT0: { value: tex[0] },
        uT1: { value: tex[1] },
        uT2: { value: tex[2] },
        uA0: { value: 1 },
        uA1: { value: 1 },
        uA2: { value: 1 },
        uMix: { value: 0 },
        uAspect: { value: 1 },
        uDim: { value: 0.55 },
        uPlain: { value: urls.length ? 0 : 1 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform sampler2D uT0, uT1, uT2;
        uniform float uA0, uA1, uA2, uMix, uAspect, uDim, uPlain;
        varying vec2 vUv;
        vec2 cover(vec2 uv, float a) {
          vec2 s = uAspect > a ? vec2(1.0, a / uAspect) : vec2(uAspect / a, 1.0);
          return (uv - 0.5) * s + 0.5;
        }
        void main() {
          vec3 c0 = texture2D(uT0, cover(vUv, uA0)).rgb;
          vec3 c1 = texture2D(uT1, cover(vUv, uA1)).rgb;
          vec3 c2 = texture2D(uT2, cover(vUv, uA2)).rgb;
          vec3 c = mix(c0, c1, clamp(uMix, 0.0, 1.0));
          c = mix(c, c2, clamp(uMix - 1.0, 0.0, 1.0));
          // the plain backdrop: obsidian with a low rose glow
          float g = 1.0 - smoothstep(0.0, 0.75, distance(vUv, vec2(0.5, 0.42)));
          vec3 plain = vec3(0.022, 0.018, 0.016) + vec3(0.1, 0.045, 0.04) * g * g * g;
          c = mix(c * uDim, plain, uPlain);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join("|")]);

  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const dist = cam.position.z + 6;
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    mesh.current!.scale.set(h * (size.width / size.height), h, 1);
    mesh.current!.position.set(cam.position.x, cam.position.y, -6);
    material.uniforms.uAspect.value = size.width / size.height;
    // the scroll is already smoothed by Lenis; follow it directly
    material.uniforms.uMix.value = state.backdrop;
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

function Flacon({ state, tier, drag }: { state: BottleState; tier: Tier; drag: React.RefObject<{ v: number; x: number }> }) {
  const geo = useMemo(
    () => ({
      body: bodyGeometry(tier.mobile ? 64 : 128),
      cap: capGeometry(),
      liquid: liquidGeometry(-0.25),
      stopper: stopperGeometry(),
      label: labelGeometry(),
    }),
    [tier.mobile],
  );
  const label = useMemo(() => labelTexture(), []);
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      label.dispose();
    },
    [geo, label],
  );

  const root = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Mesh>(null);
  const stopper = useRef<THREE.Mesh>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const tag = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.SpotLight>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const now = useRef({ light: 0, explode: 0, spin: 0, shake: 0, lift: 0 });
  const tick = useMemo(() => filmClock(), []);
  const clock = useRef(0);

  useFrame(({ camera, size }, dt) => {
    const n = now.current;
    // portrait screens see less width: step back so the flacon keeps its air
    const aspect = size.width / size.height;
    const back = aspect < 0.9 ? Math.min(1.9, 0.95 / aspect) : 1;
    const step = tick(dt);
    clock.current += step;
    const k = 1 - Math.pow(0.001, step); // frame-rate independent ease
    n.light = ease(n.light, state.light, k);
    n.explode = ease(n.explode, state.explode, k);
    n.spin = ease(n.spin, state.spin, k);
    n.shake = ease(n.shake, state.shake, 0.5);
    n.lift = ease(n.lift, state.lift, k);
    const d = drag.current!;
    d.x += d.v;
    d.v *= 0.92;
    const t = clock.current;

    turn.current!.rotation.y = n.spin * Math.PI * 2 + d.x + Math.sin(t * 0.3) * 0.08;
    root.current!.position.y = -n.lift;
    root.current!.position.x = (Math.random() - 0.5) * n.shake * 0.06;

    const e = n.explode;
    cap.current!.position.y = e * 1.55;
    cap.current!.rotation.y = e * 0.6;
    stopper.current!.position.y = e * 0.85;
    liquid.current!.position.y = -e * 0.05;
    liquid.current!.scale.setScalar(1 - e * 0.04);
    tag.current!.position.set(0, -e * 0.55, e * 0.9);

    key.current!.intensity = 2 + n.light * 38;
    sweep.current!.position.x = -4 + state.sweep * 8;
    sweep.current!.intensity = Math.sin(Math.min(1, Math.max(0, state.sweep)) * Math.PI) * 30;

    camera.position.z = (9.6 - n.light * 1.2 + e * 3.2) * back;
    camera.position.y = e * 0.75;
    camera.lookAt(0, e * 0.75, 0);
  });

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        transmission: 1,
        thickness: 0.55,
        roughness: 0.04,
        ior: 1.5,
        iridescence: 0.18,
        iridescenceIOR: 1.3,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        attenuationColor: new THREE.Color("#fbf1ec"),
        attenuationDistance: 8,
        specularIntensity: 1,
        envMapIntensity: 1.2,
      }),
    [],
  );

  return (
    <group ref={root}>
      <ambientLight intensity={0.05} />
      {/* rims: the edges catch light first */}
      <directionalLight position={[-4, 2, -4]} intensity={3} color="#f2e6dc" />
      <directionalLight position={[4, 1, -4]} intensity={2.4} color="#c9917a" />
      <spotLight ref={key} position={[2.5, 5, 6]} angle={0.5} penumbra={1} intensity={2} color="#f2e6dc" />
      <pointLight ref={sweep} position={[-4, 0.5, 2.2]} distance={6} intensity={0} color="#fff3ea" />

      <group ref={turn}>
        <group scale={[1, 1, 0.58]}>
        <mesh geometry={geo.body} material={glass} />
        <mesh ref={liquid} geometry={geo.liquid}>
          <meshPhysicalMaterial color="#e7a6a2" roughness={0.1} transmission={0.85} thickness={1.2} ior={1.34} attenuationColor="#c9707a" attenuationDistance={1.2} />
        </mesh>
        <mesh ref={stopper} geometry={geo.stopper}>
          <meshPhysicalMaterial color="#f2e6dc" roughness={0.45} transmission={0.7} thickness={0.3} ior={1.5} />
        </mesh>
        <mesh ref={cap} geometry={geo.cap}>
          <meshStandardMaterial color="#e2ab92" metalness={1} roughness={0.18} flatShading envMapIntensity={2.2} />
        </mesh>
        <mesh ref={tag} geometry={geo.label}>
          <meshStandardMaterial map={label} roughness={0.85} />
        </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Bottle({
  state,
  active,
  backdrops = [],
  interactive = false,
}: {
  state: BottleState;
  active: boolean;
  backdrops?: string[];
  interactive?: boolean;
}) {
  const [tier, setTier] = useState<Tier | null>(null);
  const drag = useRef({ v: 0, x: 0 });
  const last = useRef(0);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    deviceTier().then(setTier);
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  if (!tier) return null;
  // drag-to-turn only with a mouse: on touch the finger belongs to the scroll
  const canDrag = interactive && fine;

  return (
    <div
      className="absolute inset-0"
      data-cursor={canDrag ? "Завърти" : undefined}
      style={{ pointerEvents: canDrag ? "auto" : "none" }}
      onPointerDown={(e) => {
        if (!canDrag) return;
        last.current = e.clientX;
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!canDrag || !e.buttons) return;
        drag.current.v = (e.clientX - last.current) * 0.004;
        last.current = e.clientX;
      }}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={tier.mobile ? [1, 1.25] : [1, tier.tier >= 3 ? 1.75 : 1.25]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 30, position: [0, 0, 9.6], near: 0.1, far: 40 }}
      >
        <Backdrop urls={backdrops} state={state} />
        <Environment resolution={tier.mobile ? 128 : 256} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#f2e6dc" position={[0, 3, -5]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#c9917a" position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#c9917a" position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[8, 0.6, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#b8733f" position={[0, -4, 3]} scale={3} />
        </Environment>
        <Flacon state={state} tier={tier} drag={drag} />
      </Canvas>
    </div>
  );
}
