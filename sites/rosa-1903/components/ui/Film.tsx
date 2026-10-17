"use client";

import { useEffect, useRef } from "react";

/** Constant film grain and vignette over everything. */
export default function Film() {
  const grain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const size = 160;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    grain.current!.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 45%, rgba(5,4,4,0.55) 80%, rgba(5,4,4,0.92) 100%)",
        }}
      />
      <div
        ref={grain}
        className="grain absolute -inset-[50%] opacity-[0.07] mix-blend-overlay"
        style={{ backgroundSize: "160px 160px" }}
      />
    </div>
  );
}
