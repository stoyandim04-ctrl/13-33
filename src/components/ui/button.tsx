import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// The glowing RainbowButton is the one primary action per view. These are the
// rest: a filled lilac button for forms, an outline that lifts and glows on
// hover, quiet ghost and link styles.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-[0.9375rem] font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-500 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-0 active:scale-[0.98] active:duration-150",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-foreground font-semibold hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_var(--color-primary)]",
        outline:
          "border border-foreground/25 text-foreground hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_14px_40px_-12px_var(--color-primary)]",
        ghost: "text-muted-foreground hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
