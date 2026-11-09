import geoData from "../data/geo.json";
import live from "../data/live.json";

export const geo = geoData as unknown as {
  meta: { W: number; H: number; z: number; x0: number; y0: number };
  border: string;
  borderOuter: string;
  contours: { level: number; d: string[] }[];
  lakes: { name: string; km2: number; d: string }[];
  places: Record<string, [number, number]>;
};
export { live };

/** WGS84 → mosaic pixel space (Web Mercator, zoom 10). */
export const project = (lon: number, lat: number): [number, number] => {
  const n = 2 ** geo.meta.z * 256;
  const r = (lat * Math.PI) / 180;
  return [
    ((lon + 180) / 360) * n - geo.meta.x0 * 256,
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n - geo.meta.y0 * 256,
  ];
};
export const unprojectX = (x: number) => ((x + geo.meta.x0 * 256) / (2 ** geo.meta.z * 256)) * 360 - 180;
export const unprojectY = (y: number) => {
  const n = 2 ** geo.meta.z * 256;
  const m = Math.PI * (1 - (2 * (y + geo.meta.y0 * 256)) / n);
  return (Math.atan(Math.sinh(m)) * 180) / Math.PI;
};

export type Camera = {
  cx: number; // map px at the anchor
  cy: number;
  s: number; // scale
  rot: number; // degrees
  sx: number; // screen anchor
  sy: number;
};

export const worldTransform = (c: Camera) =>
  `translate(${c.sx}px, ${c.sy}px) rotate(${c.rot}deg) scale(${c.s}) translate(${-c.cx}px, ${-c.cy}px)`;

/** Map px → screen px under camera c. */
export const toScreen = (c: Camera, [x, y]: [number, number]): [number, number] => {
  const dx = (x - c.cx) * c.s;
  const dy = (y - c.cy) * c.s;
  const a = (c.rot * Math.PI) / 180;
  return [c.sx + dx * Math.cos(a) - dy * Math.sin(a), c.sy + dx * Math.sin(a) + dy * Math.cos(a)];
};

export const lerpCam = (a: Camera, b: Camera, t: number): Camera => {
  // interpolate scale geometrically so zooms feel even
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  return {
    cx: a.cx + (b.cx - a.cx) * t,
    cy: a.cy + (b.cy - a.cy) * t,
    s,
    rot: a.rot + (b.rot - a.rot) * t,
    sx: a.sx + (b.sx - a.sx) * t,
    sy: a.sy + (b.sy - a.sy) * t,
  };
};

export const P = (name: string) => geo.places[name] as [number, number];
