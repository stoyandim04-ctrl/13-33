import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/**
 * The flacon, shared by the particle morph (scene II) and the 3D bottle
 * (scene IV): a lathe profile for the glass and a faceted cap. Units: the
 * whole bottle is ~3.2 tall, centred on the origin.
 */
export const BODY_PROFILE: [number, number][] = [
  [0.0, -1.6],
  [0.62, -1.6],
  [0.74, -1.54],
  [0.78, -1.4],
  [0.78, 0.18],
  [0.74, 0.36],
  [0.6, 0.48],
  [0.32, 0.56],
  [0.2, 0.6],
  [0.2, 0.78],
];

export const CAP = { radius: 0.34, height: 0.72, y: 1.14, facets: 8 };

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
