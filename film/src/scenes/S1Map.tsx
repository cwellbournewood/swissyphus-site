import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, enter, sp } from "../lib/anim";
import { cameraAt } from "../lib/camera";
import { P, toScreen } from "../lib/geo";
import { Eyebrow, WordRise } from "../components/Type";
import { GraticuleMargins, Masthead, SheetFooter, SheetFrame } from "../components/Chrome";

const { colors: c } = theme;

const PLACES: Array<[string, string, "l" | "r"]> = [
  ["Zürich", "ZÜRICH", "r"],
  ["St. Gallen", "ST. GALLEN", "r"],
  ["Bern", "BERN", "l"],
  ["Luzern", "LUZERN", "r"],
  ["Lausanne", "LAUSANNE", "l"],
  ["Genève", "GENÈVE", "r"],
  ["Chur", "CHUR", "r"],
  ["Sion", "SION", "l"],
  ["Lugano", "LUGANO", "r"],
  ["Davos", "DAVOS", "r"],
];

export const TRANSECT = { draw: [262, 298] as [number, number] };

export const S1Map: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame);
  const EXIT = 262;

  // transect Basel → Matterhorn (screen space: rotates with the camera)
  const a = toScreen(cam, P("Basel"));
  const b = toScreen(cam, P("Matterhorn"));
  const tp = ease(frame, TRANSECT.draw, [0, 1], theme.ease.inOut);
  const tx = a[0] + (b[0] - a[0]) * tp;
  const ty = a[1] + (b[1] - a[1]) * tp;
  const endLabelO = ease(frame, [270, 282]) * (1 - ease(frame, [300, 308], [0, 1], theme.ease.in));

  return (
    <AbsoluteFill>
      {/* left-side darkening behind the headline (part of the grade) */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(100deg, rgba(11,39,51,0.78) 0%, rgba(11,39,51,0.35) 36%, rgba(11,39,51,0) 55%)",
          opacity: ease(frame, [90, 140]) * (1 - ease(frame, [EXIT, EXIT + 16])),
        }}
      />
      <SheetFrame start={6} exitAt={292} />
      <Masthead start={16} exitAt={290} label="The Swiss public-data rollup for AI agents" />
      <GraticuleMargins start={60} exitAt={286} />
      <SheetFooter start={70} exitAt={290} credits="BORDER © SWISSTOPO · LAKES © FOEN · TERRAIN: MAPZEN TERRAIN TILES" />

      {/* place labels */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {PLACES.map(([key, label, side], i) => {
          const st = 150 + i * 3;
          const s = sp(frame, fps, st, theme.spring.snappy);
          const o = Math.min(1, s * 1.4) * (1 - ease(frame, [280 + i, 290 + i], [0, 1], theme.ease.in));
          if (o <= 0) return null;
          const [x, y] = toScreen(cam, P(key));
          return (
            <div key={key} style={{ position: "absolute", left: x, top: y, opacity: o }}>
              <div style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: 8, background: c.snow, transform: `scale(${s})` }} />
              <div
                style={{
                  position: "absolute",
                  top: -9,
                  ...(side === "r" ? { left: 12 } : { right: 12 }),
                  fontFamily: theme.fonts.mono,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  color: c.snow,
                  whiteSpace: "nowrap",
                  transform: `translateX(${(1 - s) * (side === "r" ? -8 : 8)}px)`,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* transect */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {tp > 0 && (
          <>
            <line x1={a[0]} y1={a[1]} x2={tx} y2={ty} stroke={c.trail} strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={a[0]} cy={a[1]} r={5 * ease(frame, [262, 272])} fill={c.trail} />
            <circle cx={b[0]} cy={b[1]} r={5 * ease(frame, [292, 300])} fill={c.trail} />
          </>
        )}
      </svg>
      <div style={{ position: "absolute", left: a[0] + 14, top: a[1] - 30, opacity: endLabelO, background: "rgba(11,39,51,0.78)", padding: "3px 8px", fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.1em", color: c.trailLight, whiteSpace: "nowrap" }}>
        A · BASEL · 253 M
      </div>
      <div style={{ position: "absolute", left: b[0] + 14, top: b[1] + 6, opacity: endLabelO, background: "rgba(11,39,51,0.78)", padding: "3px 8px", fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.1em", color: c.trailLight, whiteSpace: "nowrap" }}>
        B · MATTERHORN · 4'448 M
      </div>

      {/* headline */}
      <div style={{ position: "absolute", left: 72, top: 176 }}>
        <Eyebrow text="01 · 41'285 km² · 66 public sources" start={104} exitAt={EXIT} />
        <div style={{ height: 22 }} />
        <WordRise
          text={"Every Swiss\nsource."}
          start={116}
          exitAt={EXIT - 4}
          stagger={5}
          style={{ ...theme.display, fontSize: 100, color: c.snow }}
        />
        <div style={{ height: 26 }} />
        <div style={{ ...enter(frame, fps, 140, { exitAt: EXIT - 2 }), fontFamily: theme.fonts.body, fontSize: 28, lineHeight: 1.35, color: c.glacier, maxWidth: 600 }}>
          Rolled up into one MCP server for your AI agent. Every answer cited.
        </div>
      </div>
    </AbsoluteFill>
  );
};
