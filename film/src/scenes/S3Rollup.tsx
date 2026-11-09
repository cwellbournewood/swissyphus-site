import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, enter, sp } from "../lib/anim";
import { Counter, Eyebrow, WordRise } from "../components/Type";
import { gridLayout, SOURCES } from "../components/SourceGrid";
import { ROLLUP } from "../components/Boulder";

const { colors: c } = theme;
const COLS = 6, CW = 250, CH = 50;
const X0 = (1920 - COLS * CW) / 2;
const Y0 = 300;
const ROWS = Math.ceil(SOURCES.length / COLS);
const CELLS = gridLayout(X0, Y0, COLS, CW, CH);
const EXIT = 778;

export const S3Rollup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [hx, hy] = ROLLUP.home;
  const [a0] = ROLLUP.absorb;
  const absorbAt = (row: number) => a0 + row * 4.2;
  const absorbed = CELLS.filter((cell) => frame >= absorbAt(cell.row) + 12).length;

  // rules
  const hRules = Array.from({ length: ROWS + 1 }, (_, r) => r);
  const vRules = Array.from({ length: COLS + 1 }, (_, k) => k);
  const ruleCollapse = ease(frame, [a0, a0 + 52], [0, 1], theme.ease.in);

  return (
    <AbsoluteFill>
      {/* index grid rules */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {hRules.map((r) => {
          const p = ease(frame, [584 + r * 2, 606 + r * 2], [0, 1], theme.ease.inOut);
          const gone = ease(frame, [absorbAt(r) + 2, absorbAt(r) + 14], [0, 1], theme.ease.in);
          const w = COLS * CW * p * (1 - gone);
          const y = Y0 + r * CH + 0.5;
          return <line key={r} x1={960 - w / 2} x2={960 + w / 2} y1={y} y2={y} stroke={c.glacier} strokeOpacity={0.28} />;
        })}
        {vRules.map((k) => {
          const p = ease(frame, [590 + k * 3, 620 + k * 3], [0, 1], theme.ease.inOut);
          const x = X0 + k * CW + 0.5;
          const h = ROWS * CH * p * (1 - ruleCollapse);
          return <line key={k} x1={x} x2={x} y1={Y0 + ROWS * CH - (ROWS * CH * p)} y2={Y0 + ROWS * CH - (ROWS * CH * p) + h} stroke={c.glacier} strokeOpacity={0.22} />;
        })}
      </svg>

      {/* source ids */}
      {CELLS.map((cell) => {
        const appear = 592 + (cell.row + cell.col) * 2.1;
        const s = sp(frame, fps, appear, theme.spring.snappy);
        const at = absorbAt(cell.row) + (cell.col % 3) * 0.8;
        const t = ease(frame, [at, at + 14], [0, 1], theme.ease.in);
        if (t >= 1) return null;
        const x = cell.x + 18 + (hx - (cell.x + 18)) * t;
        const y = cell.cy + (hy - cell.cy) * t;
        const sc = 1 - t * 0.85;
        return (
          <div
            key={cell.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translateY(-50%) translateY(${(1 - s) * 14}px) scale(${sc})`,
              transformOrigin: "0 50%",
              opacity: Math.min(1, s * 1.4) * (1 - t * t),
              fontFamily: theme.fonts.mono,
              fontSize: 17,
              letterSpacing: "0.02em",
              color: frame > appear + 8 ? c.snow : c.glacier,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: c.contour, marginRight: 10, fontSize: 13 }}>{String(cell.i + 1).padStart(2, "0")}</span>
            {cell.id}
          </div>
        );
      })}

      {/* labels */}
      <div style={{ position: "absolute", left: 72, top: 140 }}>
        <Eyebrow text="03 — The rollup" start={584} exitAt={EXIT} />
      </div>
      <div style={{ position: "absolute", right: 72, top: 136, textAlign: "right", ...enter(frame, fps, 590, { exitAt: a0 + 30 }) }}>
        <div style={{ ...theme.display, fontSize: 64, color: c.snow }}>
          <Counter to={66} start={592} dur={36} pad={2} />
        </div>
        <div style={{ ...theme.eyebrow, fontSize: 14, color: c.glacier, marginTop: 8 }}>public sources, live</div>
      </div>

      {/* after the rollup */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 528, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <WordRise
          text={"66 public sources.\nOne MCP server."}
          start={720}
          exitAt={EXIT}
          stagger={4}
          style={{ ...theme.display, fontSize: 92, color: c.snow, alignItems: "center", textAlign: "center" }}
          lineStyles={[{ justifyContent: "center" }, { justifyContent: "center", color: c.glacier }]}
        />
        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {["151 tools", "zero API keys", "every answer cited"].map((t, i) => (
            <div
              key={t}
              style={{
                ...enter(frame, fps, 734 + i * 4, { exitAt: EXIT + i, rise: 16 }),
                ...theme.eyebrow,
                fontSize: 16,
                color: c.snow,
                border: `1px solid ${theme.alpha.ruleStrong}`,
                borderRadius: 99,
                padding: "10px 22px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      {absorbed > 0 && frame < a0 + 60 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: hy + 52, textAlign: "center", ...theme.eyebrow, fontSize: 14, color: c.glacier, opacity: 1 - ease(frame, [a0 + 50, a0 + 58]) }}>
          rolled up · <span style={{ fontVariantNumeric: "tabular-nums", color: c.snow }}>{String(absorbed).padStart(2, "0")}</span> / 66
        </div>
      )}
    </AbsoluteFill>
  );
};
