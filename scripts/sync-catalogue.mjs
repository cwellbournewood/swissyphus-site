#!/usr/bin/env node
// Regenerates assets/js/catalogue.js from the server's tools.schema.json.
//
//   node scripts/sync-catalogue.mjs                      # ../swissyphus/tools.schema.json, else GitHub main
//   node scripts/sync-catalogue.mjs path/to/tools.schema.json
//
// The site reads module, tool, source and preset data only from the generated file, so the
// numbers on every page follow the server release instead of being typed by hand.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const RAW = "https://raw.githubusercontent.com/cwellbournewood/swissyphus/main/tools.schema.json";

// Site grouping (mirrors the README's "What's inside" table).
const GROUPS = [
  { id: "mobility", name: "Mobility", modules: ["transport", "mobility", "sbb", "traffic", "trails", "postcode"] },
  { id: "environment", name: "Weather & environment", modules: ["weather", "hydrology", "avalanche", "snow", "earthquakes", "airquality", "glaciers", "alerts", "dams"] },
  { id: "property", name: "Places & property", modules: ["geo", "geodata", "coords", "buildings", "cadastre", "energy", "realestate", "waste"] },
  { id: "business", name: "Business & compliance", modules: ["companies", "uid", "sanctions", "procurement", "courts", "fx"] },
  { id: "civic", name: "Law & politics", modules: ["law", "parliament", "voting", "localpolitics"] },
  { id: "data", name: "Statistics & catalogues", modules: ["statistics", "bfs", "cubes", "portals", "i14y", "lindas", "wikidata"] },
  { id: "society", name: "Society", modules: ["health", "holidays", "news", "libraries"] },
  { id: "discovery", name: "Discovery", modules: ["meta"] },
];

// Short source labels for tiles and card headers.
const SOURCE = {
  companies: "ZEFIX · SHAB", transport: "Swiss timetable", weather: "MeteoSwiss", hydrology: "FOEN",
  geo: "swisstopo", coords: "swisstopo · offline", postcode: "Swiss Post", buildings: "GWR",
  law: "Fedlex", statistics: "opendata.swiss · EnviDat", parliament: "Curia Vista", voting: "BFS",
  alerts: "Alertswiss", avalanche: "SLF", snow: "SLF IMIS", trails: "Wanderland",
  earthquakes: "SED · ETH", airquality: "NABEL", energy: "ElCom · SFOE", fx: "SNB",
  holidays: "OpenHolidays", waste: "OpenERZ", news: "SRF", lindas: "LINDAS",
  portals: "SBB · cantonal portals", mobility: "sharedmobility.ch", uid: "UID register",
  courts: "entscheidsuche.ch", wikidata: "Wikidata", bfs: "BFS STAT-TAB", cubes: "LINDAS cubes",
  geodata: "geo.admin.ch · STAC", sanctions: "SECO", procurement: "simap.ch", health: "FOPH",
  localpolitics: "OpenParlData", i14y: "I14Y", libraries: "swisscovery", glaciers: "GLAMOS",
  cadastre: "ÖREB cadastre", dams: "SFOE", traffic: "FEDRO", sbb: "SBB", realestate: "FSO",
  meta: "Swissyphus",
};

// Presets shown on the site, in this order. `hosted` is an operator setting, not a user choice.
const PRESET_ORDER = ["full", "discovery", "minimal", "commuter", "outdoor", "business", "citizen",
  "legal", "compliance", "politics", "property", "health", "research"];

async function load(arg) {
  const local = arg ? resolve(arg) : join(root, "..", "swissyphus", "tools.schema.json");
  if (existsSync(local)) return { json: JSON.parse(await readFile(local, "utf8")), from: local };
  if (arg) throw new Error(`not found: ${local}`);
  const res = await fetch(RAW);
  if (!res.ok) throw new Error(`GET ${RAW} → ${res.status}`);
  return { json: await res.json(), from: RAW };
}

const firstSentence = (s = "") => {
  const m = s.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : s).replace(/\s+/g, " ").trim();
};

const { json, from } = await load(process.argv[2]);
const byId = new Map(json.modules.map((m) => [m.id, m]));

const grouped = new Set(GROUPS.flatMap((g) => g.modules));
const missing = json.modules.map((m) => m.id).filter((id) => !grouped.has(id));
if (missing.length) {
  // A new server module lands in Discovery's neighbour group until someone files it properly.
  console.warn(`ungrouped modules (added to "Statistics & catalogues"): ${missing.join(", ")}`);
  GROUPS.find((g) => g.id === "data").modules.push(...missing);
}

const sourceIds = new Set();
const groups = GROUPS.map((g) => ({
  id: g.id,
  name: g.name,
  modules: g.modules.filter((id) => byId.has(id)).map((id) => {
    const m = byId.get(id);
    m.sources.forEach((s) => { if (s.id !== "swissyphus") sourceIds.add(s.id); });
    return {
      id,
      title: m.title,
      source: SOURCE[id] ?? m.sources.map((s) => s.name.split(" — ")[0]).join(" · "),
      desc: m.description.replace(/\.?$/, "."),
      tools: m.tools.map((t) => [t.name, t.title || firstSentence(t.description)]),
    };
  }),
}));

const presets = {};
for (const key of PRESET_ORDER) if (json.presets[key]) presets[key] = json.presets[key];

const toolCount = json.modules.reduce((n, m) => n + m.tools.length, 0);
const out = {
  generated_at: json.generated_at,
  counts: { modules: json.modules.length, tools: toolCount, sources: sourceIds.size },
  groups,
  presets,
};

const body = `// Generated by scripts/sync-catalogue.mjs from tools.schema.json (${json.generated_at}). Do not edit by hand.
window.SY_CATALOGUE = ${JSON.stringify(out)};
`;
await writeFile(join(root, "assets", "js", "catalogue.js"), body);
console.log(`catalogue.js: ${out.counts.modules} modules · ${out.counts.tools} tools · ${out.counts.sources} sources (from ${from})`);
