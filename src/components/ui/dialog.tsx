import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogPortal = RadixDialog.Portal;
export const DialogClose = RadixDialog.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof RadixDialog.Overlay>,
  ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...rest }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-md dark:bg-black/70 animate-dialog-overlay-in",
      className
    )}
    {...rest}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> & { hideClose?: boolean }
>(({ className, children, hideClose = false, ...rest }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <RadixDialog.Content
      ref={ref}
      data-lenis-prevent=""
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-3rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-apple-lg dark:shadow-apple-dark-lg animate-dialog-content-in focus:outline-none",
        className
      )}
      {...rest}
    >
      {children}
      {!hideClose && (
        <RadixDialog.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
          <X className="h-4 w-4" />
          <span className="sr-only">Kapat</span>
        </RadixDialog.Close>
      )}
    </RadixDialog.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...rest}
    />
  );
}

export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 pt-2", className)}
      {...rest}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof RadixDialog.Title>,
  ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...rest }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn("font-display text-lg font-semibold tracking-tight text-foreground", className)}
    {...rest}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof RadixDialog.Description>,
  ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...rest }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...rest}
  />
));
DialogDescription.displayName = "DialogDescription";
