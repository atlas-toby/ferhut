import { useEffect, useRef } from "react";

interface JumpscareModalProps {
  open: boolean;
  onClose: () => void;
}

export function JumpscareModal({ open, onClose }: JumpscareModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.volume = 1;
      void video.play().catch(() => {
        // Browser autoplay fallback
      });
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.href = "https://ferhatkargo.netlify.app";
    }, 2000);

    return () => {
      window.clearTimeout(redirectTimer);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Siparis sorgu videosu"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src="/mp4/djbuttpussy.mp4"
        autoPlay
        playsInline
        className="h-screen w-screen object-cover"
      />
    </div>
  );
}
