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
| Landing | `index.html` | Hero film (`assets/video/`, 90 s), example traces, preset map sheet, provenance, install tabs |
| Modules | `modules.html` | Every module and tool, searchable, with a rollup builder that writes the `--modules` / `--preset` command |
| API | `api.html` | REST and remote MCP reference with a request/response playground, errors and rate limits |
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
film/                        source of the landing-page film (Remotion); see film/README.md
```

The header and footer are repeated in each page; change them in all five.

## Deploy

`.github/workflows/pages.yml` publishes the site files (pages, `assets/`, `CNAME`, `robots.txt`,
`sitemap.xml`; not `film/` or `scripts/`) to GitHub Pages on every push to `main`. Any static
host works too: there is nothing to build.

### Domains

The site lives at **https://swissyphus.ch**; `swissyphus.com` redirects to it. Canonical and
Open Graph URLs in every page, `CNAME`, `robots.txt` and `sitemap.xml` all assume that host, so
change them together if it ever moves.

1. **GitHub** (*Settings → Pages*): source *GitHub Actions*, custom domain `swissyphus.ch`, then
   tick *Enforce HTTPS* once the certificate is issued. Pages on a private repository needs a
   paid plan; otherwise make the repository public.
2. **Infomaniak DNS zone of `swissyphus.ch`**: remove the default A/AAAA records that point at
   Infomaniak's parking page, then add

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |
   | CNAME | `www` | `cwellbournewood.github.io.` |

   Keep the MX/SPF records if you use Infomaniak mail on the domain.
3. **`swissyphus.com`**: in Infomaniak's domain manager, add a permanent (301) web redirection
   of `swissyphus.com` and `www.swissyphus.com` to `https://swissyphus.ch`.
4. Optional, recommended: verify `swissyphus.ch` under *GitHub → Settings (your account) → Pages*
   (a TXT record) so nobody else can claim it for their Pages site.

The API server, when deployed (see `deploy/` in the server repo), fits under
`api.swissyphus.ch`: an A record to the VPS and `DOMAIN=api.swissyphus.ch` for Caddy.

## Licence

MIT, like Swissyphus. Swissyphus is an independent open-source project, not operated or endorsed
by the Swiss Confederation, any canton or any data provider.
