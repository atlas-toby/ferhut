import { useLocation } from "react-router-dom";
import { ArrowUpRight, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAmbient } from "@/context/AmbientContext";
import { usePageTransition } from "@/context/TransitionContext";
import { Magnetic } from "@/components/Magnetic";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { setCommandOpen } = useAmbient();
  const { navigateWithTransition } = usePageTransition();

  const isMuseum = location.pathname === "/ferhatmuze";

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    to: string,
    label?: string
  ) => {
    e.preventDefault();
    navigateWithTransition(to, label);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-border/60 glass-header transition-colors duration-300">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-8 px-10">
        {/* Zone 1: Single-element clean Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, "/", "Ana Sayfa")}
          className="font-display text-[17px] font-semibold tracking-tight text-foreground transition-opacity duration-200 hover:opacity-75 whitespace-nowrap shrink-0"
        >
          Ferhat Kargo
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          className="flex items-center gap-8 text-sm font-medium"
          aria-label="Ana gezinme"
        >
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, "/", "Ana Sayfa")}
            className={`relative py-1 transition-colors duration-200 whitespace-nowrap shrink-0 ${
              !isMuseum
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ana Sayfa
            {!isMuseum && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-foreground/80" />
            )}
          </a>

          <a
            href="/#ozellikler"
            onClick={(e) =>
              handleLinkClick(e, "/#ozellikler", "Operasyon Standartları")
            }
            className="py-1 text-muted-foreground transition-colors duration-200 hover:text-foreground whitespace-nowrap shrink-0"
          >
            Standartlar
          </a>

          <a
            href="/ferhatmuze"
            onClick={(e) =>
              handleLinkClick(e, "/ferhatmuze", "Ferhat'ın Müzesi")
            }
            className={`relative py-1 transition-colors duration-200 whitespace-nowrap shrink-0 ${
              isMuseum
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ferhat'ın Müzesi
            {isMuseum && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-foreground/80" />
            )}
          </a>

          <a
            href="https://ferchat.vercel.app/chat.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 py-1 text-muted-foreground transition-colors duration-200 hover:text-foreground whitespace-nowrap shrink-0"
          >
            <span>Patlak Zeka AI</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </a>
        </nav>

        {/* Zone 3: Quick Command & Theme Action */}
        <div className="flex items-center gap-2 shrink-0">
          <Magnetic strength={0.22} maxOffset={5}>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex h-9 items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/55 px-3 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 whitespace-nowrap shrink-0"
              aria-label="Hızlı arama komut paletini aç"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Hızlı Gezin</span>
              <kbd className="ml-1 inline-flex items-center rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </Magnetic>

          <Tooltip>
            <Magnetic strength={0.28} maxOffset={5}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-secondary/55 text-muted-foreground transition-all duration-200 hover:border-foreground/20 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 shrink-0"
                  aria-label={
                    theme === "dark" ? "Açık moda geç" : "Karanlık moda geç"
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
            </Magnetic>
            <TooltipContent side="bottom">
              {theme === "dark" ? "Açık Mod" : "Karanlık Mod"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
