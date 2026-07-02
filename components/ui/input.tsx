import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-ink-800 px-3 text-sm text-fg placeholder:text-fg-faint",
          "transition-colors duration-200 ease-needle hover:border-line-strong",
          "focus:border-signal/50 focus:outline-none disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-line bg-ink-800 p-3 font-mono text-sm text-fg placeholder:text-fg-faint",
        "transition-colors duration-200 ease-needle hover:border-line-strong",
        "focus:border-signal/50 focus:outline-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
