import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/**
 * The flacon, shared by the particle morph (scene II) and the 3D bottle
 * (scene IV): a lathe profile for the glass and a faceted cap. Units: the
 * whole bottle is ~3.2 tall, centred on the origin.
 */
export const BODY_PROFILE: [number, number][] = [
  [0.0, -1.6],
  [0.66, -1.6],
  [0.76, -1.56],
  [0.8, -1.46],
  [0.8, 0.26],
  [0.78, 0.4],
  [0.66, 0.5],
  [0.3, 0.56],
  [0.19, 0.6],
  [0.19, 0.78],
];

export const CAP = { radius: 0.36, height: 0.78, y: 1.17, facets: 8 };

export function bodyGeometry(segments = 96) {
  return new THREE.LatheGeometry(
    BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

export function capGeometry() {
  const g = new THREE.CylinderGeometry(CAP.radius * 0.9, CAP.radius, CAP.height, CAP.facets, 1);
  g.translate(0, CAP.y, 0);
  return g;
}

/** The liquid: the inside of the glass, filled to `level`. */
export function liquidGeometry(level = 0.22, segments = 64) {
  const pts: THREE.Vector2[] = [];
  for (const [r, y] of BODY_PROFILE) {
    if (y > level) break;
    pts.push(new THREE.Vector2(Math.max(0, r * 0.9 - 0.02), y + 0.05));
  }
  const top = pts[pts.length - 1];
  pts.push(new THREE.Vector2(top.x, level), new THREE.Vector2(0, level));
  return new THREE.LatheGeometry(pts, segments);
}

/** The ground-glass stopper sitting in the neck. */
export function stopperGeometry() {
  const g = new THREE.CylinderGeometry(0.165, 0.15, 0.42, 24);
  g.translate(0, 0.74, 0);
  return g;
}

/** A label wrapped on the front of the body. */
export function labelGeometry() {
  const g = new THREE.CylinderGeometry(0.786, 0.786, 0.86, 48, 1, true, -0.62, 1.24);
  g.translate(0, -0.62, 0);
  return g;
}

/** `count` points spread over the bottle's surface, xyz packed. */
export function sampleBottle(count: number) {
  const body = new THREE.Mesh(bodyGeometry(64));
  const cap = new THREE.Mesh(capGeometry());
  const out = new Float32Array(count * 3);
  const capShare = 0.18;
  const nCap = Math.floor(count * capShare);
  const p = new THREE.Vector3();
  const sb = new MeshSurfaceSampler(body).build();
  const sc = new MeshSurfaceSampler(cap).build();
  for (let i = 0; i < count; i++) {
    (i < nCap ? sc : sb).sample(p);
    out[i * 3] = p.x;
    out[i * 3 + 1] = p.y;
    out[i * 3 + 2] = p.z;
  }
  body.geometry.dispose();
  cap.geometry.dispose();
  return out;
}
