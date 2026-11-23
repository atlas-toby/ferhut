import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface PageLayoutTransitionProps {
  routeKey: string;
  children: ReactNode;
}

const APPLE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PageLayoutTransition({
  routeKey,
  children,
}: PageLayoutTransitionProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div key={routeKey}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 12, scale: 0.994 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.996 }}
        transition={{
          duration: 0.42,
          ease: APPLE_CURVE,
        }}
        className="will-change-[opacity,transform]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
