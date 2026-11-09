import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { ease, enter, sp, swiss } from "../lib/anim";
import { SECTION } from "../lib/camera";
import { elevAtX, envelope, PROFILE, secX, secY, toD } from "../lib/paths";
import { live } from "../lib/geo";
import { Eyebrow, WordRise } from "../components/Type";
import { rollX } from "../components/Boulder";

const { colors: c } = theme;
const EXIT = 556;

const FEATURES: Array<{ km: number; label: string; below?: boolean }> = [
  { km: 26, label: "JURA" },
  { km: 62, label: "MITTELLAND" },
  { km: 126.2, label: "BERNESE ALPS" },
  { km: 139, label: "RHÔNE VALLEY", below: true },
];

export const S2Myth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const k = sp(frame, fps, 348, theme.spring.smooth); // extrusion
  const out = ease(frame, [EXIT, EXIT + 18], [0, 1], theme.ease.in);
  const areaD = useMemo(() => toD(PROFILE) + `L${SECTION.x1} ${SECTION.base}L${SECTION.x0} ${SECTION.base}Z`, []);
  const lineD = useMemo(() => toD(PROFILE), []);

  const bx = rollX(frame);
  const by = envelope(bx);
  const rolling = frame >= 372 && frame < 600;
  const elev = elevAtX(bx);
  const km = ((bx - SECTION.x0) / (SECTION.x1 - SECTION.x0)) * (live.profile.total_m / 1000);
  const tagO = ease(frame, [372, 384]) * (1 - ease(frame, [EXIT - 10, EXIT], [0, 1], theme.ease.in));
  const atSummit = frame >= 528;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="secFill" x1="0" y1={SECTION.top} x2="0" y2={SECTION.base} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={c.glacier} stopOpacity={0.5} />
            <stop offset="0.45" stopColor={c.contour} stopOpacity={0.38} />
            <stop offset="1" stopColor={c.lake} stopOpacity={0.15} />
          </linearGradient>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(105)">
            <line x1="0" y1="0" x2="0" y2="14" stroke={c.glacier} strokeOpacity={0.16} strokeWidth={1} />
          </pattern>
        </defs>

        {/* elevation grid */}
        <g opacity={1 - out}>
          {[1000, 2000, 3000].map((e, i) => {
            const p = ease(frame, [352 + i * 5, 382 + i * 5], [0, 1], theme.ease.inOut);
            const y = secY(e);
            return (
              <g key={e}>
                <line x1={SECTION.x0} x2={SECTION.x0 + (SECTION.x1 - SECTION.x0) * p} y1={y} y2={y} stroke={c.glacier} strokeOpacity={0.18} strokeDasharray="2 6" />
                <text x={SECTION.x0 - 14} y={y + 4} textAnchor="end" fontFamily="IBM Plex Mono" fontSize={13} fill={c.glacier} opacity={p} letterSpacing="0.06em">
                  {swiss(e)} M
                </text>
              </g>
            );
          })}
          {/* distance ticks */}
          {[0, 25, 50, 75, 100, 125, 150, 175].map((d, i) => {
            const x = secX(d * 1000);
            const o = ease(frame, [360 + i * 3, 372 + i * 3]);
            return (
              <g key={d} opacity={o}>
                <line x1={x} x2={x} y1={SECTION.base} y2={SECTION.base + 10} stroke={c.glacier} strokeOpacity={0.6} />
                <text x={x} y={SECTION.base + 30} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={13} fill={c.glacier} letterSpacing="0.06em">
                  {d} KM
                </text>
              </g>
            );
          })}
        </g>

        {/* the section, extruded from the transect */}
        <g style={{ transformOrigin: `0px ${SECTION.base}px`, transform: `translateY(${out * 140}px) scaleY(${k * (1 - out * 0.6)})` }} opacity={1 - out}>
          <path d={areaD} fill="url(#secFill)" />
          <path d={areaD} fill="url(#hatch)" />
          <path d={lineD} fill="none" stroke={c.snow} strokeWidth={2.2} strokeLinejoin="round" />
        </g>
        <line x1={SECTION.x0} x2={SECTION.x1} y1={SECTION.base} y2={SECTION.base} stroke={c.glacier} strokeOpacity={0.7 * (1 - out)} strokeWidth={1} />

        {/* altimeter drop-line */}
        {rolling && tagO > 0 && (
          <line x1={bx} x2={bx} y1={by + 22} y2={SECTION.base} stroke={c.trailLight} strokeOpacity={0.5 * tagO} strokeDasharray="3 5" />
        )}

        {/* feature labels: appear as the boulder passes */}
        {FEATURES.map((f, i) => {
          const x = secX(f.km * 1000);
          const e = elevAtX(x);
          const y = secY(e);
          let at = 372;
          while (at < 600 && rollX(at) < x - 40) at++;
          const s = sp(frame, fps, at, theme.spring.snappy);
          const o = Math.min(1, s * 1.5) * (1 - out);
          const ly = f.below ? SECTION.base - 34 : y - 46 - (i % 2) * 14;
          return (
            <g key={f.label} opacity={o}>
              <line x1={x} x2={x} y1={f.below ? y + 8 : y - 8} y2={f.below ? ly - 16 : ly + 8} stroke={c.snow} strokeOpacity={0.55} />
              <text
                x={x}
                y={ly}
                textAnchor="middle"
                fontFamily="IBM Plex Mono"
                fontWeight={500}
                fontSize={14}
                letterSpacing="0.12em"
                fill={c.snow}
                style={{ transform: `translateY(${(1 - s) * 10}px)` }}
              >
                {f.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* altimeter tag riding with the boulder */}
      {tagO > 0 && (
        <div
          style={{
            position: "absolute",
            left: bx,
            top: by - 70,
            transform: `translateX(${atSummit ? "-100%" : "-50%"}) translateX(${atSummit ? -26 : 0}px) translateY(${atSummit ? 46 : 0}px)`,
            opacity: tagO,
            fontFamily: theme.fonts.mono,
            fontWeight: 500,
            fontSize: atSummit ? 18 : 15,
            letterSpacing: "0.08em",
            color: c.trailLight,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            textAlign: "center",
          }}
        >
          {atSummit ? "MATTERHORN · 4'448 M" : `${swiss(Math.round(elev / 5) * 5)} M · KM ${Math.round(km)}`}
        </div>
      )}

      {/* endpoints */}
      <div style={{ position: "absolute", left: SECTION.x0, top: SECTION.base + 48, ...enter(frame, fps, 366, { exitAt: EXIT }), fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.1em", color: c.glacier }}>
        A · BASEL · 253 M
      </div>
      <div style={{ position: "absolute", right: 1920 - SECTION.x1, top: SECTION.base + 48, ...enter(frame, fps, 370, { exitAt: EXIT }), fontFamily: theme.fonts.mono, fontSize: 14, letterSpacing: "0.1em", color: c.glacier, textAlign: "right" }}>
        B · MATTERHORN
      </div>

      {/* type */}
      <div style={{ position: "absolute", left: 72, top: 104 }}>
        <Eyebrow text="02 — The myth, retold" start={352} exitAt={EXIT} />
        <div style={{ height: 22 }} />
        <div style={{ position: "relative", height: 166 }}>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <WordRise text={"Sisyphus rolled\none boulder. Forever."} start={364} exitAt={448} stagger={4} style={{ ...theme.display, fontSize: 84, color: c.snow, whiteSpace: "nowrap" }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <WordRise text={"Swissyphus rolls up\n66 public sources."} start={458} exitAt={EXIT - 4} stagger={4} style={{ ...theme.display, fontSize: 84, color: c.snow, whiteSpace: "nowrap" }} />
          </div>
        </div>
        <div style={{ height: 20 }} />
        <div style={{ ...enter(frame, fps, 476, { exitAt: EXIT }), fontFamily: theme.fonts.body, fontSize: 26, lineHeight: 1.4, color: c.glacier, maxWidth: 760 }}>
          Sources change, move and go down. It keeps them in one interface, every day, automatically.
        </div>
      </div>

      {/* provenance footer */}
      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 52,
          ...enter(frame, fps, 380, { exitAt: EXIT, rise: 10 }),
          fontFamily: theme.fonts.mono,
          fontSize: 13,
          letterSpacing: "0.08em",
          color: c.glacier,
        }}
      >
        <span style={{ color: c.snow }}>get_elevation_profile</span> · 400 SAMPLES · 176 KM · VERTICAL ×14 · © SWISSTOPO / GEO.ADMIN.CH · RETRIEVED 9 NOV 2026
      </div>
    </AbsoluteFill>
  );
};
