import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight whitespace-nowrap transition-colors duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        solid: "bg-accent text-accent-fg hover:bg-accent/90",
        muted: "bg-surface-2 text-fg hover:bg-border",
        ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-fg",
      },
      size: {
        md: "h-11 rounded-sm px-3.5 text-sm",
        icon: "size-11 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "muted",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
