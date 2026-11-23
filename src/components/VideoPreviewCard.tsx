import { useEffect, useRef, useState } from "react";
import { Play, VolumeX } from "lucide-react";
import type { MuseumVideo } from "@/data/videos";
import { Card } from "@/components/ui/card";
import { VideoErrorBoundary } from "@/components/VideoErrorBoundary";

interface VideoPreviewCardProps {
  video: MuseumVideo;
  index: number;
  onSelect: (video: MuseumVideo) => void;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function VideoPreviewCard({
  video,
  index,
  onSelect,
}: VideoPreviewCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationLabel, setDurationLabel] = useState("");
  const [mediaError, setMediaError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (mediaError) return;

    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }

    // Subtle YouTube-like hover settle prevents accidental playback on fast sweeps
    hoverTimerRef.current = window.setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      el.muted = true;
      el.play()
        .then(() => {
          setIsPreviewPlaying(true);
        })
        .catch(() => {
          setIsPreviewPlaying(false);
        });
    }, 170);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    const el = videoRef.current;
    if (el) {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        // Ignore seek errors on unloaded media
      }
    }
    setIsPreviewPlaying(false);
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration || !Number.isFinite(el.duration)) return;
    setProgress(Math.min(1, el.currentTime / el.duration));
  };

  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (!el) return;
    setDurationLabel(formatDuration(el.duration));
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(video);
        }
      }}
      className="group cursor-pointer overflow-hidden border-border/75 bg-card p-2.5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-foreground/20 hover:shadow-apple-md dark:hover:shadow-apple-dark-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {/* Thumbnail & YouTube-Style Live Hover Video Stage */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-secondary/70">
        <VideoErrorBoundary
          compact
          accent={video.accent}
          title={video.title}
          resetKey={`${video.src}-${retryCount}`}
          hasMediaError={mediaError}
          onRetry={() => {
            setMediaError(false);
            setRetryCount((prev) => prev + 1);
          }}
        >
          <video
            key={`${video.src}-${retryCount}`}
            ref={videoRef}
            src={video.src}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setMediaError(true)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </VideoErrorBoundary>

        {!mediaError && (
          <>
            {/* Measured Bottom Contrast Scrim */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition-opacity duration-300"
              aria-hidden="true"
            />

            {/* Center Play Affordance (fades away smoothly once preview clip starts) */}
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                isPreviewPlaying
                  ? "scale-90 opacity-0"
                  : isHovering
                    ? "scale-100 opacity-100"
                    : "scale-95 opacity-85"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-105">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </div>
            </div>
          </>
        )}

        {/* Live Preview Indicator (YouTube style subtle top-right mute/preview cue) */}
        <div
          className={`pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-black/65 px-2 py-1 text-[11px] font-medium text-white/95 backdrop-blur-md transition-all duration-200 ${
            isPreviewPlaying
              ? "translate-y-0 opacity-100"
              : "-translate-y-1 opacity-0"
          }`}
        >
          <VolumeX className="h-3 w-3 opacity-85" />
          <span>Önizleme</span>
        </div>

        {/* Duration Stamp */}
        {durationLabel && !mediaError && (
          <div
            className={`pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white/95 tabular-nums backdrop-blur-sm transition-opacity duration-200 ${
              isPreviewPlaying ? "opacity-90" : "opacity-85"
            }`}
          >
            {durationLabel}
          </div>
        )}

        {/* Smooth YouTube-Style Hover Playback Progress Track */}
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 transition-opacity duration-200 ${
            isPreviewPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="h-full origin-left bg-primary transition-transform duration-100 ease-linear"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

      {/* Clean Editorial Metadata (Zero-Pill Discipline) */}
      <div className="px-1.5 pb-1 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums text-[11px]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden="true">·</span>
          <span>{video.tag}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{video.handle}</span>
        </div>

        <h2 className="mt-1.5 line-clamp-1 font-display text-[15px] font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
          {video.title}
        </h2>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {video.description}
        </p>
      </div>
    </Card>
  );
}
