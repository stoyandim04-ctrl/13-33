import * as React from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

// The primary action everywhere: the founder's rainbow button. A rotating
// white streak behind a translucent pill (styles in index.css: .rainbow).
// One per view.

const SIZE = {
  default: "px-7 py-3 text-[0.9375rem]",
  sm: "px-5 py-2 text-sm",
  lg: "px-8 py-3.5 text-base",
} as const;

type Size = keyof typeof SIZE;

export function RainbowLink({
  to,
  size = "default",
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, "to"> & { to: string; size?: Size }) {
  const external = /^https?:\/\//.test(to);
  const inner = <span className={SIZE[size]}>{children}</span>;
  if (external || to.startsWith("#")) {
    return (
      <a
        href={to}
        className={cn("rainbow", className)}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={cn("rainbow", className)} {...props}>
      {inner}
    </Link>
  );
}

export const RainbowButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size }
>(({ size = "default", className, children, type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={cn("rainbow disabled:opacity-40 disabled:pointer-events-none", className)} {...props}>
    <span className={SIZE[size]}>{children}</span>
  </button>
));
RainbowButton.displayName = "RainbowButton";
