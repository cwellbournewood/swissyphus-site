// One continuous camera over the map for the whole film. Frame-based keyframes.
import { theme } from "../theme";
import { ease } from "./anim";
import { type Camera, lerpCam, P, project, live } from "./geo";
import tl from "../timeline.json";

const [basel, matter] = [P("Basel"), P("Matterhorn")];
const tdx = matter[0] - basel[0];
const tdy = matter[1] - basel[1];
export const transectLen = Math.hypot(tdx, tdy);
export const transectAngle = (Math.atan2(tdy, tdx) * 180) / Math.PI; // ~88°

/** Screen geometry of the elevation section (shared with the myth scene). */
export const SECTION = { x0: 160, x1: 1760, base: 868, top: 300, maxElev: 4600 };

const C = {
  alps: { cx: 2250, cy: 1880, s: 1.32, rot: 0, sx: 960, sy: 540 },
  overview: { cx: 2404, cy: 1512, s: 0.42, rot: 0, sx: 1085, sy: 556 },
  overviewDrift: { cx: 2390, cy: 1505, s: 0.435, rot: 0, sx: 1085, sy: 556 },
  section: {
    cx: (basel[0] + matter[0]) / 2,
    cy: (basel[1] + matter[1]) / 2,
    s: (SECTION.x1 - SECTION.x0) / transectLen,
    rot: -transectAngle,
    sx: (SECTION.x0 + SECTION.x1) / 2,
    sy: SECTION.base,
  },
  route: { cx: 2000, cy: 1880, s: 0.78, rot: 0, sx: 1330, sy: 580 },
  routeDrift: { cx: 2004, cy: 1884, s: 0.8, rot: 0, sx: 1330, sy: 580 },
  zermatt: (() => {
    const [x, y] = project(live.snow.lon, live.snow.lat);
    return { cx: x - 14, cy: y - 18, s: 1.15, rot: 0, sx: 1330, sy: 560 };
  })(),
  valais: { cx: 1890, cy: 2172, s: 1.08, rot: 0, sx: 1360, sy: 572 },
  numbers: { cx: 2404, cy: 1520, s: 0.4, rot: 0, sx: 1110, sy: 440 },
  numbersDrift: { cx: 2420, cy: 1530, s: 0.415, rot: 0, sx: 1110, sy: 440 },
} satisfies Record<string, Camera>;

export const CAMS = C;

export const cameraAt = (f: number): Camera => {
  const S = tl.scenes;
  if (f < 300) {
    if (f < 160) return lerpCam(C.alps, C.overview, ease(f, [0, 160], [0, 1], theme.ease.inOut));
    return lerpCam(C.overview, C.overviewDrift, ease(f, [160, 300], [0, 1], theme.ease.soft));
  }
  if (f < S.rollup[0]) return lerpCam(C.overviewDrift, C.section, ease(f, [300, 346], [0, 1], theme.ease.inOut));
  if (f < S.running[0]) {
    // scene 04, real frames (extended): Bern → Zermatt, snow at Gornergrat, then the safety check over Valais
    if (f < 1034) return lerpCam(C.route, C.routeDrift, ease(f, [S.ask[0], 1034], [0, 1], theme.ease.soft));
    if (f < 1170) return lerpCam(C.routeDrift, C.zermatt, ease(f, [1034, 1092], [0, 1], theme.ease.inOut));
    return lerpCam(C.zermatt, C.valais, ease(f, [1170, 1232], [0, 1], theme.ease.inOut));
  }
  return lerpCam(C.numbers, C.numbersDrift, ease(f, [S.numbers[0] - 20, S.numbers[1]], [0, 1], theme.ease.soft));
};

/** Squash of the map onto the section line (1 = flat map, 0 = collapsed to the line). */
export const sectionSquash = (f: number) => 1 - ease(f, [336, 366], [0, 1], theme.ease.inOut);

/** Ground scale shown in the margin: metres per screen px → 1:n at 96 dpi. */
export const mapScale = (s: number) => {
  const metresPerMapPx = (156543.03392 * Math.cos((46.8 * Math.PI) / 180)) / 2 ** 10;
  const m = metresPerMapPx / s;
  return m / 0.0002646;
};
