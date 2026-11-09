import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { ease } from "../lib/anim";
import { cameraAt, sectionSquash, SECTION } from "../lib/camera";
import { geo, project, worldTransform, P } from "../lib/geo";
import { ReliefImg } from "./Layers";

const { colors: c } = theme;
const { W, H } = geo.meta;

/** Graticule every 0.5° (meridians are vertical in Web Mercator). */
const graticule = (() => {
  const lines: string[] = [];
  for (let lon = 5.5; lon <= 11.0001; lon += 0.5) {
    const [x] = project(lon, 46);
    lines.push(`M${x} 0V${H}`);
  }
  for (let lat = 45.5; lat <= 48.0001; lat += 0.5) {
    const [, y] = project(8, lat);
    lines.push(`M0 ${y}H${W}`);
  }
  return lines;
})();

type Props = {
  /** contour/border build progress (S1). 1 = fully drawn. */
  intro?: boolean;
  dim?: number; // 0..1 darken
};

export const MapLayer: React.FC<Props> = ({ intro = false, dim = 0 }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const sw = (px: number) => px / cam.s; // screen-constant stroke widths

  // reveal (S1 only)
  const revealR = intro ? ease(frame, [4, 170], [0, 4600], theme.ease.soft) : 99999;
  const reliefOpacity = intro ? ease(frame, [0, 60], [0.0, 1]) : 1;
  const gratP = intro ? ease(frame, [20, 110]) : 1;
  const borderP = intro ? ease(frame, [70, 200], [0, 1], theme.ease.inOut) : 1;
  const lakeP = intro ? ease(frame, [110, 190]) : 1;
  const squash = intro ? sectionSquash(frame) : 1;
  const [ax, ay] = P("Aletsch");

  const contourEls = useMemo(
    () =>
      geo.contours.map((lv) => ({
        level: lv.level,
        d: lv.d,
        major: lv.level % 1000 === 0,
      })),
    [],
  );

  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${SECTION.x0 + (SECTION.x1 - SECTION.x0) / 2}px ${SECTION.base}px`,
        transform: `scaleY(${squash})`,
        opacity: squash < 1 ? Math.max(0, squash * 1.4 - 0.15) : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: worldTransform(cam),
          WebkitMaskImage: intro
            ? `radial-gradient(circle at ${ax}px ${ay}px, black ${Math.max(0, revealR - 900)}px, transparent ${revealR}px)`
            : undefined,
        }}
      >
        <ReliefImg style={{ width: W, height: H, opacity: reliefOpacity }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <clipPath id="ch">
              <path d={geo.border} clipRule="evenodd" />
            </clipPath>
          </defs>
          {/* graticule */}
          <g stroke={c.glacier} strokeOpacity={0.13} strokeWidth={sw(1)} fill="none">
            {graticule.map((d, i) => (
              <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease(gratP, [i * 0.02, i * 0.02 + 0.6], [0, 1])} />
            ))}
          </g>
          {/* contours, clipped to Switzerland */}
          <g clipPath="url(#ch)" fill="none" strokeLinejoin="round">
            {contourEls.map((lv, i) => {
              const p = intro ? ease(frame, [8 + i * 7, 8 + i * 7 + 78], [0, 1], theme.ease.soft) : 1;
              if (p <= 0) return null;
              const t = lv.level / 4500;
              return (
                <g
                  key={lv.level}
                  stroke={t > 0.62 ? c.snow : c.glacier}
                  strokeOpacity={(lv.major ? 0.55 : 0.26) + t * 0.25}
                  strokeWidth={sw(lv.major ? 1.25 : 0.7)}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - p}
                >
                  {lv.d.map((d, j) => (
                    <path key={j} d={d} pathLength={1} />
                  ))}
                </g>
              );
            })}
          </g>
          {/* lakes */}
          <g fill="none" stroke={c.contour} strokeOpacity={0.9 * lakeP} strokeWidth={sw(1)}>
            {geo.lakes.map((l) => (
              <path key={l.name + l.km2} d={l.d} />
            ))}
          </g>
          {/* national border */}
          <path
            d={geo.borderOuter}
            fill="none"
            stroke={c.snow}
            strokeOpacity={0.9}
            strokeWidth={sw(1.6)}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - borderP}
          />
        </svg>
      </div>
      {dim > 0 && <AbsoluteFill style={{ background: c.night, opacity: dim }} />}
    </AbsoluteFill>
  );
};
