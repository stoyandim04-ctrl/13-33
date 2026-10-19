"use client";

import { useEffect, useRef } from "react";

/**
 * A quiet, wide night pad made with Web Audio: two detuned low voices through
 * a slowly breathing low-pass, plus soft noise air. Off by default.
 */
export function useAmbient(on: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!on) {
      const c = ctx.current;
      const m = master.current;
      if (c && m) m.gain.setTargetAtTime(0, c.currentTime, 0.4);
      return;
    }
    if (!ctx.current) {
      const c = new AudioContext();
      const m = c.createGain();
      m.gain.value = 0;
      m.connect(c.destination);

      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 520;
      filter.Q.value = 0.7;
      filter.connect(m);

      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.06;
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      // D minor-ish open voicing
      [73.42, 110.0, 146.83, 220.0].forEach((f, i) => {
        for (const detune of [-7, 6]) {
          const o = c.createOscillator();
          o.type = i < 2 ? "sawtooth" : "triangle";
          o.frequency.value = f;
          o.detune.value = detune;
          const g = c.createGain();
          g.gain.value = i < 2 ? 0.05 : 0.035;
          const pan = c.createStereoPanner();
          pan.pan.value = detune < 0 ? -0.6 : 0.6;
          o.connect(g).connect(pan).connect(filter);
          o.start();
        }
      });

      // air
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const nf = c.createBiquadFilter();
      nf.type = "bandpass";
      nf.frequency.value = 1800;
      nf.Q.value = 0.4;
      const ng = c.createGain();
      ng.gain.value = 0.012;
      noise.connect(nf).connect(ng).connect(m);
      noise.start();

      ctx.current = c;
      master.current = m;
    }
    const c = ctx.current!;
    c.resume();
    master.current!.gain.setTargetAtTime(0.22, c.currentTime, 1.2);
  }, [on]);

  useEffect(() => () => void ctx.current?.close(), []);
}
