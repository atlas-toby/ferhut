import { useEffect, useRef } from "react";
import { RotateCcw, Snowflake, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useAmbient } from "@/context/AmbientContext";
import { Magnetic } from "@/components/Magnetic";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export function AmbientDock() {
  const {
    audioPlaying,
    toggleAudio,
    getAudioLevels,
    snowEnabled,
    toggleSnow,
    clearSnow,
  } = useAmbient();

  const bar1Ref = useRef<HTMLSpanElement | null>(null);
  const bar2Ref = useRef<HTMLSpanElement | null>(null);
  const bar3Ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!audioPlaying) return;
    let rafId = 0;
    const tick = () => {
      const [low, mid, high] = getAudioLevels();
      if (bar1Ref.current) bar1Ref.current.style.height = `${(low * 100).toFixed(1)}%`;
      if (bar2Ref.current) bar2Ref.current.style.height = `${(mid * 100).toFixed(1)}%`;
      if (bar3Ref.current) bar3Ref.current.style.height = `${(high * 100).toFixed(1)}%`;
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [audioPlaying, getAudioLevels]);

  const handleClearSnow = () => {
    clearSnow();
    toast("Biriken kar temizlendi");
  };

  return (
    <div
      className="fixed bottom-5 right-6 z-40 flex items-center gap-1 rounded-2xl border border-border/80 px-2 py-1.5 glass-dock shadow-apple-md dark:shadow-apple-dark-md transition-all duration-300"
      role="region"
      aria-label="Ortam kontrolleri"
    >
      <Tooltip>
        <Magnetic strength={0.28} maxOffset={6}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleAudio}
              className="inline-flex h-8 items-center gap-2 rounded-xl px-2.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 whitespace-nowrap shrink-0"
              aria-label={audioPlaying ? "Müziği duraklat" : "Müziği oynat"}
            >
              {audioPlaying ? (
                <Volume2 className="h-3.5 w-3.5 text-primary" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>{audioPlaying ? "Çalıyor" : "Ses Kapalı"}</span>
              {audioPlaying && (
                <span
                  className="flex h-3 items-end gap-[2px] pl-0.5"
                  aria-hidden="true"
                >
                  <span
                    ref={bar1Ref}
                    className="w-[2px] rounded-full bg-primary"
                  />
                  <span
                    ref={bar2Ref}
                    className="w-[2px] rounded-full bg-primary"
                  />
                  <span
                    ref={bar3Ref}
                    className="w-[2px] rounded-full bg-primary"
                  />
                </span>
              )}
            </button>
          </TooltipTrigger>
        </Magnetic>
        <TooltipContent side="top">
          {audioPlaying ? "Arka plan müziğini duraklat" : "DEVIRICEM.mp3 oynat"}
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-0.5 h-4" />

      <Tooltip>
        <Magnetic strength={0.3} maxOffset={6}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSnow}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                snowEnabled ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={snowEnabled ? "Kar yağışını kapat" : "Kar yağışını aç"}
            >
              <Snowflake className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
        </Magnetic>
        <TooltipContent side="top">
          {snowEnabled ? "Kar yağışını kapat" : "Kar yağışını aç"}
        </TooltipContent>
      </Tooltip>

      {snowEnabled && (
        <Tooltip>
          <Magnetic strength={0.3} maxOffset={6}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleClearSnow}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-accent/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label="Biriken karı temizle"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
          </Magnetic>
          <TooltipContent side="top">Biriken karı temizle</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
