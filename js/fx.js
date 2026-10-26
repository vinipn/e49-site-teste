/* (e)studio49 - efeitos de movimento: abertura com o logotipo, transição de faixas entre páginas e traço discreto que acompanha a rolagem. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var BRASA = "#F14625", SERRA = "#1C2A3A";
  var EASE_OUT = "cubic-bezier(.16,1,.3,1)";
  var SPRING = "cubic-bezier(.34,1.56,.64,1)";
  var EASE_IO = "cubic-bezier(.7,0,.2,1)";
  var EASE_DRAW = "cubic-bezier(.65,0,.35,1)";

  function ss(op, k, v) {
    try { if (op === "get") return sessionStorage.getItem(k); if (op === "set") sessionStorage.setItem(k, v); if (op === "del") sessionStorage.removeItem(k); } catch (e) { return null; }
    return null;
  }
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function run(node, frames, opts) { opts.fill = "both"; return node.animate(frames, opts); }
  function release() { root.classList.remove("tr-cover", "intro-cover"); }

  // curva suave que passa por todos os pontos (usada pelo traço que acompanha a rolagem)
  function catmull(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- transição entre páginas: duas faixas inclinadas (Brasa e Serra) cruzam a tela ---------- */
  var T_MS = 340, T_GAP = 50, T_EASE = "cubic-bezier(.65,0,.35,1)";
  var OFF_IN = "translateX(125vw)", ON = "translateX(0)", OFF_OUT = "translateX(-128vw)";

  function makeWipe(covered) {
    var fx = document.createElement("div");
    fx.className = "fx fx-wipe";
    fx.setAttribute("aria-hidden", "true");
    var a = document.createElement("div"), b = document.createElement("div");
    a.className = "wp wp-a"; b.className = "wp wp-b";
    a.style.transform = b.style.transform = covered ? ON : OFF_IN;
    fx.appendChild(a); fx.appendChild(b);
    document.body.appendChild(fx);
    return { fx: fx, a: a, b: b };
  }
  function slide(el, from, to, delay) {
    return run(el, [{ transform: from }, { transform: to }], { duration: T_MS, delay: delay, easing: T_EASE });
  }

  // entrada na página nova: as faixas já cobrem a tela e saem para a esquerda
  if (root.classList.contains("tr-cover") && !reduce) {
    var s = makeWipe(true);
    ss("del", "e49tr");
    release();
    slide(s.b, ON, OFF_OUT, 0);
    var last = slide(s.a, ON, OFF_OUT, T_GAP);
    last.onfinish = function () { if (s.fx.parentNode) s.fx.parentNode.removeChild(s.fx); };
  } else if (root.classList.contains("tr-cover")) {
    ss("del", "e49tr"); release();
  }

  // saída: as faixas cobrem a tela e só então abre a próxima página
  var leaving = false;
  document.addEventListener("click", function (e) {
    if (reduce || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    e.preventDefault();
    leaving = true;
    ss("set", "e49tr", "1");
    var s = makeWipe(false);
    s.fx.style.pointerEvents = "auto";
    slide(s.a, OFF_IN, ON, 0);
    slide(s.b, OFF_IN, ON, T_GAP);
    setTimeout(function () { location.href = u.href; }, T_MS + T_GAP + 30);
  });
  window.addEventListener("pageshow", function (ev) {
    if (!ev.persisted) return;
    leaving = false;
    document.querySelectorAll(".fx").forEach(function (n) { n.parentNode.removeChild(n); });
    release();
  });
  /* ---------- abertura com o logotipo (só na home, uma vez por visita) ---------- */
  function runIntro() {
    var logoImg = document.querySelector(".logo img");
    if (!logoImg || !window.fetch || !window.DOMParser) { ss("set", "e49intro", "1"); release(); return; }
    var fx = document.createElement("div");
    fx.className = "fx fx-intro";
    fx.setAttribute("aria-hidden", "true");
    fx.style.pointerEvents = "auto";
    var bg = document.createElement("div"); bg.className = "fx-bg";
    var edge = document.createElement("div"); edge.className = "fx-edge";
    fx.appendChild(bg); fx.appendChild(edge);
    document.body.appendChild(fx);
    ss("set", "e49intro", "1");
    var finished = false, wiped = false;
    function finish() {
      if (finished) return; finished = true;
      if (fx.parentNode) fx.parentNode.removeChild(fx);
      release();
    }
    function wipe() {
      if (wiped) return; wiped = true;
      release();
      var from = "polygon(0 0, 130% 0, 100% 100%, 0 100%)", to = "polygon(0 0, 30% 0, 0% 100%, 0 100%)";
      run(bg, [{ clipPath: from }, { clipPath: to }], { duration: 900, easing: EASE_IO });
      var ef = "polygon(124% 0, 130% 0, 100% 100%, 94% 100%)", et = "polygon(24% 0, 30% 0, 0% 100%, -6% 100%)";
      var w = run(edge, [{ clipPath: ef }, { clipPath: et }], { duration: 900, easing: EASE_IO });
      w.onfinish = finish;
      var lg = fx.querySelector(".fx-logo");
      if (lg) run(lg, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }], { duration: 500, delay: 80, easing: "ease-in" });
    }
    fx.addEventListener("click", wipe);
    fetch(logoImg.getAttribute("src"), { cache: "force-cache" }).then(function (r) { return r.text(); }).then(function (txt) {
      var src = new DOMParser().parseFromString(txt, "image/svg+xml").documentElement;
      var paths = [].slice.call(src.querySelectorAll("path"));
      if (paths.length < 13) { wipe(); return; }
      var wrap = document.createElement("div"); wrap.className = "fx-logo";
      var svg = svgEl("svg", { viewBox: src.getAttribute("viewBox"), role: "presentation" });
      var g = svgEl("g", { transform: "scale(1 -1)" }, svg);
      var els = paths.map(function (p) {
        var n = svgEl("path", { d: p.getAttribute("d"), fill: p.getAttribute("fill") }, g);
        n.style.transformBox = "fill-box"; n.style.transformOrigin = "50% 50%"; n.style.opacity = "0";
        return n;
      });
      wrap.appendChild(svg); fx.appendChild(wrap);
      // 0 "(" · 1 ")" · 2 s · 3 t · 4 u · 5 d · 6 i · 7 pingo · 8 o · 9 e · 10 "4" · 11 "9" · 12 acento
      run(els[9], [{ opacity: 0, transform: "scale(0) rotate(-40deg)" }, { opacity: 1, transform: "scale(1) rotate(0)" }], { duration: 750, delay: 150, easing: SPRING });
      run(els[0], [{ opacity: 0, transform: "translateX(-160px) scale(.6)" }, { opacity: 1, transform: "translateX(0) scale(1)" }], { duration: 800, delay: 650, easing: SPRING });
      run(els[1], [{ opacity: 0, transform: "translateX(160px) scale(.6)" }, { opacity: 1, transform: "translateX(0) scale(1)" }], { duration: 800, delay: 650, easing: SPRING });
      [2, 3, 4, 5, 6, 7, 8, 12].forEach(function (i, k) {
        run(els[i], [{ opacity: 0, transform: "translateY(-80px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, delay: 1050 + k * 70, easing: EASE_OUT });
      });
      [10, 11].forEach(function (i, k) {
        run(els[i], [{ opacity: 0, transform: "scale(0) rotate(12deg)" }, { opacity: 1, transform: "scale(1) rotate(0)" }], { duration: 650, delay: 1650 + k * 110, easing: SPRING });
      });
      setTimeout(wipe, 2750);
    }).catch(wipe);
    setTimeout(finish, 6000);
  }
  if (root.classList.contains("intro-cover")) {
    if (reduce || ss("get", "e49intro")) { release(); } else { runIntro(); }
  }

  /* ---------- traço discreto que acompanha a rolagem (anda pelas margens e só cruza nos vazios) ---------- */
  var host = document.querySelector(".trail");
  if (host && !reduce && window.requestAnimationFrame) {
    var svg2 = host.querySelector("svg");
    var line = host.querySelector(".t-line");
    var cum = [], total = 0, N = 0, docH = 0, W = 0, ticking = false;

    var blocks = function () {
      var sy = window.scrollY, out = [];
      var main = document.querySelector("main");
      if (!main) return out;
      var sel = "h1,h2,h3,h4,p,li,summary,label,dt,dd,th,td,.btn,button,.hs-card,.step-card,.stage,.orbit,.form,.result,.preview,.price-big,.note,.group,.display,.sub";
      main.querySelectorAll(sel).forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        out.push([r.top + sy, r.bottom + sy]);
      });
      // seções com rolagem presa ou fundo cheio: o traço não cruza por dentro delas
      main.querySelectorAll(".hs,.sc,.how,.price-band,.hero,.page-hero").forEach(function (e) {
        var r = e.getBoundingClientRect();
        out.push([r.top + sy, r.bottom + sy]);
      });
      return out;
    };
    var freeGaps = function (occ, minH) {
      occ.sort(function (a, b) { return a[0] - b[0]; });
      var pad = 22, merged = [];
      occ.forEach(function (iv) {
        var a = iv[0] - pad, b = iv[1] + pad;
        if (merged.length && a <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b);
        else merged.push([a, b]);
      });
      var gaps = [];
      for (var i = 0; i < merged.length - 1; i++) {
        if (merged[i + 1][0] - merged[i][1] >= minH) gaps.push([merged[i][1], merged[i + 1][0]]);
      }
      return gaps;
    };

    var plan = function (w, h) {
      var wrapEl = document.querySelector("main .wrap");
      var cl = 20, cr = w - 20;
      if (wrapEl) {
        var wr = wrapEl.getBoundingClientRect(), cs = getComputedStyle(wrapEl);
        cl = wr.left + parseFloat(cs.paddingLeft); cr = wr.right - parseFloat(cs.paddingRight);
      }
      var sw = w < 720 ? 3.5 : 5;
      var gapL = Math.max(0, cl - 14 - 8), gapR = Math.max(0, w - 8 - (cr + 14));
      var xL = gapL > 14 ? 8 + gapL / 2 : Math.max(5, cl / 2 - 2), aL = gapL > 14 ? Math.max(0, gapL / 2 - sw - 4) : 1.5;
      var xR = gapR > 14 ? w - 8 - gapR / 2 : Math.min(w - 5, cr + (w - cr) / 2 + 2), aR = gapR > 14 ? Math.max(0, gapR / 2 - sw - 4) : 1.5;
      var foot = document.querySelector(".footer");
      var endY = foot ? foot.getBoundingClientRect().top + window.scrollY + 6 : h - 40;
      // o traço começa sozinho, na margem direita, perto do fim da primeira dobra
      var hero = document.querySelector(".hero, .page-hero");
      var y0 = 120;
      if (hero) { var hr = hero.getBoundingClientRect(); y0 = hr.bottom + window.scrollY - 40; }
      var x0 = xR;
      var gaps = freeGaps(blocks(), 90).filter(function (g) { return g[0] > y0 + 20 && g[1] < endY - 20; });
      var side = "R";
      var cx = function (s) { return s === "R" ? xR : xL; };
      var ax = function (s) { return s === "R" ? aR : aL; };
      var pts = [[w + 36, y0 - 46], [x0 + 22, y0 + 18]];      var y = y0 + 70, lastCross = y0, phase = 0;
      // anda pela margem, com uma ondulação suave
      var walk = function (toY) {
        for (; y < toY; y += 70) {
          var a = ax(side);
          pts.push([cx(side) + a * Math.sin(y / 120 + phase), y]);
        }
      };
      gaps.forEach(function (g) {
        if (g[0] - lastCross < 720) return;
        walk(g[0]);
        var other = side === "R" ? "L" : "R";
        var mid = (g[0] + g[1]) / 2;
        pts.push([cx(side), g[0] + 6]);
        pts.push([w / 2 + (side === "R" ? 40 : -40), mid]);
        pts.push([cx(other), g[1] - 6]);
        side = other; y = g[1] + 40; lastCross = g[1]; phase += 1.7;
      });
      walk(endY - 40);
      pts.push([cx(side), endY]);
      return { pts: pts, sw: sw };
    };

    var build = function () {
      host.style.height = "0px";
      var nh = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var nw = document.documentElement.clientWidth;
      docH = nh; W = nw;
      host.style.height = docH + "px";
      svg2.setAttribute("viewBox", "0 0 " + W + " " + docH);
      svg2.setAttribute("width", W); svg2.setAttribute("height", docH);
      var pl = plan(W, docH);
      line.setAttribute("d", catmull(pl.pts));
      line.style.strokeWidth = String(pl.sw);
      total = line.getTotalLength();
      line.style.strokeDasharray = total + " " + (total + 10);
      N = Math.max(160, Math.min(900, Math.round(total / 10)));
      cum = new Array(N + 1);
      var maxY = -1;
      for (var i = 0; i <= N; i++) { var p = line.getPointAtLength(total * i / N); if (p.y > maxY) maxY = p.y; cum[i] = maxY; }
      update();
    };
    var update = function () {
      ticking = false;
      if (!cum.length) return;
      var target = window.scrollY + window.innerHeight * 0.74;
      var lo = 0, hi = N;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] >= target) hi = mid; else lo = mid + 1; }
      var drawn = total * (lo / N);
      line.style.strokeDashoffset = String(total - drawn + 0.01);
      line.style.opacity = drawn < 2 ? "0" : "";
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    var timer = 0;
    var rebuild = function () { clearTimeout(timer); timer = setTimeout(build, 140); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", rebuild);
    window.addEventListener("load", function () { build(); setTimeout(build, 900); setTimeout(build, 2600); });
    if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(document.body);
    build();
  }
})();
