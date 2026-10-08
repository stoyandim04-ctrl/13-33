import * as React from "react";

/** Subscribes to a media query. Starts from the live value on the client, so a
    first paint never animates something the reader asked not to see move. */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

/** Phones and touch-first tablets get the lighter scene and touch tuning. */
export const useCoarseDevice = () =>
  useMediaQuery("(max-width: 767px), (pointer: coarse)");
