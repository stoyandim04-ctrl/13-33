"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createSequence, type Sequence } from "@/lib/sequence";
import { prefersReducedMotion } from "@/lib/film";

export type SeqHandle = { seek: (progress: number) => void };

/**
 * A canvas that shows frame `progress` of a scene's image sequence. Until
 * frames arrive (or with reduced motion) the poster underneath carries it.
 * Frames are only held while `near` is true (the scene is about to play).
 */
const SeqCanvas = forwardRef<SeqHandle, { scene: string; count: number; near: boolean; className?: string }>(
  function SeqCanvas({ scene, count, near, className = "" }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const seq = useRef<Sequence | null>(null);
    const progress = useRef(0);

    const paint = () => {
      const c = canvas.current;
      const s = seq.current;
      if (!c || !s) return;
      s.draw(c.getContext("2d")!, progress.current);
    };

    useImperativeHandle(ref, () => ({
      seek(p) {
        progress.current = p;
        paint();
      },
    }));

    useEffect(() => {
      if (!near || prefersReducedMotion()) return;
      const c = canvas.current!;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      const size = () => {
        c.width = Math.round(c.clientWidth * dpr);
        c.height = Math.round(c.clientHeight * dpr);
        seq.current?.reset();
        paint();
      };
      seq.current = createSequence(scene, count, mobile ? "m" : "d", () => {
        c.style.opacity = "1";
        paint();
      });
      size();
      window.addEventListener("resize", size);
      return () => {
        window.removeEventListener("resize", size);
        seq.current?.dispose();
        seq.current = null;
        c.style.opacity = "0";
        // release the canvas backing store too
        c.width = c.height = 1;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene, count, near]);

    return (
      <canvas
        ref={canvas}
        aria-hidden
        className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 ${className}`}
      />
    );
  },
);

export default SeqCanvas;
