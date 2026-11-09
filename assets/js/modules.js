// Modules page: preset start points and the rollup builder.
(function () {
  "use strict";
  var SY = window.SY, el = SY.el, CAT = window.SY_CATALOGUE || { groups: [], presets: {}, counts: {} };
  var $ = function (id) { return document.getElementById(id); };

  var ORDER = [];
  CAT.groups.forEach(function (g) { g.modules.forEach(function (m) { ORDER.push(m.id); }); });
  var PRESETS = {};
  Object.keys(CAT.presets).forEach(function (k) { if (k !== "full") PRESETS[k] = CAT.presets[k]; });

  var state = { sel: [], preset: "" };

  // Build every card once; render() only updates selection state.
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
      cards[m.id] = { m: m, card: card, btn: btn };
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
    groupEls.forEach(function (ge) {
      ge.g.modules.forEach(function (m) {
        var c = cards[m.id], on = state.sel.indexOf(m.id) >= 0;
        c.card.className = on ? "card sel" : "card";
        c.btn.className = on ? "add on" : "add";
        c.btn.setAttribute("aria-pressed", on ? "true" : "false");
        c.btn.textContent = on ? "✓ In your rollup" : "+ Add to rollup";
      });
      var n = ge.g.modules.length;
      ge.meta.textContent = n + (n === 1 ? " MODULE" : " MODULES");
    });

    var keys = Object.keys(PRESETS);
    SY.tabs($("presets"), keys, keys.indexOf(state.preset), function (k) { setSel(PRESETS[keys[k]], keys[k]); }, "pill");

    var sel = state.sel, cmd;
    if (!sel.length) cmd = SY.install;
    else if (state.preset) cmd = SY.install + " --preset " + state.preset;
    else cmd = SY.install + " --modules " + sel.join(",");
    $("sel-cmd").textContent = cmd;
    var selTools = sel.reduce(function (n, id) { return n + cards[id].m.tools.length; }, 0);
    $("sel-label").textContent = sel.length ? selTools + (selTools === 1 ? " tool" : " tools") : "all " + (CAT.counts.tools || selTools) + " tools";
    $("clear-sel").hidden = !sel.length;
  }

  $("clear-sel").addEventListener("click", function () { setSel([], ""); });
  render();
})();
