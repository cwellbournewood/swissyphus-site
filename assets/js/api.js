// API page: the request/response playground.
(function () {
  "use strict";
  var SY = window.SY, el = SY.el;
  var $ = function (id) { return document.getElementById(id); };

  var BASE = "http://localhost:8000/v1";
  var TOOLS = [
    { fn: "get_weather", module: "weather", src: "MeteoSwiss", args: { plz: "8001" },
      desc: "Local forecast and current conditions for a Swiss postcode, from MeteoSwiss.",
      data: '{ "plz": "8001", "current": { … }, "forecast": [ … ] }', attribution: "© MeteoSwiss", licence: "Swiss OGD — free use with attribution" },
    { fn: "get_connections", module: "transport", src: "Swiss timetable", args: { from: "Bern", to: "Lugano" },
      desc: "Journeys between two stops with changes, platforms and delays.",
      data: '{ "connections": [ { "sections": [ … ] } ] }', attribution: "© transport.opendata.ch" },
    { fn: "get_avalanche_danger_at", module: "avalanche", src: "SLF", args: { lat: 46.8, lon: 9.8 },
      desc: "Avalanche danger level at any coordinate, from the national bulletin.",
      data: '{ "level": …, "problems": [ … ] }', attribution: "© SLF" },
    { fn: "get_law_by_sr", module: "law", src: "Fedlex", args: { sr_number: "235.1" },
      desc: "A federal act by its SR number: title, in-force status, consolidated version.",
      data: '{ "sr": "235.1", "in_force": …, "version": … }', attribution: "© Fedlex" },
    { fn: "search_companies", module: "companies", src: "ZEFIX", args: { query: "Nestlé" },
      desc: "Search the commercial register (700k+ entities) by name or UID.",
      data: '{ "results": [ { "uid": "CHE-…", "legal_form": … } ] }', attribution: "© ZEFIX, Federal Office of Justice" },
    { fn: "search_sanctions_list", module: "sanctions", src: "SECO", args: { name: "Rotenberg" },
      desc: "Screen a name against the Swiss sanctions list, with fuzzy matching.",
      data: '{ "matches": [ … ], "list_date": … }', attribution: "© SECO" },
    { fn: "compare_electricity_tariffs", module: "energy", src: "ElCom", args: { municipalities: ["Zürich", "Baden", "Bern"] }, post: true,
      desc: "Electricity tariffs for several municipalities, split into energy, grid and levies.",
      data: '{ "tariffs": [ { "municipality": "Zürich", … } ] }', attribution: "© ElCom" },
    { fn: "convert_lv95_to_wgs84", module: "coords", src: "swisstopo", args: { easting: 2600000, northing: 1200000 },
      desc: "LV95 → WGS84 with cm accuracy. Computed offline, no upstream call.",
      data: '{ "lat": …, "lon": … }', attribution: "© swisstopo", cache: "computed" },
    { fn: "find_data", module: "meta", src: "every catalogue", args: { query: "road noise Aargau" },
      desc: "Search opendata.swiss, ~900 map layers, BFS, LINDAS cubes, portals, SNB, I14Y and Wikidata at once.",
      data: '{ "results": [ { "title": …, "call": { "tool": …, "args": { … } } } ] }', attribution: "per result" },
  ];
  var LANGS = ["cURL", "MCP", "fetch"];
  var ti = 0, li = 0;

  function render() {
    var list = $("pg-list");
    list.textContent = "";
    TOOLS.forEach(function (x, k) {
      var on = k === ti;
      list.appendChild(el("button", { type: "button", class: on ? "pg-item on" : "pg-item", "aria-pressed": on ? "true" : "false",
        onclick: function () { ti = k; render(); } }, [
        el("span", { class: "fn", text: x.fn }), el("span", { class: "md", text: x.module + " · " + x.src })]));
    });
    SY.tabs($("pg-langs"), LANGS, li, function (k) { li = k; render(); }, "pg-tab");

    var t = TOOLS[ti];
    var qs = Object.keys(t.args).map(function (k) { return k + "=" + encodeURIComponent(String(t.args[k])); }).join("&");
    var url = BASE + "/tools/" + t.fn;
    var body = JSON.stringify(t.args);
    var req;
    if (li === 0) {
      req = t.post ? "curl -X POST " + url + " \\\n  -H 'Content-Type: application/json' \\\n  -d '" + body + "'" : 'curl "' + url + "?" + qs + '"';
    } else if (li === 1) {
      req = "POST /mcp\n\n" + JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: t.fn, arguments: t.args } }, null, 2);
    } else {
      req = (t.post
        ? 'const res = await fetch("' + url + '", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(' + body + ")\n});"
        : 'const res = await fetch(\n  "' + url + "?" + qs + '"\n);') +
        "\nconst { data, source, provenance } = await res.json();\nconsole.log(source.attribution); // " + t.attribution;
    }
    $("pg-req").textContent = req;
    $("pg-desc").textContent = t.desc;
    $("pg-res").textContent = '{\n  "data": ' + t.data + ',\n  "source": {\n    "name": "' + t.src + '",\n    "licence": "' + (t.licence || "…") +
      '",\n    "attribution": "' + t.attribution + '"\n  },\n  "retrieved_at": "2026-11-09T06:00:41Z",\n  "data_as_of": ' +
      (t.cache === "computed" ? "null" : '"2026-11-09T06:00:00Z"') + ',\n  "cache_status": "' + (t.cache || "miss") + '",\n  "provenance": { "upstream": [' +
      (t.cache === "computed" ? "" : " { … } ") + "] }\n}";
  }
  render();
})();
