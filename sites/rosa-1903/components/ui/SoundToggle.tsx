"use client";

import { useEffect, useState } from "react";
import { onSound, setSound, soundOn } from "@/lib/sound";

export default function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(soundOn());
    return onSound(setOn);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSound(!on)}
      data-cursor={on ? "Тишина" : "Слушай"}
      aria-pressed={on}
      className="label group flex items-center gap-3 text-petal/70 transition-colors duration-700 hover:text-petal"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0.5, 1, 0.7, 0.35].map((h, i) => (
          <span
            key={i}
            className="w-px origin-bottom bg-current transition-transform duration-700"
            style={{
              height: "100%",
              transform: `scaleY(${on ? h : 0.15})`,
              animation: on ? `bars 1.${4 + i}s ease-in-out ${i * 0.15}s infinite alternate` : "none",
            }}
          />
        ))}
      </span>
      Звук
    </button>
  );
}
