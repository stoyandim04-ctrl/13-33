"use client";

import { useEffect, useRef } from "react";
import type { Object3D } from "three";

/** 3D points the HUD can attach labels to, by name. */
export const anchorObjects = new Map<string, Object3D>();

export function Anchor({ name, position }: { name: string; position: [number, number, number] }) {
  const ref = useRef<Object3D>(null);
  useEffect(() => {
    const o = ref.current;
    if (!o) return;
    anchorObjects.set(name, o);
    return () => {
      if (anchorObjects.get(name) === o) anchorObjects.delete(name);
    };
  }, [name]);
  return <object3D ref={ref} position={position} />;
}
