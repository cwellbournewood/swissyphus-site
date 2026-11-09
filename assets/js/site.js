// Shared behaviour for every page: mobile nav, copy-to-clipboard with a toast, live counts.
(function () {
  "use strict";

  var SY = (window.SY = window.SY || {});
  SY.install = "npx -y swissyphus";

  // ---------- toast ----------
  var toast, toastT;
  function showToast(msg) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }
  SY.toast = showToast;

  // ---------- clipboard ----------
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) { /* nothing else to try */ }
  }
  SY.copy = function (text, label) {
    var done = function () { showToast(label || "Copied · " + text); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        return;
      }
    } catch (e) { /* fall through */ }
    fallbackCopy(text);
    done();
  };

  // Any element with data-copy copies its value; data-copy-from="#id" copies another element's text.
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-copy], [data-copy-from]");
    if (!el) return;
    var text = el.getAttribute("data-copy");
    if (text === null) {
      var src = document.querySelector(el.getAttribute("data-copy-from"));
      text = src ? src.textContent : "";
    }
    if (text === "install") text = SY.install;
    SY.copy(text, el.getAttribute("data-copy-label") || undefined);
  });

  // ---------- nav ----------
  var nav = document.querySelector(".nav");
  var menuBtn = nav && nav.querySelector(".menu-btn");
  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle("open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      var lbl = menuBtn.querySelector(".menu-label");
      if (lbl) lbl.textContent = open ? "Close" : "Menu";
    }
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  if (nav) nav.querySelectorAll(".nav-link").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // ---------- live counts ----------
  // <span data-count="tools">151</span> keeps its baked-in number if the catalogue is missing.
  var cat = window.SY_CATALOGUE;
  if (cat && cat.counts) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var v = cat.counts[el.getAttribute("data-count")];
      if (v != null) el.textContent = String(v);
    });
  }

  // ---------- tiny helpers for page scripts ----------
  SY.el = function (tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  };
  SY.tabs = function (container, items, current, onPick, cls) {
    container.textContent = "";
    items.forEach(function (label, k) {
      var on = k === current;
      container.appendChild(SY.el("button", {
        type: "button", class: (cls || "tab") + (on ? " on" : ""), "aria-pressed": on ? "true" : "false",
        text: label, onclick: function () { onPick(k); },
      }));
    });
  };
})();
