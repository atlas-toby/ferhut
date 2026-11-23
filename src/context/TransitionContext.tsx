import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { animate } from "framer-motion";
import { smoothScrollTo } from "@/components/SmoothScroll";

interface TransitionContextValue {
  navigateWithTransition: (to: string, label?: string) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

function resolveRouteTitle(path: string, customLabel?: string): string {
  if (customLabel) return customLabel;
  const cleanPath = path.split("?")[0].split("#")[0];
  if (cleanPath === "/ferhatmuze") return "Ferhat'ın Müzesi";
  if (cleanPath === "/" || cleanPath === "") return "Ana Sayfa";
  return "Ferhat Kargo";
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState("Ferhat Kargo");

  const screenRef = useRef<HTMLDivElement | null>(null);
  const topCurveRef = useRef<HTMLDivElement | null>(null);
  const bottomCurveRef = useRef<HTMLDivElement | null>(null);
  const wordsRef = useRef<HTMLDivElement | null>(null);
  const activeRunRef = useRef(false);

  const navigateWithTransition = useCallback(
    (to: string, customLabel?: string) => {
      const [pathAndSearch, hashPart] = to.split("#");
      const [targetPathname] = pathAndSearch.split("?");
      const normalizedTarget = targetPathname || "/";
      const currentPathname = location.pathname || "/";

      // Same page navigation (e.g. hash scroll or query change) — no curtain wipe
      if (normalizedTarget === currentPathname) {
        navigate(to);
        if (hashPart) {
          window.setTimeout(() => {
            smoothScrollTo(`#${hashPart}`, { offset: -72 });
          }, 40);
        } else if (!pathAndSearch.includes("?")) {
          smoothScrollTo(0);
        }
        return;
      }

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced || activeRunRef.current) {
        navigate(to);
        smoothScrollTo(0, { immediate: true });
        return;
      }

      const screenEl = screenRef.current;
      const topCurveEl = topCurveRef.current;
      const bottomCurveEl = bottomCurveRef.current;
      const wordsEl = wordsRef.current;

      if (!screenEl || !topCurveEl || !bottomCurveEl || !wordsEl) {
        navigate(to);
        return;
      }

      activeRunRef.current = true;
      setIsTransitioning(true);
      setTransitionTitle(resolveRouteTitle(to, customLabel));

      const runTimeline = async () => {
        try {
          // Reset curtain strictly below viewport (matches ferhatkargo.netlify.app)
          screenEl.style.transform = "translate3d(0, 100%, 0)";
          topCurveEl.style.height = "0vh";
          bottomCurveEl.style.height = "10vh";
          wordsEl.style.opacity = "0";
          wordsEl.style.transform = "translate3d(-50%, calc(-50% + 76px), 0) scale(0.96)";
          document.documentElement.style.cursor = "wait";

          // Continuous kinetic upward glide for the title text so it NEVER stands still
          const continuousWords = animate(
            wordsEl,
            {
              opacity: [0, 0, 1, 1, 0],
              transform: [
                "translate3d(-50%, calc(-50% + 76px), 0) scale(0.96)",
                "translate3d(-50%, calc(-50% + 52px), 0) scale(0.98)",
                "translate3d(-50%, calc(-50% + 8px), 0) scale(1)",
                "translate3d(-50%, calc(-50% - 14px), 0) scale(1.015)",
                "translate3d(-50%, calc(-50% - 88px), 0) scale(0.99)",
              ],
            },
            {
              duration: 1.24,
              times: [0, 0.16, 0.42, 0.68, 1],
              ease: "easeInOut",
            }
          );

          // Phase 1: Curtain rises smoothly from bottom with curved top arch
          const inScreen = animate(
            screenEl,
            { transform: ["translate3d(0, 100%, 0)", "translate3d(0, 0%, 0)"] },
            { duration: 0.48, ease: [0.76, 0, 0.24, 1] }
          );
          const inTopCurve = animate(
            topCurveEl,
            { height: ["0vh", "10vh", "0vh"] },
            { duration: 0.5, times: [0, 0.55, 1], ease: [0.76, 0, 0.24, 1] }
          );

          await Promise.all([inScreen.finished, inTopCurve.finished]);

          // Screen is 100% covered — swap route & reset scroll cleanly underneath
          navigate(to);
          if (!hashPart) {
            smoothScrollTo(0, { immediate: true });
          }

          // Brief fluid beat while kinetic title glides smoothly upward through center
          await new Promise((resolve) => window.setTimeout(resolve, 110));

          if (hashPart) {
            smoothScrollTo(`#${hashPart}`, { immediate: true, offset: -72 });
          }

          // Phase 2: Curtain sweeps upward off-screen while bottom arch flattens
          const outScreen = animate(
            screenEl,
            {
              transform: ["translate3d(0, 0%, 0)", "translate3d(0, -100%, 0)"],
            },
            { duration: 0.7, ease: [0.76, 0, 0.24, 1] }
          );
          const outBottomCurve = animate(
            bottomCurveEl,
            { height: ["10vh", "0vh"] },
            { duration: 0.7, ease: [0.76, 0, 0.24, 1] }
          );

          await Promise.all([
            outScreen.finished,
            outBottomCurve.finished,
            continuousWords.finished,
          ]);
        } finally {
          document.documentElement.style.cursor = "";
          if (screenRef.current) {
            screenRef.current.style.transform = "translate3d(0, -100%, 0)";
          }
          if (topCurveRef.current) {
            topCurveRef.current.style.height = "0vh";
          }
          if (bottomCurveRef.current) {
            bottomCurveRef.current.style.height = "0vh";
          }
          activeRunRef.current = false;
          setIsTransitioning(false);
        }
      };

      void runTimeline();
    },
    [location.pathname, navigate]
  );

  return (
    <TransitionContext.Provider
      value={{ navigateWithTransition, isTransitioning }}
    >
      {children}

      {/* Curved Curtain Page Transition Overlay (dennissnellenberg / ferhatkargo style) */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] overflow-hidden bg-transparent ${
          isTransitioning ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          ref={screenRef}
          style={{ transform: "translate3d(0, -100%, 0)" }}
          className="relative h-full w-full bg-[#111114] text-[#F5F5F7] will-change-transform dark:bg-[#141418]"
        >
          {/* Top Curved Dome */}
          <div
            ref={topCurveRef}
            style={{ height: "0vh" }}
            className="absolute top-0 left-0 w-full -translate-y-[99%] -scale-y-100 overflow-hidden will-change-[height]"
          >
            <div className="absolute left-1/2 block h-[745%] w-[150%] -translate-x-1/2 -translate-y-[86.666%] rounded-[50%] bg-[#111114] dark:bg-[#141418]" />
          </div>

          {/* Continuously Gliding Kinetic Destination Label */}
          <div
            ref={wordsRef}
            style={{
              opacity: 0,
              transform: "translate3d(-50%, -50%, 0)",
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 flex items-center gap-3.5 whitespace-nowrap will-change-[opacity,transform]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.7)]" />
            <span className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#F5F5F7]">
              {transitionTitle}
            </span>
          </div>

          {/* Bottom Curved Dome */}
          <div
            ref={bottomCurveRef}
            style={{ height: "0vh" }}
            className="absolute bottom-0 left-0 w-full translate-y-[99%] overflow-hidden will-change-[height]"
          >
            <div className="absolute left-1/2 block h-[745%] w-[150%] -translate-x-1/2 -translate-y-[86.666%] rounded-[50%] bg-[#111114] dark:bg-[#141418]" />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

export function usePageTransition(): TransitionContextValue {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("usePageTransition must be used within TransitionProvider");
  }
  return ctx;
}
