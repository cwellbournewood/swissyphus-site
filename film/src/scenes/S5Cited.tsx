import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, enter, sp } from "../lib/anim";
import { Eyebrow, WordRise } from "../components/Type";
import { Masthead, SheetFrame } from "../components/Chrome";
import { SheetWipe } from "../components/Wipe";
import { BgMesh, Hatch } from "../components/Layers";

const { colors: c } = theme;
const EXIT = 1488;

// The real envelope returned by get_snow_conditions (GOR2) on 9 Nov 2026, trimmed for the screen.
const JSON_LINES = [
  `{`,
  `  "data": {`,
  `    "measurements": [{`,
  `      "station_code": "GOR2",`,
  `      "measured_at": "2026-11-09T11:30:00Z",`,
  `      "snow_depth_cm": 21.632,`,
  `      "air_temp_c": 0.097`,
  `    }]`,
  `  },`,
  `  "source": {`,
  `    "name": "SLF IMIS measurement network",`,
  `    "operator": "WSL Institute for Snow and Avalanche Research SLF",`,
  `    "licence": "© SLF/WSL IMIS — publicly accessible measurements; …",`,
  `    "attribution": "© SLF/WSL IMIS"`,
  `  },`,
  `  "retrieved_at": "2026-11-09T11:43:56.449Z",`,
  `  "data_as_of": "2026-11-09T11:30:00Z",`,
  `  "cache_status": "miss",`,
  `  "provenance": {`,
  `    "upstream": [{`,
  `      "url": "https://measurement-api.slf.ch/public/api/imis/measurements"`,
  `    }]`,
  `  }`,
  `}`,
];

const PANEL = { left: 884, top: 150, width: 964, pad: 30, lh: 31 };
const lineY = (i: number) => PANEL.top + PANEL.pad + i * PANEL.lh;

const NOTES: Array<{ n: string; title: string; body: string; lines: [number, number]; at: number; accent?: boolean }> = [
  { n: "01", title: "source", body: "Who published it, under which licence, and how to credit it.", lines: [9, 14], at: 1306 },
  { n: "02", title: "data_as_of", body: "The publisher's own timestamp. Never the fetch time in disguise.", lines: [16, 16], at: 1340 },
  { n: "03", title: "cache_status", body: "Fresh, cached, or stale with its age when a source is down.", lines: [17, 17], at: 1372 },
  { n: "04", title: "provenance.upstream", body: "The exact request behind the answer, so anyone can re-run it.", lines: [18, 22], at: 1404, accent: true },
];

const Token: React.FC<{ line: string }> = ({ line }) => {
  const m = line.match(/^(\s*)("[^"]+")(:\s?)(.*)$/);
  if (!m) return <span style={{ color: c.ink2 }}>{line}</span>;
  const [, ind, key, colon, rest] = m;
  const isStr = rest.trim().startsWith('"');
  const isNum = /^-?\d/.test(rest.trim());
  return (
    <span>
      {ind}
      <span style={{ color: c.lake, fontWeight: 600 }}>{key}</span>
      <span style={{ color: c.ink2 }}>{colon}</span>
      <span style={{ color: isStr ? c.contour : isNum ? c.trailInk : c.ink2 }}>{rest}</span>
    </span>
  );
};

export const S5Cited: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const border = ease(frame, [1232, 1268], [0, 1], theme.ease.inOut);
  const perim = 2 * (PANEL.width + JSON_LINES.length * PANEL.lh + PANEL.pad * 2);
  const ph = JSON_LINES.length * PANEL.lh + PANEL.pad * 2;
  const out = ease(frame, [EXIT - 6, EXIT + 4], [0, 1], theme.ease.in);

  return (
    <AbsoluteFill>
      <BgMesh paper />
      <Hatch paper />
      <SheetFrame start={1226} dark={false} exitAt={EXIT} />
      <Masthead start={1228} exitAt={EXIT} label="Provenance" dark={false} coords="ENVELOPE · get_snow_conditions · GOR2" />

      {/* headline column */}
      <div style={{ position: "absolute", left: 72, top: 168, width: 760 }}>
        <Eyebrow text="05 — The envelope" start={1232} exitAt={EXIT} color={c.trailInk} />
        <div style={{ height: 22 }} />
        <WordRise text={"Every answer\ncited."} start={1238} exitAt={EXIT - 2} stagger={5} style={{ ...theme.display, fontSize: 82, color: c.lake }} />
        <div style={{ height: 22 }} />
        <div style={{ ...enter(frame, fps, 1256, { exitAt: EXIT }), fontFamily: theme.fonts.body, fontSize: 28, lineHeight: 1.35, color: c.ink2 }}>
          All 151 tools return the same envelope. This is the real one behind the snow answer.
        </div>
      </div>

      {/* annotations */}
      {NOTES.map((n, i) => {
        const s = sp(frame, fps, n.at, theme.spring.smooth);
        const o = Math.min(1, s * 1.4) * (1 - out);
        const y = 552 + i * 92;
        const ty = (lineY(n.lines[0]) + lineY(n.lines[1]) + PANEL.lh) / 2;
        const lp = ease(frame, [n.at + 4, n.at + 22], [0, 1], theme.ease.inOut);
        const x0 = 812, x1 = PANEL.left - 2;
        const midX = x0 + 30;
        const dPath = `M${x0} ${y + 16} H${midX} L${midX + 14} ${ty} H${x1}`;
        const len = 30 + Math.hypot(14, ty - y - 16) + (x1 - midX - 14);
        return (
          <React.Fragment key={n.n}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o }}>
              <path d={dPath} fill="none" stroke={n.accent ? c.trail : c.lake} strokeWidth={1} strokeDasharray={`${len * lp} ${len}`} />
              <circle cx={x1} cy={ty} r={3.5 * lp} fill={n.accent ? c.trail : c.lake} />
            </svg>
            <div style={{ position: "absolute", left: 72, top: y, width: 730, opacity: o, transform: `translateY(${(1 - s) * 18}px)`, display: "flex", gap: 18 }}>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: 15, color: n.accent ? c.trailInk : c.contour, paddingTop: 4 }}>{n.n}</span>
              <div>
                <div style={{ fontFamily: theme.fonts.mono, fontWeight: 600, fontSize: 19, color: n.accent ? c.trailInk : c.lake }}>{n.title}</div>
                <div style={{ fontFamily: theme.fonts.body, fontSize: 21, lineHeight: 1.35, color: c.ink2, marginTop: 4 }}>{n.body}</div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* envelope panel */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        <rect x={PANEL.left + 0.5} y={PANEL.top + 0.5} width={PANEL.width} height={ph} fill="rgba(238,243,242,0.82)" stroke={c.lake} strokeWidth={1} strokeDasharray={`${perim * border} ${perim}`} />
        {/* highlight bands */}
        {NOTES.map((n) => {
          const p = ease(frame, [n.at + 10, n.at + 28], [0, 1], theme.ease.inOut);
          const y0 = lineY(n.lines[0]) - 3;
          const h = (n.lines[1] - n.lines[0] + 1) * PANEL.lh + 2;
          return (
            <rect
              key={n.n}
              x={PANEL.left + 14}
              y={y0}
              width={(PANEL.width - 28) * p}
              height={h}
              fill={n.accent ? "rgba(217,123,79,0.16)" : "rgba(143,193,196,0.32)"}
            />
          );
        })}
        {/* accent underline on the upstream URL */}
        {(() => {
          const p = ease(frame, [1420, 1452], [0, 1], theme.ease.inOut);
          const y = lineY(20) + PANEL.lh - 4;
          return <line x1={PANEL.left + 30 + 6 * 11.4} x2={PANEL.left + 30 + 6 * 11.4 + 68 * 11.4 * p} y1={y} y2={y} stroke={c.trail} strokeWidth={2.5} />;
        })()}
      </svg>
      <div style={{ position: "absolute", left: PANEL.left + PANEL.pad, top: PANEL.top + PANEL.pad - 3, fontFamily: theme.fonts.mono, fontSize: 19, lineHeight: `${PANEL.lh}px`, whiteSpace: "pre", opacity: 1 - out }}>
        {JSON_LINES.map((l, i) => {
          const at = 1246 + i * 2.2;
          const s = ease(frame, [at, at + 10], [0, 1], theme.ease.out);
          return (
            <div key={i} style={{ opacity: s, transform: `translateX(${(1 - s) * 16}px)`, height: PANEL.lh }}>
              <Token line={l} />
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div
        style={{
          position: "absolute",
          left: PANEL.left,
          top: PANEL.top + ph + 22,
          ...enter(frame, fps, 1446, { exitAt: EXIT, rise: 10 }),
          fontFamily: theme.fonts.mono,
          fontSize: 14,
          letterSpacing: "0.08em",
          color: c.contour,
        }}
      >
        <span style={{ color: c.lake, fontWeight: 600 }}>list_sources</span> → THE LICENCE REGISTER FOR ALL 66 SOURCES, ONE CALL AWAY
      </div>

      <SheetWipe start={EXIT - 4} mode="cover" color={c.night} dur={16} stagger={2} />
    </AbsoluteFill>
  );
};
