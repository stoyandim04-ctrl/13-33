import * as THREE from "three";

/**
 * Matte deep-blue body with a cyan fresnel rim, the glowing edge that draws
 * the silhouette against the night. `uRim` is shared so the timeline can
 * brighten every rim at once.
 */
export const rimUniform = { value: 1 };

export function bodyMaterial(color = "#0B3A66") {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    sheen: 0.4,
    sheenColor: new THREE.Color("#4FE3FF"),
    sheenRoughness: 0.5,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = rimUniform;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uRim;\nvoid main() {")
      .replace(
        "#include <tonemapping_fragment>",
        /* glsl */ `
        {
          vec3 V = normalize(vViewPosition);
          float f = 1.0 - clamp(abs(dot(normalize(normal), V)), 0.0, 1.0);
          float rim = pow(f, 3.2);
          gl_FragColor.rgb += vec3(0.31, 0.89, 1.0) * rim * 0.9 * uRim;
        }
        #include <tonemapping_fragment>`,
      );
  };
  m.customProgramCacheKey = () => "nocta-body";
  return m;
}

export function glowMaterial(color = "#4FE3FF") {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true });
}

export function metalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#AFC4D6",
    metalness: 1,
    roughness: 0.25,
    anisotropy: 0.6,
    clearcoat: 0.2,
  });
}

export function darkMatte() {
  return new THREE.MeshStandardMaterial({ color: "#060C16", roughness: 0.85, metalness: 0.1 });
}
