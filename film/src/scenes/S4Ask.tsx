import React, { useMemo } from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, ease, enter, sp } from "../lib/anim";
import { cameraAt } from "../lib/camera";
import { live, project, toScreen } from "../lib/geo";
import { pointAt, ROUTE, ROUTE_CUM, ROUTE_T, slice, toD, type Pt } from "../lib/paths";
import { Eyebrow, Typewriter } from "../components/Type";
import { Masthead, SheetFooter, SheetFrame } from "../components/Chrome";
import { SheetWipe } from "../components/Wipe";
import { TRAIN } from "../components/Boulder";

const { colors: c } = theme;
// Scene 04 runs 792–1368 (two bars longer than first cut); later scenes play with an offset (timeline.json).
const EXIT = 1324;
const CARD_TOPS = [528, 686, 844];
export const CARD_B = { left: 72, top: CARD_TOPS[1], width: 780, height: 149 };
const SAFE = { glide: 1170, aval: 1206, flood: 1214, alertA: 1222, alertB: 1228, card: 1236 };

const STOPS: Array<{ i: number; name: string; time?: string; side: "l" | "r"; strong?: boolean }> = [
  { i: 0, name: "BERN", time: "13:07", side: "l", strong: true },
  { i: 1, name: "THUN", side: "r" },
  { i: 2, name: "SPIEZ", side: "r" },
  { i: 5, name: "VISP", time: "14:04 → 14:11", side: "r", strong: true },
  { i: 8, name: "ST. NIKLAUS", side: "r" },
  { i: 12, name: "ZERMATT", time: "15:17", side: "l", strong: true },
];

const trainT = (f: number) => ease(f, [TRAIN.start, TRAIN.end], [0, 1], theme.ease.inOut);

const Card: React.FC<{
  top: number;
  start: number;
  exitAt?: number;
  call: string;
  meta: string;
  big: React.ReactNode;
  detail: string;
  src: string;
}> = ({ top, start, exitAt, call, meta, big, detail, src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame, fps, start, theme.spring.smooth);
  const border = ease(frame, [start, start + 18], [0, 1], theme.ease.inOut);
  let o = Math.min(1, s * 1.6);
  if (exitAt !== undefined) o *= 1 - ease(frame, [exitAt, exitAt + 8], [0, 1], theme.ease.in);
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top,
        width: 780,
        padding: "14px 24px 12px",
        background: "rgba(11,39,51,0.88)",
        outline: `1px solid rgba(143,193,196,${0.55 * border})`,
        opacity: o,
        transform: `translateX(${(1 - s) * -40}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.fonts.mono, fontSize: 15, color: c.glacier }}>
        <span>
          → <b style={{ color: c.snow, fontWeight: 600 }}>{call}</b>
        </span>
        <span>{meta}</span>
      </div>
      <div style={{ ...theme.display, fontSize: 44, color: c.snow, lineHeight: 1 }}>{big}</div>
      <div style={{ fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.06em", color: c.glacier }}>{detail}</div>
      <div
        style={{
          marginTop: 2,
          paddingTop: 8,
          borderTop: "1px solid rgba(143,193,196,0.18)",
          fontFamily: theme.fonts.mono,
          fontSize: 13,
          color: c.glacier,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <i style={{ width: 9, height: 9, borderRadius: 9, background: c.glacier, display: "inline-block" }} />
        {src}
      </div>
    </div>
  );
};

export const S4Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame);
  const scr = (p: Pt) => toScreen(cam, p);

  // route pieces in screen space
  const p = trainT(frame);
  const [tE, tB] = [ROUTE_T[live.tunnel[0]], ROUTE_T[live.tunnel[1]]];
  const piece = (a: number, b: number) => (p > a ? toD(slice(ROUTE, ROUTE_CUM, a, Math.min(p, b)).map(scr)) : "");
  const ghostP = ease(frame, [872, 904], [0, 1], theme.ease.inOut);
  const ghostD = toD(slice(ROUTE, ROUTE_CUM, 0, Math.max(0.001, ghostP)).map(scr));
  const routeFade = 1 - ease(frame, [1060, 1100]) * 0.55;

  const snowPt = useMemo(() => project(live.snow.lon, live.snow.lat), []);
  const [gx, gy] = scr(snowPt);
  const snowOn = ease(frame, [1092, 1104]);
  const snowLabelO = snowOn * (1 - ease(frame, [SAFE.glide + 20, SAFE.glide + 30]));
  const stopsO = 1 - ease(frame, [SAFE.glide, SAFE.glide + 26]);

  // safety check (live: SLF, MeteoSwiss, Alertswiss)
  const zermattSt = scr(ROUTE_POINT(12));
  const matterhorn = scr(project(7.6586, 45.9763));
  const blatten = scr(project(7.8197, 46.4203));
  const bagnes = scr(project(7.2167, 46.0833));
  const sIn = (at: number) => sp(frame, fps, at, theme.spring.snappy);

  // card B expands into the paper of the next scene
  const expand = ease(frame, [1334, 1366], [0, 1], theme.ease.inOut);
  const panelO = 1 - ease(frame, [EXIT, EXIT + 10], [0, 1], theme.ease.in);

  const q = "Weekend in Zermatt: next train from Bern, how much snow is up there, and is it safe?";

  return (
    <AbsoluteFill>
      {/* readability gradient for the question column */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,39,51,0.92) 0%, rgba(11,39,51,0.75) 38%, rgba(11,39,51,0) 58%)", opacity: panelO }} />

      {/* route + markers */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={ghostD} fill="none" stroke={c.glacier} strokeOpacity={0.45 * routeFade * panelO} strokeWidth={1.5} strokeDasharray="2 6" strokeLinecap="round" />
        <g fill="none" stroke={c.trail} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={routeFade * panelO}>
          <path d={piece(0, tE)} />
          <path d={piece(tE, tB)} strokeDasharray="4 7" strokeWidth={3} />
          <path d={piece(tB, 1)} />
        </g>
        {/* stops */}
        {STOPS.map((st) => {
          const [x, y] = scr(ROUTE_POINT(st.i));
          const at = TRAIN.start + (ROUTE_T[st.i] ?? 0) * (TRAIN.end - TRAIN.start) * 0.92;
          const s = sp(frame, fps, st.i === 0 ? 818 : at, theme.spring.bouncy);
          return <circle key={st.i} cx={x} cy={y} r={(st.strong ? 6 : 4.5) * s} fill={c.night} stroke={c.snow} strokeWidth={2} opacity={(st.i === 12 ? 1 : routeFade) * panelO} />;
        })}
        {/* snow station */}
        {snowOn > 0 && (
          <g opacity={snowOn * panelO}>
            {[0, 1, 2].map((k) => {
              const ph = ((frame - 1092 + k * 16) % 48) / 48;
              return (
                <g key={k}>
                  <circle cx={gx} cy={gy} r={8 + ph * 46} fill="none" stroke={c.night} strokeOpacity={(1 - ph) * 0.6} strokeWidth={4} />
                  <circle cx={gx} cy={gy} r={8 + ph * 46} fill="none" stroke={c.snow} strokeOpacity={(1 - ph) * 0.9} strokeWidth={1.5} />
                </g>
              );
            })}
            <circle cx={gx} cy={gy} r={9 + breathe(frame, fps, 0.8, 1.5)} fill={c.night} />
            <circle cx={gx} cy={gy} r={6 + breathe(frame, fps, 0.8, 1.5)} fill={c.snow} />
          </g>
        )}
        {/* MeteoSwiss warning area around Zermatt (3920) */}
        {frame >= SAFE.flood && (
          <g opacity={Math.min(1, sIn(SAFE.flood) * 1.4) * panelO}>
            <circle cx={zermattSt[0]} cy={zermattSt[1]} r={70 * sIn(SAFE.flood) + breathe(frame, fps, 2, 2.4)} fill="rgba(238,243,242,0.07)" stroke={c.night} strokeWidth={4} strokeOpacity={0.5} />
            <circle cx={zermattSt[0]} cy={zermattSt[1]} r={70 * sIn(SAFE.flood) + breathe(frame, fps, 2, 2.4)} fill="none" stroke={c.snow} strokeWidth={1.6} strokeDasharray="7 6" strokeDashoffset={-frame * 0.5} />
          </g>
        )}
        {/* Alertswiss alerts elsewhere in Valais */}
        {[
          [blatten, SAFE.alertA],
          [bagnes, SAFE.alertB],
        ].map(([pt, at], i) => {
          const [x, y] = pt as Pt;
          const s = sIn(at as number);
          if (frame < (at as number)) return null;
          return (
            <g key={i} opacity={Math.min(1, s * 1.4) * panelO} transform={`translate(${x} ${y}) rotate(45) scale(${s})`}>
              <rect x={-8} y={-8} width={16} height={16} fill={c.night} stroke={c.snow} strokeWidth={1.8} />
              <rect x={-2.5} y={-2.5} width={5} height={5} fill={c.snow} />
            </g>
          );
        })}
      </svg>

      {/* stop labels */}
      {STOPS.map((st) => {
        const [x, y] = scr(ROUTE_POINT(st.i));
        const at = st.i === 0 ? 824 : TRAIN.start + (ROUTE_T[st.i] ?? 0) * (TRAIN.end - TRAIN.start) * 0.92 + 4;
        const s = sp(frame, fps, at, theme.spring.snappy);
        const o = Math.min(1, s * 1.5) * (st.i === 12 ? 1 : routeFade) * stopsO * panelO;
        if (o <= 0.01) return null;
        return (
          <div
            key={st.i}
            style={{
              position: "absolute",
              top: y - 10,
              ...(st.side === "r" ? { left: x + 16 } : { right: 1920 - x + 16 }),
              opacity: o,
              transform: `translateX(${(1 - s) * (st.side === "r" ? -10 : 10)}px)`,
              fontFamily: theme.fonts.mono,
              fontSize: st.strong ? 15 : 13,
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: st.strong ? c.snow : c.glacier,
              whiteSpace: "nowrap",
              background: "rgba(11,39,51,0.78)",
              padding: "3px 8px",
              textAlign: st.side === "r" ? "left" : "right",
              lineHeight: 1.35,
            }}
          >
            {st.name}
            {st.time && <div style={{ color: c.trailLight, fontWeight: 400 }}>{st.time}</div>}
          </div>
        );
      })}
      {/* tunnel label */}
      {(() => {
        const mid = scr(ROUTE_POINT_T((tE + tB) / 2));
        const at = TRAIN.start + ((tE + tB) / 2) * (TRAIN.end - TRAIN.start);
        const s = sp(frame, fps, at, theme.spring.snappy);
        return (
          <div style={{ position: "absolute", left: mid[0] + 22, top: mid[1] - 8, opacity: Math.min(1, s * 1.5) * routeFade * panelO, fontFamily: theme.fonts.mono, fontSize: 12, letterSpacing: "0.1em", color: c.glacier, whiteSpace: "nowrap", background: "rgba(11,39,51,0.78)", padding: "3px 8px" }}>
            LÖTSCHBERG BASE TUNNEL · 34.6 KM
          </div>
        );
      })()}
      {/* zermatt + station labels */}
      <div style={{ position: "absolute", left: gx + 22, top: gy - 24, opacity: snowLabelO * panelO, fontFamily: theme.fonts.mono, fontSize: 15, fontWeight: 500, letterSpacing: "0.1em", color: c.snow, lineHeight: 1.4, whiteSpace: "nowrap", background: "rgba(11,39,51,0.82)", padding: "6px 10px" }}>
        GOR2 · GORNERGRATSEE
        <div style={{ color: c.glacier, fontWeight: 400 }}>IMIS STATION · 2'953 M</div>
      </div>

      {/* safety chips */}
      {[
        { at: SAFE.flood + 4, pos: { left: zermattSt[0] + 84, top: zermattSt[1] - 28 }, k: "METEOSWISS · 3920 ZERMATT", v: "FLOOD WARNING · LEVEL 3" },
        { at: SAFE.aval, pos: { right: 1920 - matterhorn[0] + 18, top: matterhorn[1] - 2 }, k: "SLF · AVALANCHE BULLETIN", v: "NONE PUBLISHED YET", tri: true },
        { at: SAFE.alertA + 3, pos: { left: blatten[0] + 20, top: blatten[1] - 24 }, k: "ALERTSWISS · LÖTSCHENTAL", v: "ROCKFALL ZONE CLOSED" },
        { at: SAFE.alertB + 3, pos: { left: bagnes[0] + 20, top: bagnes[1] - 24 }, k: "ALERTSWISS · VAL DE BAGNES", v: "MUDSLIDES" },
      ].map((chip) => {
        const s = sIn(chip.at);
        if (frame < chip.at) return null;
        return (
          <div
            key={chip.k}
            style={{
              position: "absolute",
              ...chip.pos,
              opacity: Math.min(1, s * 1.5) * panelO,
              transform: `translateY(${(1 - s) * 10}px)`,
              fontFamily: theme.fonts.mono,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: c.glacier,
              lineHeight: 1.45,
              whiteSpace: "nowrap",
              background: "rgba(11,39,51,0.86)",
              outline: `1px solid ${theme.alpha.rule}`,
              padding: "6px 10px",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            {chip.tri && (
              <svg width={18} height={16} viewBox="0 0 18 16">
                <path d="M9 1.5 L16.5 14.5 H1.5 Z" fill="none" stroke={c.snow} strokeWidth={1.6} strokeLinejoin="round" />
                <path d="M9 6 V10 M9 12 V12.6" stroke={c.snow} strokeWidth={1.6} strokeLinecap="round" />
              </svg>
            )}
            <div>
              {chip.k}
              <div style={{ color: c.snow }}>{chip.v}</div>
            </div>
          </div>
        );
      })}

      <SheetFrame start={800} exitAt={EXIT} />
      <Masthead start={804} exitAt={EXIT} label="Ask anything Swiss" />
      <SheetFooter start={820} exitAt={EXIT} credits="ROUTE FROM get_connections · BORDER © SWISSTOPO · TERRAIN: MAPZEN" />

      {/* question column */}
      <div style={{ position: "absolute", left: 72, top: 160, width: 790, opacity: panelO }}>
        <Eyebrow text="04 — A weekend in Zermatt · Mon 9 Nov, 12:43" start={806} />
        <div style={{ height: 20 }} />
        <div style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 44, lineHeight: 1.12, letterSpacing: "-0.02em", color: c.snow, minHeight: 148 }}>
          <Typewriter text={q} start={814} cps={1.9} />
        </div>
        <div style={{ height: 16 }} />
        {[
          { call: "get_connections", args: "from: Bern · to: Zermatt", at: 862, done: 958 },
          { call: "get_snow_conditions", args: "station_code: GOR2", at: 867, done: 1106 },
          { call: "get_avalanche_danger_at", args: "Zermatt", at: 872, done: SAFE.aval + 4 },
          { call: "get_weather_warnings", args: "plz: 3920", at: 877, done: SAFE.flood + 6 },
          { call: "get_emergency_alerts", args: "Switzerland", at: 882, done: SAFE.alertB + 6 },
        ].map((t) => {
          const done = frame >= t.done;
          const spin = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(frame / 2) % 10];
          return (
            <div key={t.call} style={{ ...enter(frame, fps, t.at, { rise: 12 }), display: "flex", gap: 14, fontFamily: theme.fonts.mono, fontSize: 16, lineHeight: 1.85, color: c.glacier }}>
              <span style={{ color: c.snow, fontWeight: 500 }}>→ {t.call}</span>
              <span>{t.args}</span>
              <span style={{ marginLeft: "auto", color: done ? c.snow : c.glacier }}>{done ? "✓ cited" : spin}</span>
            </div>
          );
        })}
      </div>

      <Card
        top={CARD_TOPS[0]}
        start={958}
        exitAt={EXIT}
        call="get_connections"
        meta="Bern → Zermatt"
        big={<>13:07 → 15:17</>}
        detail="IC 8 TO VISP · R 41 (MGB) TO ZERMATT · 2 H 10 · 1 CHANGE"
        src="Swiss timetable · transport.opendata.ch"
      />
      <Card
        top={CARD_B.top}
        start={1104}
        exitAt={1330}
        call="get_snow_conditions"
        meta="GOR2 · measured 12:30"
        big={<>22 cm at 2'953 m</>}
        detail="GORNERGRATSEE · AIR +0.1 °C · SNOW SURFACE −1.7 °C"
        src="© SLF/WSL IMIS · data_as_of 2026-11-09T11:30:00Z"
      />
      <Card
        top={CARD_TOPS[2]}
        start={SAFE.card}
        exitAt={EXIT}
        call="safety check"
        meta="Zermatt · 3920"
        big={<>Flood warning · level 3</>}
        detail="SLF: NO AVALANCHE BULLETIN YET · ALERTSWISS: NONE FOR ZERMATT"
        src="© MeteoSwiss · © SLF/WSL · © Alertswiss / FOCP"
      />

      {/* expansion into paper */}
      {expand > 0 && (
        <div
          style={{
            position: "absolute",
            left: CARD_B.left * (1 - expand),
            top: CARD_B.top * (1 - expand),
            width: CARD_B.width + (1920 - CARD_B.width) * expand,
            height: CARD_B.height + (1080 - CARD_B.height) * expand,
            background: interpolateColors(expand, [0, 0.25, 1], [c.lake, c.snow, c.snow]),
            outline: `1px solid ${c.glacier}`,
          }}
        />
      )}

      <SheetWipe start={792} mode="reveal" color={c.night} dur={18} stagger={2} />
    </AbsoluteFill>
  );
};

const ROUTE_POINT = (i: number): Pt => project(...(live.route[i] as [number, number]));
const ROUTE_POINT_T = (t: number): Pt => pointAt(ROUTE, ROUTE_CUM, t);
