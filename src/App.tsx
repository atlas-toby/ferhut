import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AmbientProvider } from "@/context/AmbientContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScroll, smoothScrollTo } from "@/components/SmoothScroll";
import { PageLayoutTransition } from "@/components/PageLayoutTransition";
import { Navbar } from "@/components/Navbar";
import { Snowfall } from "@/components/Snowfall";
import { AmbientDock } from "@/components/AmbientDock";
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { CommandMenu } from "@/components/CommandMenu";
import { HallOfFameDialog } from "@/components/HallOfFameDialog";
import HomePage from "@/pages/HomePage";
import MuseumPage from "@/pages/MuseumPage";

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      smoothScrollTo(0, { immediate: true });
    }
  }, [location.pathname, location.hash]);

  return (
    <PageLayoutTransition routeKey={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/ferhatmuze" element={<MuseumPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </PageLayoutTransition>
  );
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250}>
        <AmbientProvider>
          <TransitionProvider>
            <SmoothScroll />
            <Snowfall />
            <Navbar />
            <AnimatedRoutes />
            <AmbientDock />
            <SupportChatWidget />
            <CommandMenu />
            <HallOfFameDialog />
            <Toaster
              theme={theme}
              position="bottom-left"
              toastOptions={{
                className:
                  "rounded-xl border border-border/80 bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-apple-md dark:shadow-apple-dark-md",
              }}
            />
          </TransitionProvider>
        </AmbientProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
