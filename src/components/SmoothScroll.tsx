import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function SmoothScroll() {
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
      infinite: false,
    });

    window.__lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      if (window.__lenis === lenis) {
        delete window.__lenis;
      }
    };
  }, []);

  return null;
}

export function smoothScrollTo(
  target: number | HTMLElement | string,
  options?: { immediate?: boolean; offset?: number }
) {
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, {
      immediate: options?.immediate ?? false,
      offset: options?.offset ?? 0,
    });
    return;
  }

  if (typeof target === "number") {
    window.scrollTo({
      top: target,
      behavior: options?.immediate ? "auto" : "smooth",
    });
  } else if (typeof target === "string") {
    const el = document.querySelector(target);
    el?.scrollIntoView({
      behavior: options?.immediate ? "auto" : "smooth",
      block: "start",
    });
  } else {
    target.scrollIntoView({
      behavior: options?.immediate ? "auto" : "smooth",
      block: "start",
    });
  }
}
