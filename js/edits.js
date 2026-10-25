/* (e)studio49 - aplica as edições feitas no modo de edição (assets/edits.json) antes do resto do site iniciar.
   Para editar: abra a página no seu computador com ?editar no final, por exemplo http://localhost:8765/?editar */
(function () {
  var script = document.currentScript;
  var base = script ? script.src.replace(/js\/edits\.js.*$/, "") : "/";
  var rootPath = new URL(base).pathname;
  var key = "/" + location.pathname.slice(rootPath.length).replace(/index\.html$/, "");
  var editing = /[?&]editar\b/.test(location.search);
  var bucket = window.innerWidth >= 900 ? "d" : "m";

  function setLabel(el, text) {
    var n = Array.prototype.find.call(el.childNodes, function (c) { return c.nodeType === 3 && c.textContent.trim(); });
    if (n) n.textContent = text;
  }

  function applyGeom(el, g) {
    el.style.translate = (g.dx || g.dy) ? (g.dx || 0) + "px " + (g.dy || 0) + "px" : "";
    el.style.rotate = g.rot ? g.rot + "deg" : "";
    el.style.width = g.w != null ? g.w + "px" : "";
    el.style.fontSize = g.fs != null ? g.fs + "px" : "";
    el.style.borderRadius = g.radius != null ? g.radius + "px" : "";
    el.style.color = g.color || "";
    el.style.backgroundColor = g.bg || "";
  }

  function applyEdit(el, p, b) {
    if (p.label != null) setLabel(el, p.label);
    if (p.txt != null) el.textContent = p.txt;
    if (p.html != null) el.innerHTML = p.html;
    el.style.display = p.hide ? "none" : "";
    applyGeom(el, p[b || bucket] || {});
  }

  var all = {};
  try {
    var x = new XMLHttpRequest();
    x.open("GET", base + "assets/edits.json" + (editing ? "?v=" + Date.now() : ""), false);
    x.send();
    if (x.status === 200) all = JSON.parse(x.responseText) || {};
  } catch (e) { all = {}; }

  var page = all[key] || {};
  Object.keys(page).forEach(function (sel) {
    var el = null;
    try { el = document.querySelector(sel); } catch (e) { el = null; }
    if (el) applyEdit(el, page[sel]);
  });

  window.E49_EDITS = { base: base, key: key, bucket: bucket, apply: applyEdit, geom: applyGeom, all: all, editing: editing };

  if (editing && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    try { sessionStorage.setItem("e49intro", "1"); sessionStorage.removeItem("e49tr"); } catch (e) {}
    document.documentElement.classList.remove("intro-cover", "tr-cover");
    var s = document.createElement("script");
    s.src = base + "js/editor.js";
    s.defer = true;
    document.body.appendChild(s);
  }
})();
