import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAmbient } from "@/context/AmbientContext";

interface Snowflake {
  x: number;
  y: number;
  r: number;
  vy: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  alpha: number;
  depth: number;
}

const BIN_WIDTH = 4;
const MAX_ACCUMULATION = 64;

export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const { snowEnabled, clearSnowSignal } = useAmbient();
  const themeRef = useRef(theme);
  const meltingRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (clearSnowSignal > 0) {
      meltingRef.current = true;
    }
  }, [clearSnowSignal]);

  useEffect(() => {
    if (!snowEnabled) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    let binCount = Math.ceil(width / BIN_WIDTH) + 2;
    let pile = new Float32Array(binCount);
    let pileBuffer = new Float32Array(binCount);

    const configureCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nextBinCount = Math.ceil(nextWidth / BIN_WIDTH) + 2;
      if (nextBinCount !== binCount) {
        const nextPile = new Float32Array(nextBinCount);
        const ratio = binCount / nextBinCount;
        for (let i = 0; i < nextBinCount; i++) {
          const oldIdx = Math.min(binCount - 1, Math.floor(i * ratio));
          nextPile[i] = pile[oldIdx] || 0;
        }
        pile = nextPile;
        pileBuffer = new Float32Array(nextBinCount);
        binCount = nextBinCount;
      }

      width = nextWidth;
      height = nextHeight;
    };

    configureCanvas();

    const flakeCount = 92;
    const spawnFlake = (randomY: boolean): Snowflake => {
      const depth = 0.35 + Math.random() * 0.65;
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -12 - Math.random() * 60,
        r: 1.0 + depth * 2.1,
        vy: 0.42 + depth * 1.15,
        driftAmp: 0.22 + depth * 0.45,
        driftFreq: 0.0005 + Math.random() * 0.0009,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.22 + depth * 0.48,
        depth,
      };
    };

    const flakes: Snowflake[] = Array.from({ length: flakeCount }, () =>
      spawnFlake(true)
    );

    const depositSnow = (x: number, radius: number) => {
      const centerBin = Math.floor(x / BIN_WIDTH);
      const spread = 5;
      const depositAmount = 0.28 + radius * 0.22;

      for (let offset = -spread; offset <= spread; offset++) {
        const idx = centerBin + offset;
        if (idx < 0 || idx >= binCount) continue;
        const falloff = Math.exp(-(offset * offset) / (2 * 2.4 * 2.4));
        const next = pile[idx] + depositAmount * falloff;
        pile[idx] = next > MAX_ACCUMULATION ? MAX_ACCUMULATION : next;
      }
    };

    const smoothPile = () => {
      for (let i = 0; i < binCount; i++) {
        const left = pile[i > 0 ? i - 1 : i];
        const center = pile[i];
        const right = pile[i < binCount - 1 ? i + 1 : i];
        // Subtle gravity relaxation keeps drifts softly curved
        pileBuffer[i] = center * 0.92 + (left + right) * 0.04;
      }
      const swap = pile;
      pile = pileBuffer;
      pileBuffer = swap;
    };

    const drawSnowPile = (isDark: boolean) => {
      let maxH = 0;
      for (let i = 0; i < binCount; i++) {
        if (pile[i] > maxH) maxH = pile[i];
      }
      if (maxH < 0.35) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height - pile[0]);

      for (let i = 0; i < binCount - 1; i++) {
        const x1 = i * BIN_WIDTH;
        const y1 = height - pile[i];
        const x2 = (i + 1) * BIN_WIDTH;
        const y2 = height - pile[i + 1];
        const cx = (x1 + x2) * 0.5;
        const cy = (y1 + y2) * 0.5;
        ctx.quadraticCurveTo(x1, y1, cx, cy);
      }

      ctx.lineTo(width, height - pile[binCount - 1]);
      ctx.lineTo(width, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, height - maxH - 4, 0, height);
      if (isDark) {
        grad.addColorStop(0, "rgba(241, 246, 255, 0.82)");
        grad.addColorStop(0.45, "rgba(220, 232, 248, 0.68)");
        grad.addColorStop(1, "rgba(186, 204, 230, 0.52)");
      } else {
        grad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
        grad.addColorStop(0.55, "rgba(235, 242, 252, 0.9)");
        grad.addColorStop(1, "rgba(214, 226, 244, 0.85)");
      }
      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate luminous rim highlight along the drift crest
      ctx.beginPath();
      ctx.moveTo(0, height - pile[0]);
      for (let i = 0; i < binCount - 1; i++) {
        const x1 = i * BIN_WIDTH;
        const y1 = height - pile[i];
        const x2 = (i + 1) * BIN_WIDTH;
        const y2 = height - pile[i + 1];
        ctx.quadraticCurveTo(x1, y1, (x1 + x2) * 0.5, (y1 + y2) * 0.5);
      }
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.55)"
        : "rgba(148, 174, 210, 0.45)";
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    };

    let frame = 0;
    const render = (now: number) => {
      frame += 1;
      const isDark = themeRef.current === "dark";
      ctx.clearRect(0, 0, width, height);

      if (meltingRef.current) {
        let remaining = 0;
        for (let i = 0; i < binCount; i++) {
          pile[i] *= 0.86;
          if (pile[i] < 0.15) pile[i] = 0;
          remaining += pile[i];
        }
        if (remaining < 0.5) {
          pile.fill(0);
          meltingRef.current = false;
        }
      } else if (frame % 3 === 0) {
        smoothPile();
      }

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.vy;
        f.x += Math.sin(now * f.driftFreq + f.phase) * f.driftAmp;

        if (f.x > width + 8) f.x = -8;
        if (f.x < -8) f.x = width + 8;

        const bin = Math.max(
          0,
          Math.min(binCount - 1, Math.floor(f.x / BIN_WIDTH))
        );
        const groundY = height - pile[bin];

        if (f.y >= groundY - f.r * 0.5) {
          if (!meltingRef.current) {
            depositSnow(f.x, f.r);
          }
          const respawned = spawnFlake(false);
          f.x = respawned.x;
          f.y = respawned.y;
          f.r = respawned.r;
          f.vy = respawned.vy;
          f.alpha = respawned.alpha;
          f.phase = respawned.phase;
          continue;
        }

        const flakeGrad = ctx.createRadialGradient(
          f.x,
          f.y,
          0,
          f.x,
          f.y,
          f.r * 1.6
        );
        if (isDark) {
          flakeGrad.addColorStop(0, `rgba(245, 249, 255, ${f.alpha})`);
          flakeGrad.addColorStop(1, "rgba(245, 249, 255, 0)");
        } else {
          flakeGrad.addColorStop(0, `rgba(115, 146, 188, ${f.alpha * 0.85})`);
          flakeGrad.addColorStop(1, "rgba(115, 146, 188, 0)");
        }

        ctx.fillStyle = flakeGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSnowPile(isDark);
      animationFrameId = window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", configureCanvas);
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", configureCanvas);
    };
  }, [snowEnabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-20 h-full w-full transition-opacity duration-500 ease-out ${
        snowEnabled ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
