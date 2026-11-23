import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { AlertCircle, Film, RefreshCw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VideoFallbackOverlayProps {
  title?: string;
  message?: string;
  compact?: boolean;
  accent?: string;
  onRetry?: () => void;
  onSkipNext?: () => void;
}

export function VideoFallbackOverlay({
  title,
  message = "Video kaynağı yüklenemedi veya oynatılamadı.",
  compact = false,
  accent,
  onRetry,
  onSkipNext,
}: VideoFallbackOverlayProps) {
  if (compact) {
    return (
      <div
        role="status"
        className="flex h-full w-full flex-col items-center justify-center gap-2.5 px-5 text-center transition-colors"
        style={{
          background: accent
            ? `radial-gradient(circle at 30% 20%, ${accent}24, transparent 68%), hsl(var(--secondary))`
            : "hsl(var(--secondary))",
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-card/85 text-muted-foreground shadow-apple-sm dark:shadow-apple-dark-sm backdrop-blur-md">
          <Film className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            Önizleme kullanılamıyor
          </p>
          <p className="text-[11px] text-muted-foreground">
            Arşiv kaydı çevrimdışı
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/85 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-card"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Tekrar dene</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 p-8 backdrop-blur-xl dark:bg-[#09090B]/95"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-border/80 bg-card/90 p-7 text-center shadow-apple-md dark:shadow-apple-dark-md backdrop-blur-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-secondary/80 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
        </div>

        <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-foreground">
          {title || "Video oynatılamadı"}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>

        {(onRetry || onSkipNext) && (
          <div className="mt-5 flex items-center gap-2">
            {onRetry && (
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={onRetry}
                className="h-8 gap-1.5 rounded-lg px-3.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tekrar Dene</span>
              </Button>
            )}
            {onSkipNext && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSkipNext}
                className="h-8 gap-1.5 rounded-lg px-3.5 text-xs"
              >
                <span>Sonraki Klip</span>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  compact?: boolean;
  accent?: string;
  hasMediaError?: boolean;
  onRetry?: () => void;
  onSkipNext?: () => void;
  resetKey?: string | number;
}

interface VideoErrorBoundaryState {
  hasRenderError: boolean;
}

export class VideoErrorBoundary extends Component<
  VideoErrorBoundaryProps,
  VideoErrorBoundaryState
> {
  state: VideoErrorBoundaryState = {
    hasRenderError: false,
  };

  static getDerivedStateFromError(): VideoErrorBoundaryState {
    return { hasRenderError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Handled gracefully by themed minimalist fallback overlay
  }

  componentDidUpdate(prevProps: VideoErrorBoundaryProps) {
    if (
      prevProps.resetKey !== this.props.resetKey &&
      this.state.hasRenderError
    ) {
      this.setState({ hasRenderError: false });
    }
  }

  handleRetry = () => {
    this.setState({ hasRenderError: false });
    this.props.onRetry?.();
  };

  render() {
    const {
      children,
      title,
      message,
      compact,
      accent,
      hasMediaError,
      onSkipNext,
    } = this.props;

    if (this.state.hasRenderError || hasMediaError) {
      return (
        <VideoFallbackOverlay
          title={title}
          message={message}
          compact={compact}
          accent={accent}
          onRetry={this.handleRetry}
          onSkipNext={onSkipNext}
        />
      );
    }

    return children;
  }
}
