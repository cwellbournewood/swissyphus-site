// Contours (d3-contour) + border + lakes + places, all in mosaic pixel space (Web Mercator z10).
import fs from 'node:fs';
import { contours } from 'd3-contour';
const D = process.argv[2], OUT = process.argv[3];
const meta = JSON.parse(fs.readFileSync(`${D}/meta.json`));
const grid = JSON.parse(fs.readFileSync(`${D}/grid.json`));
const proj = (lon, lat) => {
  const n = 2 ** meta.z * 256;
  const r = lat * Math.PI / 180;
  return [(lon + 180) / 360 * n - meta.x0 * 256, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n - meta.y0 * 256];
};
function dp(pts, tol) { // closed rings: split at the farthest point first
  const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1];
  if (pts.length > 3 && Math.hypot(fx - lx, fy - ly) < 1e-6) {
    let m = 1, md = 0; for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - fx, pts[i][1] - fy); if (d > md) { md = d; m = i; } }
    return [...dp0(pts.slice(0, m + 1), tol).slice(0, -1), ...dp0(pts.slice(m), tol)];
  }
  return dp0(pts, tol);
}
function dp0(pts, tol) { // Douglas-Peucker
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b]; const dx = x2 - x1, dy = y2 - y1; const L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const fmt = v => Math.round(v * 10) / 10;
const ringD = r => 'M' + r.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z';
// Swiss border
const ch = JSON.parse(fs.readFileSync(`${D}/ch_border.json`)).feature.geometry;
const chRings = ch.coordinates.flatMap(p => p).map(r => dp(r.map(c => proj(...c)), 0.6));
const outer = chRings[0];
function inside([x, y], poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const outerS = dp(outer, 6);
// contours
const levels = []; for (let l = 500; l <= 4500; l += 250) levels.push(l);
const cs = contours().size([grid.w, grid.h]).thresholds(levels)(grid.values);
const toMap = ([gx, gy]) => [grid.ox + gx * grid.f, grid.oy + gy * grid.f];
let total = 0, rings = 0;
const contourOut = cs.map(c => {
  const ds = [];
  for (const poly of c.coordinates) for (const ring of poly) {
    let r = dp(ring.map(toMap), 1.3);
    if (r.length < 6) continue;
    const xs = r.map(p => p[0]), ys = r.map(p => p[1]);
    if (Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys) < 18) continue;
    let hit = false; for (let i = 0; i < r.length; i += 4) if (inside(r[i], outerS)) { hit = true; break; }
    if (!hit) continue;
    total += r.length; rings++; ds.push(ringD(r));
  }
  return { level: c.value, d: ds };
});
// lakes
const lakes = JSON.parse(fs.readFileSync(`${D}/lakes.json`)).features.map(f => {
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  return { name: f.properties.name, km2: f.properties.km2, d: polys.flatMap(p => p.map(r => ringD(dp(r.map(c => proj(...c)), 0.5)))).join('') };
});
const places = {
  Basel: [7.5886, 47.5596], Zürich: [8.5402, 47.3782], Bern: [7.4391, 46.9490], Genève: [6.1423, 46.2104], Lausanne: [6.6291, 46.5167],
  Luzern: [8.3093, 47.0502], 'St. Gallen': [9.3700, 47.4233], Lugano: [8.9469, 46.0055], Chur: [9.5287, 46.8530], Sion: [7.3591, 46.2275],
  Zermatt: [7.7491, 46.0207], Matterhorn: [7.6586, 45.9763], Davos: [9.8361, 46.8003], Interlaken: [7.8632, 46.6863], Neuchâtel: [6.9293, 46.9965],
  Bellinzona: [9.0244, 46.1955], Brig: [7.9881, 46.3196], Arth: [8.5235, 47.0485], Visp: [7.8817, 46.2938], Spiez: [7.6806, 46.6862],
  Olten: [7.9078, 47.3518], Winterthur: [8.7240, 47.5001], Fribourg: [7.1512, 46.8032], 'St. Moritz': [9.8350, 46.4983], Jungfrau: [7.9626, 46.5367],
  Aletsch: [8.0500, 46.4500], Centre: [8.2318, 46.8003], Andermatt: [8.5940, 46.6355], Erstfeld: [8.6510, 46.8190], Biasca: [8.9711, 46.3592], Landquart: [9.5605, 46.9672],
};
const placesOut = Object.fromEntries(Object.entries(places).map(([k, v]) => [k, proj(...v).map(fmt)]));
const geo = { meta: { W: meta.W, H: meta.H, z: meta.z, x0: meta.x0, y0: meta.y0 }, border: chRings.map(ringD).join(''), borderOuter: ringD(outer), contours: contourOut, lakes, places: placesOut };
fs.writeFileSync(`${OUT}/geo.json`, JSON.stringify(geo));
console.log('rings', rings, 'points', total, 'bytes', fs.statSync(`${OUT}/geo.json`).size, 'per level', contourOut.map(c => c.d.length).join(','));
