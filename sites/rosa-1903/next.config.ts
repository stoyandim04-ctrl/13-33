import type { NextConfig } from "next";

const config: NextConfig = {
  // the repo root has its own lockfile; this app is self-contained
  turbopack: { root: __dirname },
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default config;
