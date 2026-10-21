import * as React from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { Gallery } from "@/components/gallery/gallery";

// The home page is one scroll story: the 3D gallery of our sites
// (components/gallery). Without WebGL, on a slow device or with reduced
// motion it is the same story as plain cards (gallery-lite.tsx).
export default function Home() {
  const { hash, key } = useLocation();
  const [mode, setMode] = React.useState<"3d" | "lite" | null>(null);

  // Smooth wheel scrolling while the scene runs (touch stays native).
  React.useEffect(() => {
    if (mode !== "3d") return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true });
    return () => lenis.destroy();
  }, [mode]);

  // Arriving from another page with a hash ("/#proekti"): jump once the
  // gallery exists.
  React.useEffect(() => {
    if (!hash || !mode) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    const id = requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto" }));
    return () => cancelAnimationFrame(id);
  }, [hash, key, mode]);

  React.useEffect(() => {
    document.title = "13:33 — Digital Studio";
  }, []);

  return <Gallery onMode={setMode} />;
}
