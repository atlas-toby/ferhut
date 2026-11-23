import {
  forwardRef,
  useCallback,
  useRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface MagneticProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDrag"> {
  children: ReactNode;
  /** Pull factor relative to pointer distance from element center (0.1 - 0.45) */
  strength?: number;
  /** Maximum horizontal/vertical translation in pixels */
  maxOffset?: number;
  /** Disable magnetic physics explicitly */
  disabled?: boolean;
  /** Subtle scale down on press */
  pressScale?: number;
}

const MAGNETIC_SPRING = {
  stiffness: 280,
  damping: 20,
  mass: 0.45,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const Magnetic = forwardRef<HTMLDivElement, MagneticProps>(
  function Magnetic(
    {
      children,
      strength = 0.26,
      maxOffset = 7,
      disabled = false,
      pressScale = 0.97,
      className,
      onPointerMove,
      onPointerLeave,
      ...rest
    },
    forwardedRef
  ) {
    const prefersReduced = useReducedMotion();
    const internalRef = useRef<HTMLDivElement | null>(null);

    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, MAGNETIC_SPRING);
    const y = useSpring(rawY, MAGNETIC_SPRING);

    const setCombinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const handlePointerMove = useCallback(
      (e: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(e);
        if (disabled || prefersReduced || e.pointerType !== "mouse") return;
        const el = internalRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);

        rawX.set(clamp(relX * strength, -maxOffset, maxOffset));
        rawY.set(clamp(relY * strength, -maxOffset, maxOffset));
      },
      [disabled, prefersReduced, strength, maxOffset, rawX, rawY, onPointerMove]
    );

    const handlePointerLeave = useCallback(
      (e: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(e);
        rawX.set(0);
        rawY.set(0);
      },
      [rawX, rawY, onPointerLeave]
    );

    if (disabled || prefersReduced) {
      return (
        <div
          ref={setCombinedRef}
          className={cn("inline-flex", className)}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          {...rest}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={setCombinedRef}
        style={{ x, y }}
        whileTap={{ scale: pressScale }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn("inline-flex will-change-transform", className)}
        {...(rest as HTMLMotionProps<"div">)}
      >
        {children}
      </motion.div>
    );
  }
);
