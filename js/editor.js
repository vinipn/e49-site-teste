/* (e)studio49 - modo de edição visual. Só carrega no seu computador (localhost) com ?editar no endereço.
   Clique para escolher, arraste para mover, duplo clique para editar o texto, puxe o canto para mudar o tamanho.
   O que você muda é guardado em assets/edits.json e aplicado pelo js/edits.js. */
(function () {
  var E = window.E49_EDITS;
  if (!E || window.__e49ed) return;
  window.__e49ed = 1;

  var root = document.documentElement;
  var B = E.bucket;
  var edits = JSON.parse(JSON.stringify(E.all || {}));
  var page = edits[E.key] = edits[E.key] || {};
  var sel = null, hov = null, drag = null, editEl = null, dirty = false;
  var undo = [], orig = new Map();
  var COLORS = [["#FCF3D9", "Nata"], ["#F14625", "Brasa"], ["#C93A1B", "Brasa escura"], ["#1C2A3A", "Serra"], ["#AFCCED", "Geada"], ["#E8F0FA", "Geada clara"]];
  var INLINE = { B: 1, I: 1, EM: 1, STRONG: 1, SMALL: 1, BR: 1, U: 1, MARK: 1 };
  var BLOCK = "div,section,ul,ol,li,p,h1,h2,h3,h4,h5,h6,table,form,figure,img,svg,video,button,input,a.btn,.btn";

  /* ---------- visual do editor ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#e49ed,#e49ed *{box-sizing:border-box;font-family:Figtree,system-ui,sans-serif;letter-spacing:0;text-transform:none;line-height:1.2}" +
    "html.e49-editing .fab{display:none!important}" +
    "#e49ed{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-size:13px;color:#FCF3D9}" +
    "#e49ed .bar,#e49ed .insp{position:fixed;left:50%;transform:translateX(-50%);pointer-events:auto;background:#151E2A;border:1px solid #2c3d52;border-radius:999px;display:flex;align-items:center;gap:6px;padding:6px}" +
    "#e49ed .bar{bottom:14px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 16px);border-radius:26px}" +
    "#e49ed .insp{bottom:70px;border-radius:18px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);padding:8px 10px;gap:8px 12px}" +
    "#e49ed .insp[hidden]{display:none}" +
    "#e49ed button{font:600 13px Figtree,system-ui,sans-serif;color:#FCF3D9;background:transparent;border:1px solid transparent;border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}" +
    "#e49ed button:hover{background:#243447}" +
    "#e49ed button.pri{background:#F14625;color:#fff}#e49ed button.pri:hover{background:#C93A1B}" +
    "#e49ed button:disabled{opacity:.4;cursor:default}" +
    "#e49ed .tag{padding:0 10px;color:#AFCCED;font-size:12px;white-space:nowrap}" +
    "#e49ed select{background:#1C2A3A;color:#FCF3D9;border:1px solid #2c3d52;border-radius:999px;padding:7px 12px;font:600 13px Figtree,system-ui,sans-serif;cursor:pointer;max-width:170px}" +
    "#e49ed label{display:flex;align-items:center;gap:6px;color:#AFCCED;font-size:12px}" +
    "#e49ed input[type=number]{width:62px;background:#1C2A3A;color:#FCF3D9;border:1px solid #2c3d52;border-radius:10px;padding:5px 7px;font:13px 'DM Mono',monospace}" +
    "#e49ed input[type=range]{width:90px;accent-color:#F14625}" +
    "#e49ed .sw{display:flex;gap:4px}" +
    "#e49ed .sw i{width:20px;height:20px;border-radius:50%;border:1px solid #5b6f86;cursor:pointer;display:block}" +
    "#e49ed .sw i.none{background:linear-gradient(135deg,transparent 45%,#F14625 45% 55%,transparent 55%)}" +
    "#e49ed .toast{position:fixed;top:84px;left:50%;transform:translateX(-50%);background:#F14625;color:#fff;border-radius:999px;padding:8px 16px;font-weight:600;opacity:0;transition:opacity .2s}" +
    "#e49ed .toast.on{opacity:1}" +
    "#e49-hov,#e49-sel{position:fixed;pointer-events:none;display:none;z-index:2147482999}" +
    "#e49-hov{border:1px dashed rgba(241,70,37,.7)}" +
    "#e49-sel{border:2px solid #F14625}" +
    "#e49-sel .nm{position:absolute;left:-2px;bottom:100%;background:#F14625;color:#fff;font:600 11px Figtree,sans-serif;padding:2px 8px;border-radius:6px 6px 0 0;white-space:nowrap}" +
    "#e49-sel .hd{position:absolute;right:-8px;bottom:-8px;width:14px;height:14px;background:#fff;border:2px solid #F14625;border-radius:4px;pointer-events:auto;cursor:nwse-resize}" +
    "html.e49-editing,html.e49-editing *{cursor:default}" +
    "html.e49-editing [contenteditable=true]{outline:2px solid #F14625;outline-offset:3px;cursor:text;user-select:text;-webkit-user-select:text}" +
    "html.e49-editing .rv,html.e49-editing .split-h,html.e49-editing .display,html.e49-editing .rise{opacity:1!important;transform:none!important}" +
    "html.e49-editing .split-h .wi,html.e49-editing .display .wd>span{transform:none!important;opacity:1!important}";
  document.head.appendChild(css);
  root.classList.add("e49-editing");

  var ui = document.createElement("div");
  ui.id = "e49ed";
  ui.innerHTML =
    '<div class="bar">' +
      '<select id="e49-pages" title="Trocar de página" aria-label="Trocar de página"></select>' +
      '<span class="tag" id="e49-where"></span>' +
      '<button id="e49-undo" disabled title="Desfazer (Ctrl+Z)">Desfazer</button>' +
      '<button id="e49-save" class="pri" title="Salvar (Ctrl+S)">Salvar</button>' +
      '<button id="e49-pub" title="Salva e atualiza a cópia de teste que está no ar">Publicar</button>' +
      '<button id="e49-exit">Sair</button>' +
    '</div>' +
    '<div class="insp" id="e49-insp" hidden>' +
      '<span class="tag" id="e49-nm"></span>' +
      '<label>Texto <button id="e49-fs-" title="Diminuir">A-</button><input type="number" id="e49-fs" min="8" max="400"><button id="e49-fs+" title="Aumentar">A+</button></label>' +
      '<label>Largura <input type="number" id="e49-w" min="10" max="3000"></label>' +
      '<label>Girar <input type="number" id="e49-rot" min="-180" max="180"></label>' +
      '<label>Cantos <input type="range" id="e49-rad" min="0" max="200"></label>' +
      '<label>Cor do texto <span class="sw" id="e49-col"></span></label>' +
      '<label>Fundo <span class="sw" id="e49-bg"></span></label>' +
      '<button id="e49-parent" title="Selecionar o bloco de fora">Bloco acima</button>' +
      '<button id="e49-reset">Restaurar</button>' +
      '<button id="e49-hide">Esconder</button>' +
    '</div>' +
    '<div class="toast" id="e49-toast"></div>';
  document.body.appendChild(ui);
  var hovBox = document.createElement("div"); hovBox.id = "e49-hov";
  var selBox = document.createElement("div"); selBox.id = "e49-sel";
  selBox.innerHTML = '<span class="nm"></span><span class="hd"></span>';
  document.body.appendChild(hovBox); document.body.appendChild(selBox);

  var $ = function (id) { return document.getElementById(id); };
  $("e49-where").textContent = B === "d" ? "tela de computador" : "tela de celular";

  /* trocar de página sem sair do modo de edição (os links do site ficam travados aqui) */
  var PAGES = [["/", "Início"], ["/sistemas/", "Sistemas"], ["/sites/", "Sites"], ["/video-e-fotos/", "Vídeo e redes"], ["/uniformes/", "Uniformes"], ["/contato/", "Contato"], ["/quem-somos/", "Quem somos"], ["/privacidade/", "Privacidade"]];
  var pageSel = $("e49-pages");
  PAGES.forEach(function (p) {
    var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1];
    if (p[0] === E.key) o.selected = true;
    pageSel.appendChild(o);
  });
  pageSel.addEventListener("change", function () {
    var go = pageSel.value;
    if (dirty && !confirm("Tem mudanças sem salvar. Trocar de página mesmo assim?")) { pageSel.value = E.key; return; }
    dirty = false;
    location.href = E.base + go.replace(/^\//, "") + "?editar";
  });

  function swatches(host, prop) {
    var none = document.createElement("i"); none.className = "none"; none.title = "Cor original";
    none.addEventListener("click", function () { setGeom(prop, null); });
    host.appendChild(none);
    COLORS.forEach(function (c) {
      var i = document.createElement("i"); i.style.background = c[0]; i.title = c[1];
      i.addEventListener("click", function () { setGeom(prop, c[0]); });
      host.appendChild(i);
    });
  }
  swatches($("e49-col"), "color");
  swatches($("e49-bg"), "bg");

  function toast(t, ms) {
    var el = $("e49-toast"); el.textContent = t; el.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove("on"); }, ms || 2200);
  }

  /* ---------- escolher elementos ---------- */
  function inUI(t) { return t && t.closest && (t.closest("#e49ed") || t.closest("#e49-sel") || t.closest("#e49-hov")); }
  function skipEl(s) { return s.id === "e49ed" || s.id === "e49-hov" || s.id === "e49-sel" || /(^|\s)(fx|trail)(\s|$)/.test(s.className && s.className.baseVal === undefined ? s.className : ""); }

  function pick(t) {
    if (!t || t.nodeType !== 1 || inUI(t)) return null;
    if (t.closest(".fx,.trail")) return null;
    var c = t.closest(".split-h") || t.closest(".btn");
    if (c) return c;
    while (t.ownerSVGElement) t = t.ownerSVGElement;
    while (t && t.parentElement && (INLINE[t.tagName] || (t.tagName === "SPAN" && !t.className))) t = t.parentElement;
    if (!t || t === document.body || t === root || t.tagName === "MAIN") return null;
    return t;
  }

  function selFor(el) {
    var parts = [];
    while (el && el !== document.body) {
      if (el.id && document.querySelectorAll("#" + CSS.escape(el.id)).length === 1) { parts.unshift("#" + CSS.escape(el.id)); break; }
      var i = 1, s = el;
      while ((s = s.previousElementSibling)) if (s.tagName === el.tagName && !skipEl(s)) i++;
      parts.unshift(el.tagName.toLowerCase() + ":nth-of-type(" + i + ")");
      el = el.parentElement;
    }
    return (parts[0] && parts[0][0] === "#" ? "" : "body > ") + parts.join(" > ");
  }

  function nameOf(el) {
    var tag = el.tagName.toLowerCase();
    var map = { h1: "título", h2: "título", h3: "título", h4: "título", p: "parágrafo", a: "link", img: "imagem", svg: "ícone", li: "item", section: "seção", div: "bloco", span: "texto", button: "botão" };
    var n = el.classList.contains("btn") ? "botão" : (map[tag] || tag);
    var t = (el.textContent || "").trim().replace(/\s+/g, " ");
    return n + (t ? ' · "' + (t.length > 22 ? t.slice(0, 22) + "…" : t) + '"' : "");
  }

  function placeInsp() { $("e49-insp").style.bottom = (ui.querySelector(".bar").offsetHeight + 24) + "px"; }
  window.addEventListener("resize", placeInsp);
  function selectEl(el) {
    sel = el;
    $("e49-insp").hidden = !el;
    placeInsp();
    if (el) { $("e49-nm").textContent = nameOf(el); fillInsp(); }
    drawSel();
  }

  function rec(el, create) {
    var s = selFor(el);
    if (!page[s] && create) page[s] = {};
    return { s: s, p: page[s] };
  }

  function fillInsp() {
    if (!sel) return;
    var cs = getComputedStyle(sel), r = rec(sel).p || {}, g = r[B] || {};
    $("e49-fs").value = Math.round(parseFloat(cs.fontSize));
    $("e49-w").value = Math.round(sel.getBoundingClientRect().width);
    $("e49-rot").value = g.rot || 0;
    $("e49-rad").value = parseFloat(cs.borderTopLeftRadius) || 0;
    $("e49-hide").textContent = r.hide ? "Mostrar" : "Esconder";
  }

  /* ---------- guardar mudanças ---------- */
  function snapshot() {
    undo.push(JSON.stringify(page));
    if (undo.length > 80) undo.shift();
    $("e49-undo").disabled = false;
    dirty = true;
  }

  function clean() {
    Object.keys(page).forEach(function (k) {
      var p = page[k];
      ["d", "m"].forEach(function (b) {
        if (!p[b]) return;
        Object.keys(p[b]).forEach(function (f) { var v = p[b][f]; if (v == null || v === "" || (f !== "dx" && f !== "dy" && v === 0 && f !== "radius")) delete p[b][f]; });
        if (!Object.keys(p[b]).length) delete p[b];
      });
      if (!p.hide) delete p.hide;
      if (!Object.keys(p).length) delete page[k];
    });
  }

  function reapply(el, p) {
    var o = orig.get(el);
    if (o != null) el.innerHTML = o;
    E.apply(el, p || {}, B);
    showHidden(el, p);
  }

  function showHidden(el, p) {
    el.style.display = "";
    el.style.opacity = p && p.hide ? "0.25" : "";
  }
  Object.keys(page).forEach(function (k) {
    var el = null; try { el = document.querySelector(k); } catch (e) {}
    if (el && page[k].hide) showHidden(el, page[k]);
  });

  function setGeom(prop, val, noSnap) {
    if (!sel) return;
    if (!noSnap) snapshot();
    var r = rec(sel, true);
    var g = r.p[B] = r.p[B] || {};
    if (val == null || val === "") delete g[prop]; else g[prop] = val;
    E.geom(sel, g);
    fillInsp(); drawSel();
  }

  function doUndo() {
    if (!undo.length) return;
    var prev = JSON.parse(undo.pop());
    var keys = {};
    Object.keys(page).concat(Object.keys(prev)).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var el = null; try { el = document.querySelector(k); } catch (e) {}
      if (el) reapply(el, prev[k]);
    });
    page = edits[E.key] = prev;
    $("e49-undo").disabled = !undo.length;
    dirty = true;
    if (sel) { if (!document.contains(sel)) selectEl(null); else fillInsp(); }
    drawSel();
  }

  /* ---------- texto ---------- */
  function editable(el) {
    if (el.matches("img,svg,video,input,select,textarea")) return false;
    return !el.querySelector(BLOCK.replace("a.btn,.btn", ".btn"));
  }

  function startEdit(el, e) {
    if (!editable(el)) { toast("Esse bloco tem outros itens. Dê duplo clique direto no texto."); return; }
    if (editEl) endEdit();
    snapshot();
    if (!orig.has(el)) orig.set(el, el.innerHTML);
    var host = el;
    if (el.classList.contains("split-h")) {
      var plain = el.getAttribute("aria-label") || el.textContent.trim();
      el.removeAttribute("aria-label");
      el.textContent = plain;
      el.classList.add("in");
    } else if (el.classList.contains("btn")) {
      var bt = el.querySelector(".bt");
      host = bt ? bt.firstElementChild : el;
    }
    editEl = el;
    editEl._host = host;
    host.setAttribute("contenteditable", "true");
    host.focus();
    try {
      var r = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      var s = getSelection(); s.removeAllRanges();
      if (r && host.contains(r.startContainer)) s.addRange(r);
      else { var all = document.createRange(); all.selectNodeContents(host); s.addRange(all); }
    } catch (x) {}
  }

  function endEdit() {
    if (!editEl) return;
    var el = editEl, host = el._host;
    host.removeAttribute("contenteditable");
    var r = rec(el, true), p = r.p;
    if (el.classList.contains("split-h")) {
      p.txt = el.textContent.trim().replace(/\s+/g, " ");
    } else if (el.classList.contains("btn")) {
      var t = host.textContent.trim();
      p.label = t;
      var dup = host.parentElement && host.parentElement.querySelector("span[aria-hidden]");
      if (dup && dup !== host) dup.textContent = t;
    } else {
      p.html = el.innerHTML.replace(/\scontenteditable="[^"]*"/g, "");
    }
    editEl = null; dirty = true;
    selectEl(el);
  }

  /* ---------- caixas de seleção ---------- */
  function box(b, el, extra) {
    if (!el || !document.contains(el)) { b.style.display = "none"; return; }
    var r = el.getBoundingClientRect();
    b.style.display = "block";
    b.style.left = r.left + "px"; b.style.top = r.top + "px";
    b.style.width = r.width + "px"; b.style.height = r.height + "px";
    if (extra) extra(b);
  }
  function drawSel() {
    box(selBox, sel);
    if (sel) selBox.querySelector(".nm").textContent = nameOf(sel);
    selBox.querySelector(".hd").style.display = editEl ? "none" : "block";
  }
  function drawHov() { box(hovBox, hov && hov !== sel && !drag ? hov : null); }
  (function loop() { drawSel(); drawHov(); requestAnimationFrame(loop); })();

  /* ---------- mouse ---------- */
  window.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest("#e49-sel .hd")) {
      e.preventDefault();
      drag = { mode: "size", sx: e.clientX, w0: sel.getBoundingClientRect().width, moved: false };
      return;
    }
    if (inUI(e.target)) return;
    if (editEl && editEl._host.contains(e.target)) return;
    if (editEl) endEdit();
    var t = pick(e.target);
    e.preventDefault();
    if (!t) { selectEl(null); return; }
    selectEl(t);
    var g = ((rec(t).p || {})[B]) || {};
    drag = { mode: "move", sx: e.clientX, sy: e.clientY, dx0: g.dx || 0, dy0: g.dy || 0, moved: false };
  }, true);

  window.addEventListener("pointermove", function (e) {
    if (drag) {
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!drag.moved) { snapshot(); drag.moved = true; }
      if (drag.mode === "move") {
        if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        setGeom("dx", Math.round(drag.dx0 + dx), true);
        setGeom("dy", Math.round(drag.dy0 + dy), true);
      } else {
        setGeom("w", Math.max(10, Math.round(drag.w0 + dx)), true);
      }
      return;
    }
    if (editEl || inUI(e.target)) { hov = null; return; }
    hov = pick(e.target);
  }, true);

  window.addEventListener("pointerup", function () { drag = null; }, true);

  window.addEventListener("dblclick", function (e) {
    if (inUI(e.target) || (editEl && editEl._host.contains(e.target))) return;
    var t = pick(e.target);
    if (!t) return;
    e.preventDefault();
    selectEl(t);
    startEdit(t, e);
  }, true);

  ["click", "auxclick", "submit", "contextmenu"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (inUI(e.target)) return;
      if (editEl && editEl._host.contains(e.target) && ev === "click") { e.stopPropagation(); return; }
      e.preventDefault(); e.stopPropagation();
    }, true);
  });

  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "s") { e.preventDefault(); save(); return; }
    if (editEl) {
      if (k === "Escape") { e.preventDefault(); endEdit(); }
      return;
    }
    if (e.target && e.target.matches && e.target.matches("input")) return;
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") { e.preventDefault(); doUndo(); return; }
    if (!sel) return;
    if (k === "Escape") { selectEl(null); return; }
    if (k === "Enter") { e.preventDefault(); var r = sel.getBoundingClientRect(); startEdit(sel, { clientX: r.left + 4, clientY: r.top + 4 }); return; }
    if (k === "Delete" || k === "Backspace") { e.preventDefault(); toggleHide(); return; }
    var step = e.shiftKey ? 10 : 1, g = ((rec(sel).p || {})[B]) || {}, d = null;
    if (k === "ArrowLeft") d = ["dx", (g.dx || 0) - step];
    else if (k === "ArrowRight") d = ["dx", (g.dx || 0) + step];
    else if (k === "ArrowUp") d = ["dy", (g.dy || 0) - step];
    else if (k === "ArrowDown") d = ["dy", (g.dy || 0) + step];
    if (d) { e.preventDefault(); setGeom(d[0], d[1]); }
  }, true);

  /* ---------- painel ---------- */
  function num(id, prop, scale) {
    $(id).addEventListener("change", function () { setGeom(prop, this.value === "" ? null : parseFloat(this.value)); });
  }
  num("e49-fs", "fs"); num("e49-w", "w"); num("e49-rot", "rot");
  $("e49-rad").addEventListener("input", function () { setGeom("radius", parseFloat(this.value)); });
  $("e49-fs-").addEventListener("click", function () { setGeom("fs", Math.max(8, parseFloat($("e49-fs").value) - 2)); });
  $("e49-fs+").addEventListener("click", function () { setGeom("fs", parseFloat($("e49-fs").value) + 2); });
  $("e49-parent").addEventListener("click", function () {
    var p = sel && sel.parentElement;
    while (p && p !== document.body && p.tagName === "SPAN") p = p.parentElement;
    if (p && p !== document.body && p.tagName !== "MAIN") selectEl(p);
  });
  function toggleHide() {
    if (!sel) return;
    snapshot();
    var r = rec(sel, true);
    r.p.hide = !r.p.hide;
    if (r.p.hide) {
      sel.style.opacity = "0.25"; sel.style.display = "";
      toast("Escondido. No site publicado esse item some.");
    } else sel.style.opacity = "";
    fillInsp();
  }
  $("e49-hide").addEventListener("click", toggleHide);
  $("e49-reset").addEventListener("click", function () {
    if (!sel) return;
    snapshot();
    var s = selFor(sel);
    delete page[s];
    reapply(sel, {});
    sel.style.opacity = "";
    fillInsp();
  });
  $("e49-undo").addEventListener("click", doUndo);

  /* ---------- salvar ---------- */
  function save() {
    if (editEl) endEdit();
    clean();
    var body = JSON.stringify(edits, null, 1);
    return fetch("/__save", { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
      .then(function (r) { if (!r.ok) throw new Error("save"); dirty = false; toast("Salvo no site"); return true; })
      .catch(function () {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([body], { type: "application/json" }));
        a.download = "edits.json"; a.click();
        toast("Sem servidor de edição: baixei o edits.json");
        return false;
      });
  }
  $("e49-save").addEventListener("click", save);

  /* ---------- publicar a cópia de teste (salva e envia) ---------- */
  var publishing = false;
  function publish() {
    if (publishing) return;
    if (!confirm("Isso salva as mudanças e atualiza a cópia de teste que está no ar (https://vinipn.github.io/e49-site-teste/). Continuar?")) return;
    publishing = true;
    var btn = $("e49-pub"); btn.disabled = true; btn.textContent = "Publicando...";
    save().then(function (ok) {
      if (!ok) throw new Error("save");
      return fetch("/__publish", { method: "POST" });
    }).then(function (r) {
      if (!r.ok) throw new Error("publish");
      toast("Publicado. Em cerca de 1 minuto está no ar.");
    }).catch(function () {
      toast("Não consegui publicar. Peça ajuda ao Claude.");
    }).then(function () { publishing = false; btn.disabled = false; btn.textContent = "Publicar"; });
  }
  $("e49-pub").addEventListener("click", publish);
  setTimeout(function () { toast("Dê dois cliques num texto para editar. Depois, Salvar e Publicar.", 7000); }, 600);
  $("e49-exit").addEventListener("click", function () {
    if (dirty && !confirm("Tem mudanças sem salvar. Sair mesmo assim?")) return;
    dirty = false;
    location.href = location.pathname;
  });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
})();
