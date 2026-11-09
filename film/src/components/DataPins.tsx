// Scene 07: map pins for the kinds of data Swissyphus reaches, dropped all over the country while the
// counters tick. Impressionistic on purpose: positions are seeded-random inside the national border.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, ease, sp } from "../lib/anim";
import { cameraAt } from "../lib/camera";
import { geo, toScreen } from "../lib/geo";

const { colors: c } = theme;

type Kind = "rail" | "snow" | "water" | "sun" | "bolt" | "building" | "law" | "chart" | "peak" | "quake" | "air" | "vote";
const KINDS: Kind[] = ["rail", "snow", "water", "sun", "bolt", "building", "law", "chart", "peak", "quake", "air", "vote"];

const Glyph: React.FC<{ k: Kind }> = ({ k }) => {
  const p = { fill: "none", stroke: c.snow, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "rail":
      return (
        <g {...p}>
          <rect x={-5} y={-6.5} width={10} height={10} rx={2.5} />
          <line x1={-5} x2={5} y1={-1.5} y2={-1.5} />
          <line x1={-3.5} x2={-5.5} y1={3.5} y2={6.5} />
          <line x1={3.5} x2={5.5} y1={3.5} y2={6.5} />
        </g>
      );
    case "snow":
      return (
        <g {...p}>
          <line x1={0} y1={-7} x2={0} y2={7} />
          <line x1={-6} y1={-3.5} x2={6} y2={3.5} />
          <line x1={-6} y1={3.5} x2={6} y2={-3.5} />
        </g>
      );
    case "water":
      return <path {...p} d="M0 -7 C 3.5 -2.5 5 0.5 5 2.5 A 5 5 0 0 1 -5 2.5 C -5 0.5 -3.5 -2.5 0 -7 Z" />;
    case "sun":
      return (
        <g {...p}>
          <circle r={3} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={Math.cos(a) * 5} y1={Math.sin(a) * 5} x2={Math.cos(a) * 7} y2={Math.sin(a) * 7} />;
          })}
        </g>
      );
    case "bolt":
      return <path {...p} d="M1.5 -7 L-4 1 H0 L-1.5 7 L4 -1 H0 Z" />;
    case "building":
      return (
        <g {...p}>
          <rect x={-5} y={-6.5} width={10} height={13} />
          <line x1={-2} x2={-2} y1={-3.5} y2={-1.5} />
          <line x1={2} x2={2} y1={-3.5} y2={-1.5} />
          <line x1={-2} x2={-2} y1={1.5} y2={3.5} />
          <line x1={2} x2={2} y1={1.5} y2={3.5} />
        </g>
      );
    case "law":
      return (
        <text x={0} y={5} textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600} fontSize={15} fill={c.snow}>
          §
        </text>
      );
    case "chart":
      return (
        <g {...p}>
          <line x1={-6} x2={6} y1={6} y2={6} />
          <line x1={-3.5} x2={-3.5} y1={6} y2={0} />
          <line x1={0} x2={0} y1={6} y2={-5} />
          <line x1={3.5} x2={3.5} y1={6} y2={-2} />
        </g>
      );
    case "peak":
      return <path {...p} d="M-7 5.5 L-2 -3 L0.8 1 L3 -2.5 L7 5.5 Z" />;
    case "quake":
      return <polyline {...p} points="-7,0 -4,0 -2.2,-5.5 0.8,5.5 3,-2.5 4.6,0 7,0" />;
    case "air":
      return (
        <g {...p}>
          <path d="M-6 -3 H3 A2.2 2.2 0 1 0 1 -5.4" />
          <path d="M-6 0.5 H5.5" />
          <path d="M-6 4 H2 A2.2 2.2 0 1 1 0 6.4" />
        </g>
      );
    case "vote":
      return (
        <g {...p}>
          <rect x={-6} y={-1} width={12} height={7.5} />
          <line x1={-2.5} x2={2.5} y1={-1} y2={-1} strokeWidth={2.4} stroke={c.night} />
          <path d="M-2.5 -4.5 L-0.5 -2.5 L3.5 -7" />
        </g>
      );
  }
};

// ── seeded placement inside the national border ────────────────────────────
let seed = 20261109;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const border = geo.borderOuter
  .slice(1, -1)
  .split("L")
  .map((s) => s.split(" ").map(Number) as [number, number]);
const inside = ([x, y]: [number, number]) => {
  let ins = false;
  for (let i = 0, j = border.length - 1; i < border.length; j = i++) {
    const [xi, yi] = border[i], [xj, yj] = border[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
};

export const PIN_WINDOW = { start: 18, spread: 74 };

export const makePins = (start: number) => {
  const cam = cameraAt(start);
  const pins: { p: [number, number]; kind: Kind; rank: number; big: boolean }[] = [];
  let tries = 0;
  while (pins.length < 88 && tries < 20000) {
    tries++;
    const p: [number, number] = [760 + rnd() * 3300, 450 + rnd() * 2130];
    if (!inside(p)) continue;
    const [sx, sy] = toScreen(cam, p);
    if (sx < 960 && sy < 590) continue; // keep the headline column clear
    if (sy > 790 || sy < 60 || sx > 1840) continue; // the stats band and the edges
    if (pins.some((q) => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < 92)) continue; // breathing room
    pins.push({ p, kind: KINDS[pins.length % KINDS.length], rank: 0, big: rnd() < 0.18 });
  }
  // random drop order
  const order = pins.map((_, i) => i).sort(() => rnd() - 0.5);
  order.forEach((idx, r) => (pins[idx].rank = r));
  return pins;
};

export const DataPins: React.FC<{ start: number; exitAt: number }> = ({ start, exitAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pins = React.useMemo(() => makePins(start), [start]);
  const cam = cameraAt(frame);
  const n = pins.length;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {pins.map((pin, i) => {
          const at = start + PIN_WINDOW.start + (pin.rank / n) * PIN_WINDOW.spread;
          if (frame < at) return null;
          const s = sp(frame, fps, at, theme.spring.bouncy);
          const out = ease(frame, [exitAt + (pin.rank / n) * 8, exitAt + (pin.rank / n) * 8 + 8], [0, 1], theme.ease.in);
          const [x, y] = toScreen(cam, pin.p);
          const sc = 1.25 * (pin.big ? 1.18 : 1) * (0.25 + 0.75 * s) * (1 - out) * (1 + breathe(frame, fps, 0.025, 2.6, i));
          const drop = (1 - s) * -22;
          // landing ping + occasional live pulse
          const ph = (frame - at) / 22;
          const pulseEvery = 96 + (i % 5) * 18;
          const pp = ((frame - at - 30 - (i % 9) * 11) % pulseEvery) / 22;
          const ring = ph < 1 ? ph : frame - at > 30 && pp >= 0 && pp < 1 ? pp : -1;
          return (
            <g key={i} opacity={1 - out}>
              {ring >= 0 && (
                <ellipse cx={x} cy={y} rx={6 + ring * 26} ry={(6 + ring * 26) * 0.42} fill="none" stroke={c.glacier} strokeOpacity={(1 - ring) * 0.7} strokeWidth={1.2} />
              )}
              <ellipse cx={x} cy={y} rx={4} ry={1.6} fill={c.night} opacity={0.6 * s} />
              <g transform={`translate(${x} ${y + drop}) scale(${sc})`}>
                <path
                  d="M0 0 C -3 -6 -11.5 -10 -11.5 -18 A 11.5 11.5 0 1 1 11.5 -18 C 11.5 -10 3 -6 0 0 Z"
                  fill={c.night}
                  fillOpacity={0.94}
                  stroke={c.glacier}
                  strokeWidth={1.3}
                />
                <g transform="translate(0 -18) scale(0.82)">
                  <Glyph k={pin.kind} />
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
