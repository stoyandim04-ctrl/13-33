import * as React from "react";

import { MARK_ASPECT, MARK_BLUE, MARK_CYAN, MARK_PATH } from "@/components/brand/logo-geometry";

export function LogoMark({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${MARK_ASPECT.toFixed(4)} 1`} aria-hidden="true" className={className} {...props}>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={MARK_BLUE} />
          <stop offset="1" stopColor={MARK_CYAN} />
        </linearGradient>
      </defs>
      <path d={MARK_PATH} fill={`url(#${id})`} />
    </svg>
  );
}
