import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, ease, enter, sp } from "../lib/anim";
import { Typewriter } from "../components/Type";
import { SheetFrame } from "../components/Chrome";

const { colors: c } = theme;
const START = 1872, END = 2268;

// Mark geometry on its 38-unit grid: slope M0 38 H38 V13 Z, boulder r=8 at (28, 8).
const D = [38, -25];
const DL = Math.hypot(D[0], D[1]);
const DIR = [D[0] / DL, D[1] / DL];
const NORM = [DIR[1], -DIR[0]]; // up-left normal
const OFF = 8 + 1.68; // the boulder never touches the slope
const U_END = (28 - 0) * DIR[0] + (8 - 38) * DIR[1]; // ≈ 39.85

const boulderOnSlope = (u: number) => [DIR[0] * u + NORM[0] * OFF, 38 + DIR[1] * u + NORM[1] * OFF];

export const S8End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const SIZE = 236;
  const k = SIZE / 38;

  const slope = sp(frame, fps, START + 6, theme.spring.smooth);
  // one continuous roll: a gentle push, a long deceleration, and it comes to rest exactly in place (no overshoot)
  const rollT = ease(frame, [START + 16, START + 72], [0, 1], Easing.bezier(0.33, 0, 0.12, 1));
  const u = 7 + (U_END - 7) * rollT;
  const [bx, by] = boulderOnSlope(u);
  const bR = 8 * ease(frame, [START + 14, START + 22]);
  const fadeOut = ease(frame, [END - 54, END], [0, 1], theme.ease.inOut); // a slow 1.8 s fade with the music

  const word = "swissyphus";

  return (
    <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
      <SheetFrame start={START + 4} />
      <div style={{ position: "absolute", left: 300, top: 318, display: "flex", gap: 72, alignItems: "flex-start" }}>
        {/* the mark, built */}
        <svg width={SIZE} height={SIZE} viewBox="0 0 38 38" style={{ overflow: "visible", marginTop: 8, transform: `translateY(${breathe(frame, fps, 2, 5)}px)` }}>
          <path d="M0 38H38V13Z" fill={c.glacier} style={{ transformOrigin: "0px 38px", transform: `scale(${slope})` }} />
          <circle cx={bx} cy={by} r={bR} fill={c.trail} />
        </svg>
        <div>
          <div style={{ display: "flex", fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 132, letterSpacing: "-0.035em", color: c.snow, lineHeight: 1 }}>
            {word.split("").map((ch, i) => {
              const s = sp(frame, fps, START + 30 + i * 2, theme.spring.snappy);
              return (
                <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - s) * 100}%)` }}>{ch}</span>
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 34, ...theme.display, fontSize: 62, lineHeight: 1 }}>
            <div style={{ ...enter(frame, fps, START + 52, { rise: 20 }), color: c.snow }}>Every Swiss source.</div>
            <div style={{ ...enter(frame, fps, START + 60, { rise: 20 }), color: c.trailLight, marginTop: 6 }}>Rolled up for you.</div>
          </div>
          <div
            style={{
              ...enter(frame, fps, START + 74, { rise: 12 }),
              marginTop: 40,
              display: "inline-block",
              fontFamily: theme.fonts.mono,
              fontSize: 28,
              color: c.snow,
              background: c.lake,
              outline: `1px solid ${theme.alpha.ruleStrong}`,
              padding: "14px 26px",
            }}
          >
            <span style={{ color: c.trailLight }}>$ </span>
            <Typewriter text="npx -y swissyphus" start={START + 80} cps={1.3} caretColor={c.snow} showCaretAfter />
          </div>
          <div style={{ ...enter(frame, fps, START + 92, { rise: 10 }), marginTop: 26, fontFamily: theme.fonts.mono, fontSize: 16, letterSpacing: "0.08em", color: c.glacier, lineHeight: 1.7 }}>
            MCP SERVER + REST API · 151 TOOLS · 66 PUBLIC SOURCES · MIT
            <br />
            <span style={{ color: c.snow }}>github.com/cwellbournewood/swissyphus</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 72, bottom: 64, ...enter(frame, fps, START + 110, { rise: 8 }), fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.12em", color: c.glacier }}>
        1:25'000 · CH · 2026
      </div>
      <div style={{ position: "absolute", right: 72, bottom: 64, ...enter(frame, fps, START + 122, { rise: 8 }), fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.12em", color: c.glacier }}>
        ONE MUST IMAGINE THE API HAPPY.
      </div>
    </AbsoluteFill>
  );
};
