"use client";

import { getGPUTier } from "detect-gpu";

export type Tier = { tier: 0 | 1 | 2 | 3; mobile: boolean };

let cached: Promise<Tier> | null = null;

/** The device class decides particle counts, effects and resolution. */
export function deviceTier(): Promise<Tier> {
  if (cached) return cached;
  const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const fallback: Tier = { tier: mobile ? 1 : 2, mobile };
  cached = Promise.race([
    getGPUTier()
      .then((r) => ({ tier: Math.max(0, Math.min(3, r.tier)) as Tier["tier"], mobile: r.isMobile ?? mobile }))
      .catch(() => fallback),
    new Promise<Tier>((res) => setTimeout(() => res(fallback), 2500)),
  ]);
  return cached;
}

export function petalCount({ tier, mobile }: Tier) {
  if (mobile) return tier >= 2 ? 8000 : 5000;
  return tier >= 3 ? 40000 : tier === 2 ? 24000 : 10000;
}

export function maxDpr({ tier, mobile }: Tier) {
  if (mobile) return Math.min(window.devicePixelRatio, 1.5);
  return Math.min(window.devicePixelRatio, tier >= 3 ? 2 : 1.5);
}
