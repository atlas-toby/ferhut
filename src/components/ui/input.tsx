import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-card/85 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 ease-out hover:border-foreground/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = "Input";
