// Setup page: client config tabs and the preset table.
(function () {
  "use strict";
  var SY = window.SY, el = SY.el, CAT = window.SY_CATALOGUE || { presets: {}, counts: {} };
  var $ = function (id) { return document.getElementById(id); };

  var JSONCFG = '{\n  "mcpServers": {\n    "swissyphus": {\n      "command": "npx",\n      "args": ["-y", "swissyphus"]\n    }\n  }\n}';
  var RELEASE = "https://github.com/cwellbournewood/swissyphus/releases/latest";
  var VSCODE = "https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522swissyphus%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522swissyphus%2522%255D%257D";
  var CLIENTS = [
    { name: "Claude Code", file: ".MCP.JSON", config: JSONCFG, oneliner: "claude mcp add --scope user swissyphus -- npx -y swissyphus",
      note: "Easiest: the one-liner registers the server for every project, no file editing. Or commit the block to .mcp.json so the whole team gets it. Restart and run /mcp to confirm it is connected." },
    { name: "Claude Desktop", file: "CLAUDE_DESKTOP_CONFIG.JSON", config: JSONCFG, oneliner: "",
      note: "One click: download swissyphus.mcpb from the latest release and open it. Pick a preset in the install dialog; Claude Desktop keeps it updated. Or add the block under mcpServers and restart.",
      link: [RELEASE, "Download swissyphus.mcpb →"] },
    { name: "Cursor", file: ".CURSOR/MCP.JSON", config: JSONCFG, oneliner: "",
      note: "Put it in the project, or in ~/.cursor/mcp.json for every project. Cursor picks it up on reload." },
    { name: "VS Code", file: ".VSCODE/MCP.JSON", config: JSONCFG, oneliner: "",
      note: "VS Code’s MCP support reads the same command and args. Or install it with one click.",
      link: [VSCODE, "Install in VS Code →"] },
    { name: "Windsurf / Cline", file: "MCP CONFIG", config: JSONCFG, oneliner: "",
      note: "Any client that speaks MCP over stdio works with the same shape. Point it at npx." },
    { name: "Docker", file: "MCP CONFIG · STDIO",
      config: '{\n  "mcpServers": {\n    "swissyphus": {\n      "command": "docker",\n      "args": ["run", "-i", "--rm",\n        "ghcr.io/cwellbournewood/swissyphus", "--stdio"]\n    }\n  }\n}',
      oneliner: "docker run -p 8000:8000 ghcr.io/cwellbournewood/swissyphus",
      note: "A pinned, reproducible runtime for CI and servers. Run with --stdio for MCP clients, or over HTTP for REST plus remote MCP." },
  ];
  var ci = 0;
  function renderClient() {
    SY.tabs($("client-tabs"), CLIENTS.map(function (c) { return c.name; }), ci, function (k) { ci = k; renderClient(); });
    var c = CLIENTS[ci];
    $("client-file").textContent = c.file;
    $("client-config").textContent = c.config;
    $("client-name").textContent = c.name;
    $("client-note").textContent = c.note;
    $("client-one").hidden = !c.oneliner;
    $("client-oneliner").textContent = c.oneliner;
    var link = $("client-link");
    link.textContent = "";
    if (c.link) link.appendChild(el("a", { class: "btn", href: c.link[0], text: c.link[1] }));
  }
  renderClient();

  var DESC = {
    full: "Everything. The default.",
    discovery: "Smallest context. find_data, find_tools, describe_tool and call_tool reach every module.",
    minimal: "Geocoding, transport, weather.",
    commuter: "Transport, weather, alerts, holidays, shared mobility.",
    outdoor: "Weather, avalanche, snow, trails, hydrology, earthquakes, glaciers, transport.",
    business: "Companies, UID/VAT, sanctions, procurement, law, FX, statistics, energy.",
    citizen: "Everyday questions: transport, weather, waste, votes, energy, health, local politics.",
    legal: "Law, courts, companies, parliament, votes, sanctions, ÖREB cadastre.",
    compliance: "Companies, UID, sanctions, courts, procurement, law, Wikidata.",
    politics: "Federal, cantonal and municipal politics, votes, law.",
    property: "Parcels, buildings, ÖREB restrictions, solar, energy, geodata.",
    health: "FOPH surveillance, air quality, health statistics.",
    research: "Libraries, research data, glaciers, statistics, cubes, Wikidata.",
  };
  var rows = $("preset-rows");
  Object.keys(CAT.presets).forEach(function (k) {
    var cmd = SY.install + " --preset " + k;
    var n = CAT.presets[k].length;
    var count = k === "discovery" ? "7 TOOLS" : n + (n === 1 ? " MODULE" : " MODULES");
    rows.appendChild(el("div", { class: "r pr" }, [
      el("span", { class: "n", text: "--preset " + k }),
      el("span", { class: "d", text: DESC[k] || CAT.presets[k].join(", ") }),
      el("span", { class: "c2", text: count }),
      el("button", { class: "copy", type: "button", "data-copy": cmd, "aria-label": "Copy " + cmd, text: "Copy" })]));
  });
})();
