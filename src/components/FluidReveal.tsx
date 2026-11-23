import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FluidRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
  y?: number;
}

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FluidReveal({
  children,
  className,
  delay = 0,
  immediate = false,
  y = 16,
}: FluidRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  if (immediate) {
    return (
      <motion.div
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay, ease: APPLE_EASE }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, delay, ease: APPLE_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
