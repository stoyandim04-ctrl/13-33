import { lazy, Suspense, type ComponentType } from "react";

/** next/dynamic stand-in for the single-file preview build */
export default function dynamic<P extends object>(load: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>) {
  const L = lazy(async () => {
    const m = await load();
    return "default" in m ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> };
  });
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <L {...props} />
      </Suspense>
    );
  };
}
