import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export const ScrollBar = forwardRef<
  ElementRef<typeof RadixScrollArea.ScrollAreaScrollbar>,
  ComponentPropsWithoutRef<typeof RadixScrollArea.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...rest }, ref) => (
  <RadixScrollArea.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-[2px]",
      orientation === "horizontal" && "h-2 flex-col border-t border-t-transparent p-[2px]",
      className
    )}
    {...rest}
  >
    <RadixScrollArea.ScrollAreaThumb className="relative flex-1 rounded-full bg-foreground/15 transition-colors hover:bg-foreground/30" />
  </RadixScrollArea.ScrollAreaScrollbar>
));
ScrollBar.displayName = "ScrollBar";

export const ScrollArea = forwardRef<
  ElementRef<typeof RadixScrollArea.Root>,
  ComponentPropsWithoutRef<typeof RadixScrollArea.Root>
>(({ className, children, ...rest }, ref) => (
  <RadixScrollArea.Root
    ref={ref}
    data-lenis-prevent=""
    className={cn("relative overflow-hidden", className)}
    {...rest}
  >
    <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </RadixScrollArea.Viewport>
    <ScrollBar />
    <RadixScrollArea.Corner />
  </RadixScrollArea.Root>
));
ScrollArea.displayName = "ScrollArea";
