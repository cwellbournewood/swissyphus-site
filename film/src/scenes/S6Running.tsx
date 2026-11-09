import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, ease, enter, sp } from "../lib/anim";
import { Eyebrow, WordRise } from "../components/Type";
import { gridLayout } from "../components/SourceGrid";
import { SheetWipe } from "../components/Wipe";

const { colors: c } = theme;
const START = 1512, EXIT = 1852;
const COLS = 5, CW = 222, CH = 44;
const X0 = 1848 - COLS * CW, Y0 = 190;
const CELLS = gridLayout(X0, Y0, COLS, CW, CH);
const ROWS = Math.ceil(CELLS.length / COLS);
const SWEEP: [number, number] = [1566, 1622];
const DOWN_ID = "meteoswiss";
const DOWN: [number, number] = [1630, 1764];

export const S6Running: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweepX = ease(frame, SWEEP, [X0 - 10, X0 + COLS * CW + 10], theme.ease.inOut);
  const sweepO = ease(frame, [SWEEP[0] - 4, SWEEP[0] + 4]) * (1 - ease(frame, [SWEEP[1] - 4, SWEEP[1] + 4]));
  const down = CELLS.find((x) => x.id === DOWN_ID)!;
  const isDown = frame >= DOWN[0] && frame < DOWN[1];
  const calloutS = sp(frame, fps, DOWN[0] + 6, theme.spring.smooth);
  const calloutO = Math.min(1, calloutS * 1.5) * (1 - ease(frame, [DOWN[1] + 4, DOWN[1] + 12], [0, 1], theme.ease.in));
  const out = ease(frame, [EXIT, EXIT + 10], [0, 1], theme.ease.in);

  // the boulder keeps rolling along the bottom rule
  const railY = 958;
  const bx = ease(frame, [START + 10, EXIT + 20], [72, 1848], theme.ease.soft);
  const railP = ease(frame, [START + 4, START + 40], [0, 1], theme.ease.inOut);

  return (
    <AbsoluteFill style={{ opacity: 1 - out * 0.0 }}>
      {/* grid */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        {Array.from({ length: ROWS + 1 }, (_, r) => {
          const p = ease(frame, [START + 2 + r, START + 24 + r], [0, 1], theme.ease.inOut);
          const y = Y0 + r * CH + 0.5;
          return <line key={"h" + r} x1={X0} x2={X0 + COLS * CW * p} y1={y} y2={y} stroke={c.glacier} strokeOpacity={0.22} />;
        })}
        {Array.from({ length: COLS + 1 }, (_, k) => {
          const p = ease(frame, [START + 6 + k * 2, START + 30 + k * 2], [0, 1], theme.ease.inOut);
          const x = X0 + k * CW + 0.5;
          return <line key={"v" + k} x1={x} x2={x} y1={Y0} y2={Y0 + ROWS * CH * p} stroke={c.glacier} strokeOpacity={0.18} />;
        })}
        {/* down cell */}
        {frame >= DOWN[0] && frame < DOWN[1] + 8 && (
          <rect
            x={down.x + 3}
            y={down.y + 3}
            width={CW - 6}
            height={CH - 6}
            fill="rgba(238,243,242,0.08)"
            stroke={c.snow}
            strokeDasharray="5 5"
            strokeDashoffset={-frame * 0.6}
            opacity={1 - ease(frame, [DOWN[1], DOWN[1] + 8])}
          />
        )}
        {/* callout leader */}
        <path
          d={`M${down.x + 0.5} ${down.y + CH} V${Y0 + ROWS * CH + 24} H${X0}`}
          fill="none"
          stroke={c.snow}
          strokeOpacity={0.7 * calloutO}
          strokeDasharray="1000"
          strokeDashoffset={1000 * (1 - ease(frame, [DOWN[0] + 4, DOWN[0] + 22], [0, 1], theme.ease.inOut))}
        />
        {/* canary sweep */}
        {sweepO > 0 && (
          <g opacity={sweepO}>
            <line x1={sweepX} x2={sweepX} y1={Y0 - 26} y2={Y0 + ROWS * CH + 6} stroke={c.snow} strokeWidth={1.5} />
            <path d={`M${sweepX - 6} ${Y0 - 34} L${sweepX + 6} ${Y0 - 34} L${sweepX} ${Y0 - 24} Z`} fill={c.snow} />
          </g>
        )}
      </svg>
      {sweepO > 0 && (
        <div style={{ position: "absolute", left: sweepX + (sweepX > 1500 ? -10 : 10), transform: sweepX > 1500 ? "translateX(-100%)" : undefined, top: Y0 - 44, opacity: sweepO, fontFamily: theme.fonts.mono, fontSize: 12, letterSpacing: "0.12em", color: c.snow, whiteSpace: "nowrap" }}>
          CANARY · EVERY LIVE SOURCE
        </div>
      )}
      {CELLS.map((cell) => {
        const appear = START + 8 + (cell.row + cell.col) * 1.4;
        const s = sp(frame, fps, appear, theme.spring.snappy);
        const checked = sweepX > cell.x + CW * 0.7;
        const checkS = checked ? sp(frame, fps, Math.floor(SWEEP[0] + ((cell.x + CW * 0.7 - X0) / (COLS * CW)) * (SWEEP[1] - SWEEP[0])), theme.spring.bouncy) : 0;
        const thisDown = cell.id === DOWN_ID && isDown;
        return (
          <div
            key={cell.id}
            style={{
              position: "absolute",
              left: cell.x + 12,
              top: cell.cy,
              width: CW - 24,
              transform: `translateY(-50%) translateY(${(1 - s) * 10}px)`,
              opacity: Math.min(1, s * 1.4) * (1 - out),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: theme.fonts.mono,
              fontSize: 13.5,
              color: thisDown ? c.snow : checked ? c.snow : c.glacier,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: 1 }}>{cell.id}</span>
            {thisDown ? (
              <span style={{ fontSize: 11, letterSpacing: "0.1em", opacity: Math.floor(frame / 6) % 2 ? 1 : 0.5 }}>DOWN</span>
            ) : (
              <svg width={14} height={14} viewBox="0 0 14 14" style={{ flex: "none", opacity: checkS > 0 ? 1 : 0 }}>
                <path d="M2 7.5 L5.5 11 L12 3.5" fill="none" stroke={c.glacier} strokeWidth={1.8} strokeDasharray="16" strokeDashoffset={16 * (1 - checkS)} />
              </svg>
            )}
          </div>
        );
      })}

      {/* stale callout */}
      <div
        style={{
          position: "absolute",
          left: X0,
          top: Y0 + ROWS * CH + 40,
          width: COLS * CW,
          opacity: calloutO,
          transform: `translateY(${(1 - calloutS) * 14}px)`,
          display: "flex",
          gap: 28,
          alignItems: "baseline",
        }}
      >
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 20, color: c.snow, whiteSpace: "nowrap" }}>
          "cache_status": <span style={{ color: c.trailLight }}>"stale"</span>,<br />"stale_age_seconds": 240
        </div>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 21, lineHeight: 1.35, color: c.glacier }}>
          Source down? You get the last good answer, clearly marked, with its age.
        </div>
      </div>

      {/* type column */}
      <div style={{ position: "absolute", left: 72, top: 150, width: 700 }}>
        <Eyebrow text="06 — Reliability" start={START + 4} exitAt={EXIT} />
        <div style={{ height: 22 }} />
        <WordRise text={"Always\nrunning."} start={START + 10} exitAt={EXIT} stagger={6} style={{ ...theme.display, fontSize: 104, color: c.snow }} />
        <div style={{ height: 46 }} />
        {[
          ["01", "Caching, with a TTL for every source"],
          ["02", "Circuit breakers: back off on the first rate limit"],
          ["03", "The last good answer when a source is down"],
          ["04", "A nightly canary against every live source"],
        ].map(([n, t], i) => (
          <div
            key={n}
            style={{
              ...enter(frame, fps, START + 36 + i * 7, { exitAt: EXIT + i, rise: 16 }),
              display: "flex",
              gap: 18,
              alignItems: "baseline",
              padding: "14px 0",
              borderTop: `1px solid ${theme.alpha.rule}`,
            }}
          >
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 14, color: c.glacier }}>{n}</span>
            <span style={{ fontFamily: theme.fonts.body, fontSize: 25, color: c.snow }}>{t}</span>
          </div>
        ))}
      </div>

      {/* rail + rolling boulder */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={72} x2={72 + 1776 * railP} y1={railY + 13} y2={railY + 13} stroke={c.glacier} strokeOpacity={0.5 * (1 - out)} />
        <circle cx={bx} cy={railY - 1 + breathe(frame, fps, 0.6, 0.5)} r={11 * ease(frame, [START + 8, START + 20])} fill={c.trail} opacity={1 - out} />
      </svg>
      <div style={{ position: "absolute", left: 72, top: railY + 26, opacity: railP * (1 - out), fontFamily: theme.fonts.mono, fontSize: 13, letterSpacing: "0.1em", color: c.glacier }}>
        THE ROLLUP THAT NEVER STOPS
      </div>

      <SheetWipe start={EXIT + 4} mode="cover" color={c.night} dur={14} stagger={1} />
    </AbsoluteFill>
  );
};
