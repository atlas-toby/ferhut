import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface AmbientContextValue {
  audioPlaying: boolean;
  toggleAudio: () => void;
  pauseAudio: () => void;
  getAudioLevels: () => [number, number, number];
  snowEnabled: boolean;
  toggleSnow: () => void;
  clearSnowSignal: number;
  clearSnow: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  hallOfFameOpen: boolean;
  setHallOfFameOpen: (open: boolean) => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

export function AmbientProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(
        new ArrayBuffer(analyser.frequencyBinCount)
      );
    } catch {
      // Ignore if AudioContext is blocked or unsupported
    }
  }, []);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [clearSnowSignal, setClearSnowSignal] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [hallOfFameOpen, setHallOfFameOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.32;
    ensureAudioGraph();
    audio
      .play()
      .then(() => {
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume().catch(() => undefined);
        }
        setAudioPlaying(true);
      })
      .catch(() => setAudioPlaying(false));
  }, [ensureAudioGraph]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      ensureAudioGraph();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume().catch(() => undefined);
      }
      audio.volume = 0.32;
      audio
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => setAudioPlaying(false));
    }
  }, [audioPlaying, ensureAudioGraph]);

  const getAudioLevels = useCallback((): [number, number, number] => {
    const analyser = analyserRef.current;
    const data = freqDataRef.current;
    if (!analyser || !data) return [0.3, 0.5, 0.3];
    analyser.getByteFrequencyData(data);
    const avg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i] || 0;
      return sum / Math.max(1, end - start) / 255;
    };
    const shape = (v: number, jitter: number) => {
      const curved = Math.pow(Math.min(1, v), 2.1);
      const pulse = curved * (0.85 + Math.random() * jitter);
      return Math.min(1, Math.max(0.14, pulse));
    };
    const low = shape(avg(0, 4), 0.35);
    const mid = shape(avg(4, 12) * 1.1, 0.4);
    const high = shape(avg(12, 24) * 1.25, 0.45);
    return [low, mid, high];
  }, []);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
    }
    setAudioPlaying(false);
  }, []);

  const toggleSnow = useCallback(() => {
    setSnowEnabled((prev) => !prev);
  }, []);

  const clearSnow = useCallback(() => {
    setClearSnowSignal((prev) => prev + 1);
  }, []);

  return (
    <AmbientContext.Provider
      value={{
        audioPlaying,
        toggleAudio,
        pauseAudio,
        getAudioLevels,
        snowEnabled,
        toggleSnow,
        clearSnowSignal,
        clearSnow,
        commandOpen,
        setCommandOpen,
        hallOfFameOpen,
        setHallOfFameOpen,
      }}
    >
      <audio ref={audioRef} loop src="/mp3/DEVIRICEM.mp3" preload="auto" />
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient(): AmbientContextValue {
  const ctx = useContext(AmbientContext);
  if (!ctx) {
    throw new Error("useAmbient must be used within an AmbientProvider");
  }
  return ctx;
}
