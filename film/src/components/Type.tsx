import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, sp, swiss } from "../lib/anim";

const { colors: c } = theme;

/**
 * Words rise out of a mask, staggered. Exit: words drop out faster.
 * Lines are separated with "\n".
 */
export const WordRise: React.FC<{
  text: string;
  start: number;
  exitAt?: number;
  stagger?: number;
  style?: React.CSSProperties;
  lineStyles?: React.CSSProperties[];
  lineGap?: number;
}> = ({ text, start, exitAt, stagger = 4, style, lineStyles = [], lineGap = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = 0;
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: lineGap, ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "nowrap", whiteSpace: "nowrap", columnGap: "0.24em", ...lineStyles[li] }}>
          {line.split(" ").map((w, wi) => {
            const k = idx++;
            const s = sp(frame, fps, start + k * stagger, theme.spring.smooth);
            let y = (1 - s) * 105;
            let rot = (1 - s) * 4;
            if (exitAt !== undefined) {
              const e = ease(frame, [exitAt + k * 1.5, exitAt + k * 1.5 + 10], [0, 1], theme.ease.in);
              y -= e * 105;
              rot -= e * 3;
            }
            return (
              <span key={wi} style={{ display: "inline-block", flexShrink: 0, overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
                <span style={{ display: "inline-block", transform: `translateY(${y}%) rotate(${rot}deg)`, transformOrigin: "0 100%" }}>{w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Mono eyebrow with a ruled lead-in. */
export const Eyebrow: React.FC<{ text: string; start: number; exitAt?: number; color?: string; style?: React.CSSProperties; size?: number }> = ({
  text,
  start,
  exitAt,
  color = c.trailLight,
  style,
  size = 18,
}) => {
  const frame = useCurrentFrame();
  const n = Math.round(ease(frame, [start, start + text.length * 0.9 + 6], [0, text.length]));
  const ruleW = ease(frame, [start - 4, start + 14], [0, 44]);
  let o = ease(frame, [start - 4, start + 4]);
  if (exitAt !== undefined) o *= 1 - ease(frame, [exitAt, exitAt + 8], [0, 1], theme.ease.in);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: o, ...theme.eyebrow, fontSize: size, color, ...style }}>
      <div style={{ width: ruleW, height: 1, background: color }} />
      <span>
        {text.slice(0, n)}
        <span style={{ opacity: n < text.length ? 1 : 0 }}>▍</span>
      </span>
    </div>
  );
};

/** Character typewriter with caret (caret in the accent only while typing). */
export const Typewriter: React.FC<{
  text: string;
  start: number;
  cps?: number; // chars per frame
  style?: React.CSSProperties;
  caretColor?: string;
  showCaretAfter?: boolean;
}> = ({ text, start, cps = 1.4, style, caretColor = c.trail, showCaretAfter = false }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - start) * cps)));
  const typing = n > 0 && n < text.length;
  const blink = Math.floor(frame / 9) % 2 === 0;
  const caretOn = frame >= start - 10 && (typing || ((showCaretAfter || n === 0) && blink));
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span
        style={{
          display: "inline-block",
          width: "0.07em",
          height: "0.92em",
          marginLeft: "0.05em",
          background: caretColor,
          verticalAlign: "-0.1em",
          opacity: caretOn ? 1 : 0,
        }}
      />
    </span>
  );
};

/** Ticking counter, tabular figures, Swiss separators. */
export const Counter: React.FC<{ to: number; start: number; dur?: number; from?: number; suffix?: string; style?: React.CSSProperties; pad?: number }> = ({
  to,
  start,
  dur = 36,
  from = 0,
  suffix = "",
  style,
  pad = 0,
}) => {
  const frame = useCurrentFrame();
  const v = ease(frame, [start, start + dur], [from, to], theme.ease.out);
  const s = swiss(Math.round(v)).padStart(pad, "0");
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{s + suffix}</span>;
};

/** A rule that draws in from its origin. */
export const Rule: React.FC<{
  start: number;
  dur?: number;
  vertical?: boolean;
  color?: string;
  style?: React.CSSProperties;
  exitAt?: number;
  origin?: "start" | "end";
}> = ({ start, dur = 20, vertical, color = c.glacier, style, exitAt, origin = "start" }) => {
  const frame = useCurrentFrame();
  let p = ease(frame, [start, start + dur], [0, 1], theme.ease.inOut);
  if (exitAt !== undefined) p *= 1 - ease(frame, [exitAt, exitAt + 10], [0, 1], theme.ease.in);
  return (
    <div
      style={{
        position: "absolute",
        background: color,
        transformOrigin: vertical ? (origin === "start" ? "top" : "bottom") : origin === "start" ? "left" : "right",
        transform: vertical ? `scaleY(${p})` : `scaleX(${p})`,
        ...(vertical ? { width: 1 } : { height: 1 }),
        ...style,
      }}
    />
  );
};
