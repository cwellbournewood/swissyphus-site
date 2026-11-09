import { SECTION } from "./camera";
import { live, project } from "./geo";

export type Pt = [number, number];

/** Centripetal-ish Catmull-Rom through points, densely sampled. */
export const catmull = (pts: Pt[], per = 24): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

export const arcTable = (pts: Pt[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
};

export const pointAt = (pts: Pt[], cum: number[], t: number): Pt => {
  const L = cum[cum.length - 1] * Math.max(0, Math.min(1, t));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] < L) lo = m;
    else hi = m;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const u = (L - cum[lo]) / seg;
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u];
};

/** Sub-polyline from t0..t1 (by arc length). */
export const slice = (pts: Pt[], cum: number[], t0: number, t1: number): Pt[] => {
  const total = cum[cum.length - 1];
  const a = total * t0, b = total * t1;
  const out: Pt[] = [pointAt(pts, cum, t0)];
  for (let i = 0; i < pts.length; i++) if (cum[i] > a && cum[i] < b) out.push(pts[i]);
  out.push(pointAt(pts, cum, t1));
  return out;
};

export const toD = (pts: Pt[]) => (pts.length ? "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") : "");

// ── Train route Bern → Lugano (map px) ──────────────────────────────────────
const routeMap: Pt[] = (live.route as Pt[]).map(([lon, lat]) => project(lon, lat));
const CH = live.change as number; // change of train: a corner, not a curve
export const ROUTE = [...catmull(routeMap.slice(0, CH + 1), 28).slice(0, -1), ...catmull(routeMap.slice(CH), 28)];
export const ROUTE_CUM = arcTable(ROUTE);
/** arc-length fraction at each original route vertex */
export const ROUTE_T = routeMap.map((p) => {
  let best = 0, bd = Infinity;
  ROUTE.forEach((q, i) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) { bd = d; best = i; }
  });
  return ROUTE_CUM[best] / ROUTE_CUM[ROUTE_CUM.length - 1];
});

// ── Elevation section (screen px) ───────────────────────────────────────────
const total = live.profile.total_m;
export const secX = (d: number) => SECTION.x0 + (d / total) * (SECTION.x1 - SECTION.x0);
export const secY = (e: number) => SECTION.base - (e / SECTION.maxElev) * (SECTION.base - SECTION.top);
export const PROFILE: Pt[] = (live.profile.samples as Pt[]).map(([d, e]) => [secX(d), secY(e)]);
export const elevAtX = (x: number) => {
  const s = live.profile.samples as Pt[];
  const d = ((x - SECTION.x0) / (SECTION.x1 - SECTION.x0)) * total;
  for (let i = 1; i < s.length; i++) {
    if (s[i][0] >= d) {
      const u = (d - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1);
      return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * u;
    }
  }
  return s[s.length - 1][1];
};

/** Rolling-circle envelope: centre height of a ball of radius r resting on the profile at x. */
export const makeEnvelope = (r: number, gap: number) => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = SECTION.x0; x <= SECTION.x1; x += 1) {
    let best = Infinity;
    for (let dx = -r; dx <= r; dx += 1) {
      const y = secY(elevAtX(Math.max(SECTION.x0, Math.min(SECTION.x1, x + dx))));
      const c = y - Math.sqrt(Math.max(0, r * r - dx * dx));
      if (c < best) best = c;
    }
    xs.push(x);
    ys.push(best - gap);
  }
  // light smoothing so the ball glides
  const sm = ys.map((_, i) => {
    let a = 0, n = 0;
    for (let k = -3; k <= 3; k++) {
      const j = Math.max(0, Math.min(ys.length - 1, i + k));
      a += ys[j];
      n++;
    }
    return Math.min(ys[i], a / n);
  });
  return (x: number) => {
    const i = Math.max(0, Math.min(xs.length - 1, Math.round(x - SECTION.x0)));
    return sm[i];
  };
};

export const BOULDER_R = 19;
export const envelope = makeEnvelope(BOULDER_R, 3);
