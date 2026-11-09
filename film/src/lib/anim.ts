import { interpolate, spring, type SpringConfig } from "remotion";
import { theme } from "../theme";

type EaseFn = (t: number) => number;

/** Clamped, eased interpolation. Linear is never used. */
export const ease = (
  frame: number,
  range: [number, number],
  out: [number, number] = [0, 1],
  easing: EaseFn = theme.ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Multi-stop eased interpolation (each segment uses the same easing). */
export const easeStops = (
  frame: number,
  input: number[],
  output: number[],
  easing: EaseFn = theme.ease.inOut,
) => {
  if (frame <= input[0]) return output[0];
  for (let i = 0; i < input.length - 1; i++) {
    if (frame <= input[i + 1]) {
      return interpolate(frame, [input[i], input[i + 1]], [output[i], output[i + 1]], {
        easing,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }
  return output[output.length - 1];
};

export const sp = (
  frame: number,
  fps: number,
  start: number,
  config: Partial<SpringConfig> = theme.spring.snappy,
  durationInFrames?: number,
) => spring({ frame: frame - start, fps, config, durationInFrames });

/**
 * Standard entrance (fade + rise + scale, spring) and faster exit (ease-in).
 * Returns style fragments. `exitAt` optional.
 */
export const enter = (
  frame: number,
  fps: number,
  start: number,
  opts: { exitAt?: number; exitDur?: number; rise?: number; cfg?: Partial<SpringConfig>; scaleFrom?: number } = {},
) => {
  const { exitAt, exitDur = Math.round(fps / 3), rise = 28, cfg = theme.spring.smooth, scaleFrom = 0.96 } = opts;
  const s = sp(frame, fps, start, cfg);
  let opacity = interpolate(s, [0, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let y = (1 - s) * rise;
  let scale = scaleFrom + (1 - scaleFrom) * s;
  if (exitAt !== undefined && frame >= exitAt) {
    const e = ease(frame, [exitAt, exitAt + exitDur], [0, 1], theme.ease.in);
    opacity *= 1 - e;
    y -= e * rise * 0.8;
    scale *= 1 - 0.03 * e;
  }
  return { opacity, transform: `translateY(${y}px) scale(${scale})` };
};

/** Gentle idle motion for anything on screen > 2s. */
export const breathe = (frame: number, fps: number, amp = 1, periodSec = 4, phase = 0) =>
  Math.sin(((frame / fps) * Math.PI * 2) / periodSec + phase) * amp;

/** Swiss number style: 15'000. */
export const swiss = (n: number, decimals = 0) => {
  const fixed = Math.abs(n).toFixed(decimals);
  const [i, d] = fixed.split(".");
  const withSep = i.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return (n < 0 ? "−" : "") + withSep + (d ? "." + d : "");
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
