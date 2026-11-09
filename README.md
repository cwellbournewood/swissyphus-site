<p align="center"><img alt="Swissyphus logo: a boulder above a slope" src="assets/img/logo.svg" width="96" height="96"></p>

<h1 align="center">swissyphus-site</h1>

<p align="center">The website for <a href="https://github.com/cwellbournewood/swissyphus">Swissyphus</a>, the Swiss public-data rollup for AI agents.</p>

---

A static site: plain HTML, one stylesheet and a little vanilla JavaScript. No framework, no build
step, no tracking. It is a port of the Claude Design project *Swissyphus brand identity options*
(the Carte Nationale system: Lake Deep, Contour, Glacier, Snowfield, Trail Marker; Archivo and
IBM Plex Mono).

| Page | File | What it does |
|---|---|---|
| Landing | `index.html` | Hero animation, example traces, preset map sheet, provenance, install tabs |
| Modules | `modules.html` | Every module and tool, searchable, with a rollup builder that writes the `--modules` / `--preset` command |
| API | `api.html` | REST and remote MCP reference with a request/response playground, errors, keys and tiers |
| Setup | `setup.html` | Client configs, presets, optional keys, Docker, troubleshooting |
| Brand kit | `brand.html` | Mark, palette, type, voice and downloadable logo files |

## Run it locally

```bash
python3 -m http.server 8000     # or: npx serve .
```

Open <http://localhost:8000>.

## Keep the catalogue in sync

Module, tool, source and preset data come from the server's `tools.schema.json`, never typed by
hand. After a server release:

```bash
node scripts/sync-catalogue.mjs                          # reads ../swissyphus/tools.schema.json, else GitHub main
node scripts/sync-catalogue.mjs path/to/tools.schema.json
```

This rewrites `assets/js/catalogue.js`. Counts in the page text (`<span data-count="tools">151</span>`)
are filled from it at load time and fall back to the baked-in number without JavaScript. Grouping
and the short source labels live at the top of the script; a new server module that is not
grouped yet is listed under *Statistics & catalogues* with a warning.

## Layout

```text
index.html modules.html api.html setup.html brand.html 404.html
assets/css/site.css          shared tokens and components (page-specific CSS is inline per page)
assets/js/site.js            nav, copy-to-clipboard + toast, live counts
assets/js/catalogue.js       generated
assets/js/{landing,modules,api,setup}.js
assets/img/                  logo, icon and social preview (same files as the server repo)
scripts/sync-catalogue.mjs
```

The header and footer are repeated in each page; change them in all five.

## Deploy

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on every push to
`main` (enable Pages with source *GitHub Actions* in the repository settings). Any static host
works too: there is nothing to build.

## Licence

MIT, like Swissyphus. Swissyphus is an independent open-source project, not operated or endorsed
by the Swiss Confederation, any canton or any data provider.
