import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, enter, sp } from "../lib/anim";
import { Counter, Eyebrow, Typewriter, WordRise } from "../components/Type";
import { SheetWipe } from "../components/Wipe";
import { SheetFrame } from "../components/Chrome";
import { DataPins } from "../components/DataPins";

const { colors: c } = theme;
const START = 1728, END = 2016;

const STATS: Array<{ to: number; from?: number; label: string; suffix?: string }> = [
  { to: 151, label: "Tools" },
  { to: 66, label: "Public sources" },
  { to: 15000, label: "Datasets, layers & tables", suffix: "+" },
  { to: 0, from: 12, label: "API keys" },
];

export const S7Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const band = sp(frame, fps, START + 14, theme.spring.smooth);
  const grow = ease(frame, [END - 22, END], [0, 1], theme.ease.inOut);
  const bandTop = 812 + (1 - band) * 280 - grow * 812;
  const EXIT = END - 24;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(100deg, rgba(11,39,51,0.85) 0%, rgba(11,39,51,0.4) 34%, rgba(11,39,51,0) 52%)" }} />
      <DataPins start={START} exitAt={EXIT - 6} />
      <SheetFrame start={START + 6} exitAt={EXIT} />
      <div style={{ position: "absolute", left: 72, top: 140 }}>
        <Eyebrow text="07 · Zero friction" start={START + 10} exitAt={EXIT} />
        <div style={{ height: 22 }} />
        <WordRise text={"One command.\nNo signup."} start={START + 16} exitAt={EXIT} stagger={4} style={{ ...theme.display, fontSize: 76, color: c.snow }} />
        <div style={{ height: 30 }} />
        <div
          style={{
            ...enter(frame, fps, START + 30, { exitAt: EXIT, rise: 14 }),
            display: "inline-block",
            fontFamily: theme.fonts.mono,
            fontSize: 26,
            color: c.snow,
            background: c.lake,
            outline: `1px solid ${theme.alpha.ruleStrong}`,
            padding: "14px 24px",
          }}
        >
          <span style={{ color: c.trailLight }}>$ </span>
          <Typewriter text="npx -y swissyphus" start={START + 36} cps={1.2} caretColor={c.snow} />
        </div>
        <div style={{ ...enter(frame, fps, START + 44, { exitAt: EXIT, rise: 10 }), marginTop: 18, fontFamily: theme.fonts.body, fontSize: 22, color: c.glacier, maxWidth: 560, lineHeight: 1.4 }}>
          Claude, Cursor, VS Code, any MCP client. Or self-host the REST API.
        </div>
      </div>

      {/* stats band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: bandTop,
          bottom: 0,
          background: interpolateColors(grow, [0, 1], [c.lake, c.night]),
          borderTop: `1px solid ${theme.alpha.ruleStrong}`,
          display: "flex",
        }}
      >
        {STATS.map((s, i) => {
          const at = START + 22 + i * 6;
          const o = Math.min(1, sp(frame, fps, at, theme.spring.smooth) * 1.4) * (1 - ease(frame, [EXIT + i, EXIT + 8 + i], [0, 1], theme.ease.in));
          return (
            <div key={s.label} style={{ flex: `0 0 ${[430, 430, 640, 420][i]}px`, padding: `34px 0 0 ${i ? 48 : 72}px`, borderLeft: i ? `1px solid rgba(143,193,196,0.25)` : undefined, opacity: o }}>
              <div style={{ ...theme.display, fontSize: 96, color: c.snow, transform: `translateY(${(1 - o) * 24}px)` }}>
                <Counter to={s.to} from={s.from ?? 0} start={at} dur={60} suffix={s.suffix} />
              </div>
              <div style={{ ...theme.eyebrow, fontSize: 15, color: c.glacier, marginTop: 16 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <SheetWipe start={START + 2} mode="reveal" color={c.night} dur={18} stagger={2} />
    </AbsoluteFill>
  );
};
