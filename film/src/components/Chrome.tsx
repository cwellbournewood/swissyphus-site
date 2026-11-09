// Map-sheet chrome: masthead, frame, coordinate readouts, graticule margins.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { ease, swiss } from "../lib/anim";
import { cameraAt, mapScale } from "../lib/camera";
import { project, toScreen, unprojectX, unprojectY } from "../lib/geo";
import { Mark } from "./Layers";

const { colors: c } = theme;
const INSET = 36;

export const Masthead: React.FC<{ start: number; exitAt?: number; label: string; dark?: boolean; coords?: string }> = ({
  start,
  exitAt,
  label,
  dark = true,
  coords,
}) => {
  const frame = useCurrentFrame();
  let o = ease(frame, [start, start + 14]);
  let y = (1 - o) * -16;
  if (exitAt !== undefined) {
    const e = ease(frame, [exitAt, exitAt + 10], [0, 1], theme.ease.in);
    o *= 1 - e;
    y -= e * 16;
  }
  const cam = cameraAt(frame);
  const lon = unprojectX(cam.cx);
  const lat = unprojectY(cam.cy);
  const ink = dark ? c.snow : c.lake;
  const sub = dark ? c.glacier : c.contour;
  const rule = ease(frame, [start + 4, start + 30], [0, 1], theme.ease.inOut) * (exitAt !== undefined ? 1 - ease(frame, [exitAt, exitAt + 10]) : 1);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 44,
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 40,
          opacity: o,
          transform: `translateY(${y}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Mark size={36} dark={dark} />
          <span style={{ fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em", color: ink }}>swissyphus</span>
        </div>
        <span style={{ ...theme.eyebrow, fontSize: 15, color: dark ? c.trailLight : c.trailInk, marginLeft: 12 }}>{label}</span>
        <span style={{ marginLeft: "auto", fontFamily: theme.fonts.mono, fontSize: 15, letterSpacing: "0.06em", color: sub, fontVariantNumeric: "tabular-nums" }}>
          {coords ?? `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: INSET,
          right: INSET,
          top: 120,
          height: 1,
          background: dark ? theme.alpha.ruleStrong : theme.alpha.ruleOnPaper,
          transformOrigin: "left",
          transform: `scaleX(${rule})`,
        }}
      />
    </>
  );
};

/** Thin sheet frame with corner ticks. */
export const SheetFrame: React.FC<{ start: number; exitAt?: number; dark?: boolean }> = ({ start, exitAt, dark = true }) => {
  const frame = useCurrentFrame();
  let p = ease(frame, [start, start + 40], [0, 1], theme.ease.inOut);
  if (exitAt !== undefined) p *= 1 - ease(frame, [exitAt, exitAt + 12], [0, 1], theme.ease.in);
  const col = dark ? theme.alpha.ruleStrong : theme.alpha.ruleOnPaper;
  const w = 1920 - INSET * 2, h = 1080 - INSET * 2;
  const per = 2 * (w + h);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        <rect x={INSET + 0.5} y={INSET + 0.5} width={w} height={h} fill="none" stroke={col} strokeWidth={1} strokeDasharray={`${per * p} ${per}`} />
        {[
          [INSET, INSET],
          [1920 - INSET, INSET],
          [INSET, 1080 - INSET],
          [1920 - INSET, 1080 - INSET],
        ].map(([x, y], i) => (
          <g key={i} stroke={dark ? c.glacier : c.lake} strokeWidth={1} opacity={p}>
            <line x1={x - 12} x2={x + 12} y1={y} y2={y} />
            <line x1={x} x2={x} y1={y - 12} y2={y + 12} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const dms = (v: number, hemi: string) => {
  const d = Math.floor(v + 1e-9);
  const m = Math.round((v - d) * 60);
  return `${d}°${m ? String(m).padStart(2, "0") + "'" : ""} ${hemi}`;
};

/** Graticule labels in the sheet margins (only meaningful while the map is upright). */
export const GraticuleMargins: React.FC<{ start: number; exitAt?: number }> = ({ start, exitAt }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  let o = ease(frame, [start, start + 20]);
  if (exitAt !== undefined) o *= 1 - ease(frame, [exitAt, exitAt + 8], [0, 1], theme.ease.in);
  if (o <= 0) return null;
  const labels: React.ReactNode[] = [];
  for (let lon = 5.5; lon <= 11.0001; lon += 0.5) {
    const [sx] = toScreen(cam, project(lon, 46.5));
    if (sx < 90 || sx > 1830) continue;
    labels.push(
      <div key={"x" + lon} style={{ position: "absolute", left: sx, top: 1080 - INSET - 30, transform: "translateX(-50%)" }}>
        <div style={{ width: 1, height: 8, background: c.glacier, margin: "0 auto 4px", opacity: 0.6 }} />
        {dms(lon, "E")}
      </div>,
    );
  }
  for (let lat = 45.5; lat <= 48.0001; lat += 0.5) {
    const [, sy] = toScreen(cam, project(8, lat));
    if (sy < 150 || sy > 1000) continue;
    labels.push(
      <div key={"y" + lat} style={{ position: "absolute", right: INSET + 10, top: sy - 9, display: "flex", alignItems: "center", gap: 6 }}>
        {dms(lat, "N")}
        <div style={{ width: 8, height: 1, background: c.glacier, opacity: 0.6 }} />
      </div>,
    );
  }
  return (
    <AbsoluteFill style={{ opacity: o, fontFamily: theme.fonts.mono, fontSize: 13, letterSpacing: "0.06em", color: c.glacier, pointerEvents: "none" }}>
      {labels}
    </AbsoluteFill>
  );
};

/** Footer: live scale + credits, like the margin of a national map sheet. */
export const SheetFooter: React.FC<{ start: number; exitAt?: number; credits: string }> = ({ start, exitAt, credits }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  let o = ease(frame, [start, start + 16]);
  if (exitAt !== undefined) o *= 1 - ease(frame, [exitAt, exitAt + 8], [0, 1], theme.ease.in);
  const scale = Math.round(mapScale(cam.s) / 1000) * 1000;
  return (
    <div
      style={{
        position: "absolute",
        right: 72,
        bottom: INSET + 34,
        opacity: o,
        fontFamily: theme.fonts.mono,
        fontSize: 13,
        letterSpacing: "0.06em",
        color: c.glacier,
        textAlign: "right",
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: c.snow, fontVariantNumeric: "tabular-nums" }}>1:{swiss(scale)}</div>
      <div style={{ opacity: 0.75 }}>{credits}</div>
    </div>
  );
};
