import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),0_4px_14px_-2px_hsl(var(--primary)/0.38)] hover:bg-primary/90 hover:shadow-[0_2px_6px_rgba(0,0,0,0.14),0_8px_20px_-2px_hsl(var(--primary)/0.45)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-apple-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card/80 text-foreground shadow-apple-sm dark:shadow-apple-dark-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-[15px]",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...rest }, ref) => {
    const Element = asChild ? Slot : "button";
    return (
      <Element
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      />
    );
  }
);
Button.displayName = "Button";
