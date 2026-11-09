// Modules page: search, theme filter, preset start points and the rollup builder.
(function () {
  "use strict";
  var SY = window.SY, el = SY.el, CAT = window.SY_CATALOGUE || { groups: [], presets: {}, counts: {} };
  var $ = function (id) { return document.getElementById(id); };

  var ORDER = [];
  CAT.groups.forEach(function (g) { g.modules.forEach(function (m) { ORDER.push(m.id); }); });
  var PRESETS = {};
  Object.keys(CAT.presets).forEach(function (k) { if (k !== "full") PRESETS[k] = CAT.presets[k]; });

  var state = { q: "", theme: "all", sel: [], preset: "" };
  var input = $("mod-q");

  // Build every card once; filtering only toggles visibility and highlights.
  var cards = {};
  var groupEls = CAT.groups.map(function (g) {
    var cardsBox = el("div", { class: "cards" });
    var meta = el("span", { class: "eyebrow cool" });
    var sec = el("section", { class: "grp", id: g.id, "aria-labelledby": "g-" + g.id }, [
      el("div", { class: "wrap grp-in" }, [
        el("div", { class: "grp-head" }, [el("h2", { class: "display d3", id: "g-" + g.id, text: g.name }), meta]),
        cardsBox])]);
    g.modules.forEach(function (m) {
      var toolEls = m.tools.map(function (t) {
        return el("div", { class: "tool" }, [el("span", { class: "fn", text: t[0] }), el("span", { class: "td", text: t[1] })]);
      });
      var btn = el("button", { type: "button", class: "add", "aria-pressed": "false", text: "+ Add to rollup",
        onclick: function () { toggleSel(m.id); } });
      var card = el("article", { class: "card", id: m.id }, [
        el("div", { class: "card-h" }, [el("h3", { class: "nm", text: m.id }), el("span", { class: "sr", text: m.source })]),
        el("p", { class: "card-t", text: m.title }),
        el("p", { class: "card-d", text: m.desc }),
        el("div", { class: "tools" }, toolEls),
        el("div", { class: "card-f" }, [el("span", { class: "n", text: m.tools.length + (m.tools.length === 1 ? " TOOL" : " TOOLS") }), btn])]);
      cardsBox.appendChild(card);
      cards[m.id] = { m: m, card: card, btn: btn, tools: toolEls,
        hay: (m.id + " " + m.title + " " + m.source + " " + m.desc).toLowerCase() };
    });
    $("groups").appendChild(sec);
    return { g: g, sec: sec, meta: meta };
  });

  function toggleSel(id) {
    var i = state.sel.indexOf(id);
    var next = i >= 0 ? state.sel.filter(function (n) { return n !== id; }) : state.sel.concat([id]);
    setSel(next, "");
  }
  function setSel(next, preset) {
    state.sel = ORDER.filter(function (n) { return next.indexOf(n) >= 0; });
    state.preset = preset || "";
    render();
  }

  function render() {
    var q = state.q.trim().toLowerCase();
    var shownMods = 0, shownTools = 0;
    groupEls.forEach(function (ge) {
      var visible = 0;
      var themeOk = state.theme === "all" || ge.g.id === state.theme;
      ge.g.modules.forEach(function (m) {
        var c = cards[m.id];
        var anyTool = false;
        c.m.tools.forEach(function (t, k) {
          var hit = !!q && (t[0] + " " + t[1]).toLowerCase().indexOf(q) >= 0;
          c.tools[k].className = hit ? "tool match" : "tool";
          if (hit) anyTool = true;
        });
        var show = themeOk && (!q || c.hay.indexOf(q) >= 0 || anyTool);
        c.card.hidden = !show;
        var on = state.sel.indexOf(m.id) >= 0;
        c.card.className = on ? "card sel" : "card";
        c.btn.className = on ? "add on" : "add";
        c.btn.setAttribute("aria-pressed", on ? "true" : "false");
        c.btn.textContent = on ? "✓ In your rollup" : "+ Add to rollup";
        if (show) { visible++; shownMods++; shownTools += m.tools.length; }
      });
      ge.sec.hidden = visible === 0;
      ge.meta.textContent = visible + (visible === 1 ? " MODULE" : " MODULES");
    });
    $("count").textContent = shownMods + " MODULES · " + shownTools + " TOOLS SHOWN";
    $("empty").hidden = shownMods > 0;
    $("empty-q").textContent = state.q;
    $("clear-q").hidden = !state.q;

    var themes = [{ id: "all", name: "All" }].concat(CAT.groups.map(function (g) { return { id: g.id, name: g.name }; }));
    SY.tabs($("themes"), themes.map(function (t) { return t.name; }),
      themes.map(function (t) { return t.id; }).indexOf(state.theme),
      function (k) { state.theme = themes[k].id; render(); }, "pill");
    var keys = Object.keys(PRESETS);
    SY.tabs($("presets"), keys, keys.indexOf(state.preset), function (k) { setSel(PRESETS[keys[k]], keys[k]); }, "pill");

    var sel = state.sel, cmd;
    if (!sel.length) cmd = SY.install;
    else if (state.preset) cmd = SY.install + " --preset " + state.preset;
    else cmd = SY.install + " --modules " + sel.join(",");
    $("sel-cmd").textContent = cmd;
    $("sel-label").textContent = sel.length ? sel.length + (sel.length === 1 ? " module" : " modules") : "all " + ORDER.length + " modules";
    $("clear-sel").hidden = !sel.length;
  }

  input.addEventListener("input", function () { state.q = input.value; render(); });
  $("clear-q").addEventListener("click", function () { input.value = ""; state.q = ""; render(); input.focus(); });
  $("reset").addEventListener("click", function () { input.value = ""; state.q = ""; state.theme = "all"; render(); });
  $("clear-sel").addEventListener("click", function () { setSel([], ""); });
  // "/" focuses search, like the label suggests.
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus();
    }
  });
  render();
})();
