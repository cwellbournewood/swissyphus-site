# Swissyphus: explainer film

A 90-second motion piece (1920×1080, 30 fps, H.264 + AAC) explaining what Swissyphus is and what it
can do, in the Carte Nationale brand system (Lake Deep / Contour / Glacier / Snowfield / Trail Marker,
Archivo Expanded + IBM Plex Mono). Built with [Remotion](https://remotion.dev): every frame is React,
rendered deterministically.

## Storyboard

| # | Frames | Beat | What happens |
|---|---|---|---|
| 01 | 0–288 | **Every Swiss source.** | A top-down shaded relief of Switzerland builds out of the Alps: contours draw level by level, the swisstopo border traces itself, lakes, graticule, live coordinate and scale readouts in the sheet margin. |
| 02 | 288–576 | **The myth, retold** | A transect from Basel to the Matterhorn draws on the map; the map rotates onto it and collapses into a real swisstopo elevation section. The boulder rolls along it, 253 m → 4'448 m, naming the Jura, Mittelland, Bernese Alps and Rhône valley as it passes. |
| 03 | 576–792 | **The rollup** | All 66 public-source IDs build into a map-sheet index grid, then roll up into the boulder: *66 public sources. One MCP server.* |
| 04 | 792–1368 | **A weekend in Zermatt** | The boulder drops onto Bern. *Weekend in Zermatt: next train from Bern, how much snow is up there, and is it safe?* Five tool calls. The route draws through Thun, Spiez and the Lötschberg Base Tunnel, changes at Visp and climbs the Mattertal; the camera glides to Gornergrat for the SLF snow station, then out over Valais for the safety check: MeteoSwiss warning for 3920, SLF bulletin status, Alertswiss alerts in the canton. |
| 05 | 1368–1656 | **Every answer cited** | The snow card unfolds into paper: the real response envelope, with source, `data_as_of`, `cache_status` and `provenance.upstream` annotated. |
| 06 | 1656–2016 | **Always running** | A canary sweeps all 66 sources; one goes down and the answer is served `stale` with its age; a long hold to read; the boulder keeps rolling the whole time. |
| 07 | 2016–2304 | **Zero friction** | `npx -y swissyphus` · 151 tools · 66 sources · 15'000+ datasets · 0 API keys, while ~90 data pins (rail, snow, water, weather, energy, buildings, law, statistics, terrain, seismic, air, votes) drop across the country. Pin positions are illustrative. |
| 08 | 2304–2700 | **End card** | The mark builds: the slope rises and the boulder rolls up to its place, never touching. *Every Swiss source. Rolled up for you.* |

Scenes cut on bar lines of the 100 BPM score (one bar = 72 frames). Each scene is authored in its own design frames and plays at design + offset (`timeline.json` → `scenes`, `offset`); `Film.tsx` wraps scenes 05–08 in shifted `Sequence`s and the audio script applies the same offsets.

## Where every figure comes from

All live figures are from real Swissyphus calls made on **Monday 9 November 2026** (scene 04 and the
envelope at ~12:43–12:52 CET; the section and source list at ~11:36) against a local build of v1.0.1
(`NODE_USE_ENV_PROXY=1 node dist/index.js --http`).

| On screen | Tool | Source | As of |
|---|---|---|---|
| Bern 13:07 (IC 8) → Visp 14:04, 14:11 (R 41, MGB) → Zermatt 15:17; 2 h 10, 1 change | `get_connections` | transport.opendata.ch (Swiss timetable) | 9 Nov 2026 |
| Route geometry: stops and coordinates from the timetable's pass list (Thun, Spiez, Visp, Stalden-Saas … Täsch); the Lötschberg Base Tunnel portals (Frutigen, Raron) added as shape points | transport.opendata.ch | | 9 Nov 2026 |
| 22 cm snow at Gornergratsee (GOR2, 2'953 m), air +0.1 °C, snow surface −1.7 °C, measured 11:30 UTC | `get_snow_conditions` | SLF/WSL IMIS | 2026-11-09T11:30:00Z |
| No avalanche bulletin published yet for Zermatt (`no_bulletin_published`) | `get_avalanche_danger_at` | SLF | 9 Nov 2026 |
| One active warning for 3920 Zermatt: flood, level 3 (considerable), valid from 27 Oct 2026 | `get_weather_warnings` | MeteoSwiss | 9 Nov 2026 |
| 5 active alerts nationally; in Valais: Lötschental (rockfall, disaster zone closed) and Val de Bagnes (mudslides); none for Zermatt | `get_emergency_alerts` | Alertswiss / FOCP | 9 Nov 2026 |
| The JSON envelope in scene 05 (trimmed; licence string shortened with "…") | `get_snow_conditions` | SLF/WSL IMIS | same call |
| Basel → Matterhorn section: 400 samples, 176 km, 253 m → 4'448 m | `get_elevation_profile` | swisstopo / geo.admin.ch | 9 Nov 2026 |
| The 66 source IDs (scenes 03 and 06) | `list_sources` | Swissyphus register | v1.0.1 |
| 151 tools, 66 sources, 15'000+ datasets and tables | README / brand kit | | v1.0.1 |

**Illustrative, not live:** the "source down" moment in scene 06 (`meteoswiss` marked DOWN,
`"stale_age_seconds": 240`) shows the documented behaviour (`cache_status: "stale"` with
`stale_age_seconds`, see `src/core/envelope.ts`); it is not a recorded outage.

**Cartography:** national border swissBOUNDARIES3D © swisstopo (geo.admin.ch API); lakes VECTOR25
© FOEN (`ch.bafu.vec25-seen`, the 59 lakes over 1 km²); terrain from the Mapzen/AWS Terrain Tiles
(Terrarium, zoom 10), shaded and tinted here with the brand ramp; contours every 250 m (d3-contour).
Note the relief is Web Mercator; the Matterhorn appears at the profile's sampled 4'448 m (its official
height is 4'478 m).

Live data changes. Before reusing the film after a few weeks, re-run the calls and re-render.

## Sound

No samples, no downloads, no music service: `scripts/gen-audio.mjs` synthesises the whole soundtrack
in plain JavaScript (sine oscillators, filtered noise, envelopes) and writes `public/soundtrack.wav`.

- **Score:** a D-minor ambient pad (Dm9 · B♭maj9 · Fmaj7 · Am7, resolving to Fmaj9 on the end card,
  with a soft upper bloom while it holds), sub bass, a pluck arpeggio that quickens through "Always
  running", and a soft kick and shaker at 100 BPM. Every scene cut lands on a bar.
- **Sound effects** sit on their own bus, mixed about 6 dB under the music, darkened (6.5 kHz roll-off)
  and sent to a Freeverb-style room. Every effect eases in and out (no hard edges): the noise sweeps are
  dark two-pole filtered air swells with raised-cosine envelopes, risers release instead of cutting off,
  ticks are soft tocks rather than clicks.
- **Master:** 1.6 s fade-in, 3.8 s fade-out, soft-clip, levelled to about −18.5 LUFS (true peak below
  −4 dBFS).

## Re-render

```bash
cd film
npm install
mkdir -p data/tiles
python3 scripts/fetch_tiles.py data          # Terrarium DEM tiles (AWS)
python3 scripts/fetch_lakes.py data/lakes.json
curl -s "https://api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swissboundaries3d-land-flaeche.fill/CH?geometryFormat=geojson&sr=4326" -o data/ch_border.json
python3 scripts/process_dem.py data public   # relief.jpg + contour grid
node scripts/build_geo.mjs data src/data     # contours, border, lakes, places → geo.json
node scripts/gen-audio.mjs                   # public/soundtrack.wav (generated, not committed)
npx remotion studio src/index.ts             # preview
npx remotion render src/index.ts Swissyphus out/swissyphus.mp4 --codec h264 --crf 17
```

`src/data/live.json` holds the live call results; change a figure there and re-render. In a sandbox
without Chrome, pass `--browser-executable` (a Playwright `chrome-headless-shell` works).

## Layout

```
src/
  theme.ts            brand tokens: colours, type, easings, springs
  timeline.json       scene boundaries (shared with the audio script)
  Film.tsx            five-layer stack: mesh → map → scenes → boulder → grade/grain/vignette
  lib/                camera (one continuous camera over the map), geo projection, paths, anim helpers, fonts
  components/         MapLayer, Boulder (one object across scenes 02–04), Chrome (sheet frame, margins), Type, Wipe
  scenes/S1…S8        one file per scene
scripts/              data fetch + processing, audio synthesis, batch stills
public/               relief.jpg, grain.png, soundtrack.wav, fonts (OFL)
```

Fonts: Archivo and IBM Plex Mono, SIL Open Font License (licences in `public/fonts/`).

## Where the output goes

The rendered film is published on the landing page as `../assets/video/swissyphus-film.mp4`
(re-encoded for the web: `ffmpeg -i out/swissyphus.mp4 -vf hqdn3d=1.5:1.5:4:4 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k ../assets/video/swissyphus-film.mp4`),
with its poster frame at `../assets/video/swissyphus-film-poster.jpg` (7.6 s). Downloaded data (`data/`),
renders (`out/`) and the generated soundtrack are not committed; the steps above recreate them.
