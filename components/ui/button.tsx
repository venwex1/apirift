import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-signal text-ink-950 font-semibold hover:bg-signal/90 active:bg-signal/80 disabled:bg-signal/40",
  secondary:
    "bg-ink-800 text-fg border border-line hover:bg-ink-700 hover:border-line-strong active:bg-ink-600 disabled:opacity-50",
  ghost:
    "bg-transparent text-fg-muted hover:text-fg hover:bg-ink-800 active:bg-ink-700 disabled:opacity-50",
  danger:
    "bg-breach/10 text-breach border border-breach/30 hover:bg-breach/20 active:bg-breach/25 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", size = "md", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display transition-all duration-200 ease-needle disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
