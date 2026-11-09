// Landing page: animation toggle, example traces, preset map sheet, client tabs.
(function () {
  "use strict";
  var SY = window.SY, el = SY.el, CAT = window.SY_CATALOGUE || { groups: [], presets: {}, counts: {} };
  var $ = function (id) { return document.getElementById(id); };

  // ---------- animation ----------
  var stage = $("stage"), toggle = $("stage-toggle");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) toggle.hidden = true;
  toggle.addEventListener("click", function () {
    var paused = stage.classList.toggle("paused");
    toggle.textContent = paused ? "Play" : "Pause";
    toggle.setAttribute("aria-pressed", paused ? "true" : "false");
  });

  // ---------- gather chips ----------
  var chips = ["SBB", "MeteoSwiss", "swisstopo", "SLF", "Fedlex", "ZEFIX", "SHAB", "BFS", "SNB", "SECO",
    "simap.ch", "Alertswiss", "FOEN", "ElCom", "Curia Vista", "GWR", "ÖREB", "opendata.swiss", "LINDAS", "Wikidata"];
  var more = (CAT.counts.sources || 66) - chips.length;
  chips.concat(more > 0 ? ["+" + more] : []).forEach(function (c) { $("gather-chips").appendChild(el("span", { class: "chip", text: c })); });

  // ---------- example traces ----------
  var SC = [
    { label: "Ski tour", mcp: "mountain_conditions",
      prompt: "Ski tour near Davos tomorrow: avalanche danger, snow depth, trail closures, weather warnings, and the train there.",
      calls: [["avalanche.get_avalanche_danger_at", "SLF", "142 ms"], ["snow.get_snow_conditions", "SLF IMIS", "96 ms"],
        ["trails.get_trail_closures", "Wanderland", "188 ms"], ["weather.get_weather_warnings", "MeteoSwiss", "121 ms"],
        ["transport.get_connections", "Swiss timetable", "204 ms"]],
      answer: [["Avalanche danger level at the tour coordinates, with the bulletin’s problem types", "SLF"],
        ["Snow depth and 24 h new snow from the nearest IMIS station", "SLF"],
        ["Trail closures within the radius, plus signed detours", "Wanderland"],
        ["Morning connections to Davos with platforms and changes", "Swiss timetable"]] },
    { label: "Due diligence", mcp: "company_due_diligence",
      prompt: "Who is Nestlé in the commercial register, is its VAT number valid, and does anything turn up in sanctions or the courts?",
      calls: [["companies.search_companies", "ZEFIX", "163 ms"], ["companies.search_sogc_publications", "SHAB", "241 ms"],
        ["uid.validate_vat_number", "UID register", "118 ms"], ["sanctions.search_sanctions_list", "SECO", "87 ms"],
        ["courts.search_court_decisions", "entscheidsuche.ch", "296 ms"]],
      answer: [["Legal entity matched by name and UID: seat, legal form, status", "ZEFIX"],
        ["SOGC publications this year, mutations flagged", "SHAB"],
        ["VAT number checked against the UID register", "UID register"],
        ["No match on the Swiss sanctions list, with the list’s own date", "SECO"]] },
    { label: "Address report", mcp: "address_full_report",
      prompt: "Full report for Marktgasse 1, Bern: municipality, building record, zoning restrictions, solar potential and the electricity tariff.",
      calls: [["geo.geocode", "swisstopo", "88 ms"], ["geo.get_municipality", "swisstopo", "64 ms"],
        ["buildings.get_building", "GWR", "132 ms"], ["cadastre.get_land_restrictions", "ÖREB cadastre", "311 ms"],
        ["geo.get_solar_potential", "swisstopo", "177 ms"], ["energy.get_electricity_tariff", "ElCom", "149 ms"]],
      answer: [["Coordinates in WGS84 and LV95, municipality and canton", "swisstopo"],
        ["Building record by EGID: year, category, floors, dwellings", "GWR"],
        ["Public-law restrictions on the parcel, with the legal provisions", "ÖREB"],
        ["Roof solar potential and the municipal electricity tariff", "ElCom"]] },
    { label: "Law & votes", mcp: "",
      prompt: "Is SR 235.1 still in force, and what changed recently? How did canton Ticino vote on June 14?",
      calls: [["law.get_law_by_sr", "Fedlex", "212 ms"], ["law.list_recent_legislation_changes", "Fedlex", "97 ms"],
        ["voting.list_vote_dates", "BFS", "61 ms"], ["voting.get_voting_results", "BFS", "134 ms"]],
      answer: [["SR 235.1 title, in-force status and the consolidated version date", "Fedlex"],
        ["Recent amendments, with their official-compilation references", "Fedlex"],
        ["Ticino’s yes share and turnout next to the national figure", "BFS"]] },
    { label: "Find data", mcp: "",
      prompt: "Find data on road noise in Aargau.",
      calls: [["meta.find_data", "every catalogue", "1.9 s"], ["geodata.search_map_layers", "geo.admin.ch", "143 ms"],
        ["statistics.search_datasets", "opendata.swiss", "221 ms"], ["statistics.query_dataset", "opendata.swiss", "402 ms"]],
      answer: [["The federal road-noise map layer, ready to query at any point", "geo.admin.ch"],
        ["Cantonal noise datasets with their licences", "opendata.swiss"],
        ["Rows filtered to Aargau inside the dataset, and the exact call that fetched them", "opendata.swiss"]] },
  ];
  var si = 0, flip = false;
  function renderScenario() {
    var sc = SC[si];
    SY.tabs($("sc-tabs"), SC.map(function (s) { return s.label; }), si, function (k) {
      if (k === si) return; si = k; flip = !flip; renderScenario();
    });
    $("sc-prompt").textContent = "“" + sc.prompt + "”";
    $("sc-badge").hidden = !sc.mcp;
    $("sc-mcp").textContent = sc.mcp;
    $("sc-label").textContent = sc.label;
    $("sc-calls").textContent = sc.calls.length;
    var srcs = {};
    sc.calls.forEach(function (c) { srcs[c[1].split(" ")[0]] = 1; });
    $("sc-srcs").textContent = Object.keys(srcs).length;

    var tr = $("sc-trace"), step = 0.14;
    tr.className = flip ? "trace b" : "trace";
    tr.textContent = "";
    sc.calls.forEach(function (c, k) {
      tr.appendChild(el("div", { class: "ln tl", style: "animation-delay:" + (0.05 + k * step).toFixed(2) + "s" }, [
        el("span", { class: "t-acc", text: "→" }), el("span", { class: "fn", text: c[0] }),
        el("span", { class: "src", text: "© " + c[1] }), el("span", { class: "ms", text: c[2] })]));
    });
    var sepAt = 0.05 + sc.calls.length * step + 0.12;
    tr.appendChild(el("div", { class: "ln tsep", style: "animation-delay:" + sepAt.toFixed(2) + "s", text: "ROLLED UP" }));
    sc.answer.forEach(function (a, k) {
      tr.appendChild(el("div", { class: "ln al", style: "animation-delay:" + (sepAt + 0.18 + k * 0.13).toFixed(2) + "s" }, [
        el("span", { class: "t-ok", text: "✓" }), el("span", { class: "tx", text: a[0] }), el("span", { class: "src", text: "© " + a[1] })]));
    });
  }
  renderScenario();

  // ---------- preset map sheet ----------
  var mods = [];
  CAT.groups.forEach(function (g) { g.modules.forEach(function (m) { mods.push(m); }); });
  var presetKeys = Object.keys(CAT.presets);
  var pk = "full";
  var tileEls = mods.map(function (m) {
    var a = el("a", { class: "tile", href: "modules.html#" + m.id }, [
      el("span", { class: "nm", text: m.id }),
      el("span", { class: "ds", text: m.desc.split(/ — |; |\. /)[0].replace(/\.$/, "") }),
      el("span", { class: "sr", text: m.source })]);
    $("tiles").appendChild(a);
    return a;
  });
  function renderPreset() {
    SY.tabs($("preset-pills"), presetKeys, presetKeys.indexOf(pk), function (k) { pk = presetKeys[k]; renderPreset(); }, "pill");
    var set = pk === "full" ? null : CAT.presets[pk];
    tileEls.forEach(function (t, k) {
      t.className = !set ? "tile" : (set.indexOf(mods[k].id) >= 0 ? "tile hit" : "tile dim");
    });
    $("preset-cmd").textContent = "npx -y swissyphus --preset " + pk;
    var total = mods.length, tools = CAT.counts.tools;
    $("preset-note").textContent = !set ? "The full atlas: all " + total + " modules, all " + tools + " tools."
      : pk === "discovery" ? "--preset discovery loads 7 meta tools; find_data and call_tool still reach all " + tools + "."
      : "--preset " + pk + " loads " + set.length + " of " + total + " modules.";
  }
  renderPreset();

  // ---------- clients ----------
  var JSONCFG = '{\n  "mcpServers": {\n    "swissyphus": {\n      "command": "npx",\n      "args": ["-y", "swissyphus"]\n    }\n  }\n}';
  var CLIENTS = [
    { name: "Claude Code", file: "TERMINAL", code: "claude mcp add --scope user swissyphus -- npx -y swissyphus",
      note: "One command registers the server for every project. Restart Claude Code and run /mcp: swissyphus should be listed as connected." },
    { name: "Claude Desktop", file: "CLAUDE_DESKTOP_CONFIG.JSON", code: JSONCFG,
      note: "One click: download swissyphus.mcpb from the latest release and open it, then pick a preset in the install dialog. Or add this block and restart." },
    { name: "Cursor / VS Code", file: ".CURSOR/MCP.JSON · .VSCODE/MCP.JSON", code: JSONCFG,
      note: "Put it in the project, or in your user config for every project. VS Code also has a one-click install button in the README." },
    { name: "Docker", file: "TERMINAL",
      code: "docker run -i --rm ghcr.io/cwellbournewood/swissyphus --stdio       # MCP over stdio\ndocker run -p 8000:8000 ghcr.io/cwellbournewood/swissyphus        # REST + remote MCP",
      note: "A pinned, reproducible runtime for CI and servers: multi-arch, Node 24 LTS Alpine, non-root, with a built-in health check." },
  ];
  var ci = 0;
  function renderClient() {
    SY.tabs($("client-tabs"), CLIENTS.map(function (c) { return c.name; }), ci, function (k) { ci = k; renderClient(); });
    var c = CLIENTS[ci];
    $("client-file").textContent = c.file;
    $("client-code").textContent = c.code;
    $("client-note").textContent = c.note;
  }
  renderClient();
})();
