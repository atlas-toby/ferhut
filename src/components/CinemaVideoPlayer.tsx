import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VideoErrorBoundary } from "@/components/VideoErrorBoundary";

interface CinemaVideoPlayerProps {
  src: string;
  title: string;
  activeIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 0.75] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function CinemaVideoPlayer({
  src,
  title,
  activeIndex,
  totalCount,
  onPrev,
  onNext,
}: CinemaVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const volumeTrackRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [errorReason, setErrorReason] = useState(
    "Bu arşiv kaydının medya dosyası yüklenemedi veya şu anda erişilebilir değil."
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [pulseState, setPulseState] = useState<"play" | "pause" | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  // Reset state cleanly whenever clip source or retry count changes
  useEffect(() => {
    setMediaError(false);
    setErrorReason(
      "Bu arşiv kaydının medya dosyası yüklenemedi veya şu anda erişilebilir değil."
    );
    setCurrentTime(0);
    setDuration(0);
    setSpeedIndex(0);
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = 1;
    el.volume = isMuted ? 0 : volume;
    el.muted = isMuted;
    el.play()
      .then(() => setIsPlaying(true))
      .catch((err: unknown) => {
        setIsPlaying(false);
        if (err instanceof DOMException && err.name === "NotSupportedError") {
          setErrorReason("Video biçimi bu tarayıcıda desteklenmiyor veya dosya eksik.");
          setMediaError(true);
        }
      });
  }, [src, retryCount]);

  const handleRetryVideo = useCallback(() => {
    setMediaError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  const triggerPulse = useCallback((kind: "play" | "pause") => {
    setPulseState(kind);
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setPulseState(null);
    }, 420);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || mediaError) return;
    if (el.paused) {
      el.play()
        .then(() => {
          setIsPlaying(true);
          triggerPulse("play");
        })
        .catch((err: unknown) => {
          setIsPlaying(false);
          if (err instanceof DOMException && err.name === "NotSupportedError") {
            setErrorReason("Video oynatılamadı. Dosya bulunamadı veya desteklenmiyor.");
            setMediaError(true);
          }
        });
    } else {
      el.pause();
      setIsPlaying(false);
      triggerPulse("pause");
    }
  }, [mediaError, triggerPulse]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    el.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.7);
      el.volume = 0.7;
    }
  }, [isMuted, volume]);

  const cycleSpeed = useCallback(() => {
    const el = videoRef.current;
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
    if (el) {
      el.playbackRate = SPEED_OPTIONS[nextIdx];
    }
  }, [speedIndex]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void container.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Keyboard shortcuts while player is active (never hijack input typing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "m") {
        toggleMute();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key === "ArrowRight" && videoRef.current) {
        videoRef.current.currentTime = Math.min(
          duration || 0,
          videoRef.current.currentTime + 5
        );
      } else if (e.key === "ArrowLeft" && videoRef.current) {
        videoRef.current.currentTime = Math.max(
          0,
          videoRef.current.currentTime - 5
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [duration, toggleFullscreen, toggleMute, togglePlay]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = timelineRef.current;
      const el = videoRef.current;
      if (!track || !el || !duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const nextTime = ratio * duration;
      el.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration]
  );

  const handleTimelinePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    seekFromClientX(e.clientX);
  };

  const handleTimelinePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    seekFromClientX(e.clientX);
  };

  const handleTimelinePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsScrubbing(false);
    }
  };

  const updateVolumeFromClientX = useCallback((clientX: number) => {
    const track = volumeTrackRef.current;
    const el = videoRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const nextVol = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    setVolume(nextVol);
    el.volume = nextVol;
    if (nextVol === 0) {
      setIsMuted(true);
      el.muted = true;
    } else {
      setIsMuted(false);
      el.muted = false;
    }
  }, []);

  const handleVolumePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingVolume(true);
    updateVolumeFromClientX(e.clientX);
  };

  const handleVolumePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolume) return;
    updateVolumeFromClientX(e.clientX);
  };

  const handleVolumePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingVolume) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDraggingVolume(false);
    }
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const effectiveVolume = isMuted ? 0 : volume;
  const currentSpeed = SPEED_OPTIONS[speedIndex];

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 select-none"
    >
      {/* Strictly Constrained Video Stage wrapped in Custom VideoErrorBoundary */}
      <div
        onClick={mediaError ? undefined : togglePlay}
        onDoubleClick={mediaError ? undefined : toggleFullscreen}
        className={`relative min-h-0 flex-1 w-full overflow-hidden bg-[#070709] ${
          mediaError ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <VideoErrorBoundary
          resetKey={`${src}-${retryCount}`}
          title={title}
          message={errorReason}
          hasMediaError={mediaError}
          onRetry={handleRetryVideo}
          onSkipNext={onNext}
        >
          <video
            key={`${src}-${retryCount}`}
            ref={videoRef}
            src={src}
            autoPlay
            loop
            playsInline
            onError={() => {
              setErrorReason(
                "Bu arşiv kaydının medya dosyası yüklenemedi veya şu anda erişilebilir değil."
              );
              setMediaError(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              setDuration(vid.duration || 0);
              vid.volume = isMuted ? 0 : volume;
            }}
            onTimeUpdate={(e) => {
              if (!isScrubbing) {
                setCurrentTime(e.currentTarget.currentTime);
              }
            }}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </VideoErrorBoundary>

        {/* Paused Resting Overlay Indicator */}
        {!mediaError && !isPlaying && !pulseState && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-xl shadow-2xl">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </div>
          </div>
        )}

        {/* Subtle Transient Play/Pause Feedback */}
        {pulseState && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-xl shadow-2xl transition-transform duration-200">
              {pulseState === "play" ? (
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              ) : (
                <Pause className="h-5 w-5 fill-current" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Apple-Minimalist Docked Player Bar (adapts seamlessly to Dark & Light themes) */}
      <div className="shrink-0 border-t border-border/80 bg-card/95 px-5 pb-3.5 pt-3 text-foreground backdrop-blur-2xl dark:border-white/10 dark:bg-[#0E0E11]/95 dark:text-zinc-100">
        {/* Scrubbable Timeline */}
        <div
          ref={timelineRef}
          role="slider"
          aria-label="Video ilerleme çubuğu"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerUp}
          className="group relative flex h-4 w-full cursor-pointer items-center touch-none"
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-foreground/15 transition-all duration-150 group-hover:h-1.5 dark:bg-white/15">
            <div
              className="h-full origin-left rounded-full bg-primary transition-transform duration-75 ease-linear"
              style={{ transform: `scaleX(${progressRatio})` }}
            />
          </div>
          <div
            style={{ left: `${progressRatio * 100}%` }}
            className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-transform duration-150 dark:border-transparent dark:shadow-[0_1px_6px_rgba(0,0,0,0.7)] ${
              isScrubbing ? "scale-110" : "scale-0 group-hover:scale-100"
            }`}
          />
        </div>

        {/* Unified Controls Row */}
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {/* Left: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              disabled={mediaError}
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground transition-all duration-150 hover:bg-accent active:scale-95 disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {effectiveVolume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : effectiveVolume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {/* Custom Apple Volume Slider */}
              <div
                ref={volumeTrackRef}
                role="slider"
                aria-label="Ses düzeyi"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(effectiveVolume * 100)}
                tabIndex={0}
                onPointerDown={handleVolumePointerDown}
                onPointerMove={handleVolumePointerMove}
                onPointerUp={handleVolumePointerUp}
                className="group relative flex h-5 w-16 cursor-pointer items-center touch-none"
              >
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-foreground/15 dark:bg-white/15">
                  <div
                    className="h-full origin-left rounded-full bg-foreground/80 dark:bg-white/85"
                    style={{ transform: `scaleX(${effectiveVolume})` }}
                  />
                </div>
                <div
                  style={{ left: `${effectiveVolume * 100}%` }}
                  className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/80 bg-white shadow transition-transform duration-150 group-hover:scale-110 dark:border-transparent"
                />
              </div>
            </div>

            <span className="ml-1 font-mono text-[11px] tabular-nums text-muted-foreground dark:text-zinc-400">
              <span className="text-foreground dark:text-zinc-100">
                {formatTime(currentTime)}
              </span>
              <span className="mx-1 opacity-50">/</span>
              <span>{formatTime(duration)}</span>
            </span>
          </div>

          {/* Center: Integrated Clip Stepper */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-secondary/60 px-1 py-0.5 dark:border-white/10 dark:bg-white/[0.04]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Önceki klip"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Önceki klip</TooltipContent>
            </Tooltip>

            <span className="px-2 font-mono text-[11px] tabular-nums text-foreground/85 dark:text-zinc-300">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(totalCount).padStart(2, "0")}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Sonraki klip"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sonraki klip</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Speed & Fullscreen */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="inline-flex h-8 min-w-[40px] items-center justify-center rounded-xl px-2 font-mono text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Oynatma hızı"
                >
                  {currentSpeed}x
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Oynatma hızını değiştir</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
