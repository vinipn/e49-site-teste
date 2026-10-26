/* (e)studio49 - comportamento do site: menu flutuante, botões, entradas ao rolar, vitrine de exemplos e formulário. */
(function () {
  var WA = "5549999819979";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  // botões: o texto gira no hover (duas cópias do rótulo, uma escondida)
  document.querySelectorAll(".btn").forEach(function (b) {
    Array.prototype.slice.call(b.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var t = n.textContent.trim();
      var s = document.createElement("span");
      s.className = "bt";
      s.innerHTML = "<span>" + t + '</span><span aria-hidden="true">' + t + "</span>";
      b.replaceChild(s, n);
    });
  });

  // menu: abre em tela cheia no celular
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("menu");
  var header = document.querySelector(".header");
  if (btn && nav) {
    var setMenu = function (open) {
      root.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    btn.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function () { setMenu(false); });
  }

  // menu flutuante: some ao rolar para baixo e volta ao rolar para cima
  if (header) {
    var lastY = window.scrollY, ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, d = y - lastY;
        if (y < 80 || d < -6) header.classList.remove("is-hidden");
        else if (d > 8 && !root.classList.contains("menu-open")) header.classList.add("is-hidden");
        if (Math.abs(d) > 6) lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // títulos em palavras que sobem (só em títulos de texto puro)
  document.querySelectorAll(".split-h").forEach(function (el) {
    if (el.children.length) return;
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span class="wi" style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
  });

  // texto grande: cada palavra ganha seu atraso
  document.querySelectorAll(".display").forEach(function (d) {
    var i = 0;
    d.querySelectorAll(".wd > span, .stk").forEach(function (el) { el.style.setProperty("--i", i++); });
  });

  // entrada ao rolar
  var items = document.querySelectorAll(".rv, .split-h, .display, .rise, .footer");
  if (items.length) {
    if (reduce || !hasIO) {
      items.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  // números que crescem até o valor certo quando aparecem na tela (porcentagens e preço)
  var counters = Array.prototype.slice.call(document.querySelectorAll(".facts strong, .price-big strong")).map(function (el) {
    var node = null;
    el.childNodes.forEach(function (n) { if (n.nodeType === 3 && /\d/.test(n.textContent)) node = n; });
    if (!node) return null;
    var m = node.textContent.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) return null;
    el.setAttribute("aria-label", el.textContent.trim());
    return { el: el, node: node, pre: m[1], suf: m[3], end: parseFloat(m[2].replace(/\./g, "").replace(",", ".")) };
  }).filter(Boolean);
  if (counters.length) {
    var runCount = function (c) {
      var t0 = 0, dur = 1600;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        c.node.textContent = c.pre + Math.round(c.end * e) + c.suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (reduce || !hasIO) { /* mantém o valor final */ }
    else {
      counters.forEach(function (c) { c.node.textContent = c.pre + "0" + c.suf; });
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          cio.unobserve(en.target);
          var c = counters.filter(function (x) { return x.el === en.target; })[0];
          if (c) setTimeout(function () { runCount(c); }, 250);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c.el); });
    }
  }

  // o botão flutuante sai de cena quando o rodapé (com o mesmo convite) aparece
  var fab = document.querySelector(".fab");
  var foot = document.querySelector(".footer");
  if (fab && foot && hasIO) {
    new IntersectionObserver(function (en) { fab.classList.toggle("is-off", en[0].isIntersecting); }, { threshold: 0.12 }).observe(foot);
  }

  // aparelhos: a tela só se mexe quando está visível
  var devs = document.querySelectorAll(".dev");
  if (devs.length && hasIO) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("is-paused", !en.isIntersecting); });
    }, { threshold: 0.05 });
    devs.forEach(function (d) { d.classList.add("is-paused"); dio.observe(d); });
  }

  // trilha pontilhada de "como funciona": desenha com a rolagem até a última etapa e os pontos andam junto
  var flow = document.querySelector(".flow"), fline = flow && flow.querySelector(".flow-line");
  if (flow && fline) {
    var fsteps = Array.prototype.slice.call(flow.querySelectorAll(".step")), nodeY = [], lineH = 0, fraf = 0;
    var measureFlow = function () {
      var fr = flow.getBoundingClientRect(), small = window.innerWidth < 900;
      nodeY = fsteps.map(function (s) { var r = s.getBoundingClientRect(); return r.top - fr.top + (small ? 40 : r.height / 2); });
      lineH = nodeY.length ? nodeY[nodeY.length - 1] : fr.height;
      fline.style.height = lineH + "px";
      updateFlow();
    };
    var updateFlow = function () {
      fraf = 0;
      var top = flow.getBoundingClientRect().top;
      var shown = reduce ? lineH : Math.max(0, Math.min(lineH, window.innerHeight * 0.66 - top));
      fline.style.clipPath = "inset(0 0 " + (lineH - shown).toFixed(1) + "px 0)";
      if (!reduce) fline.style.backgroundPositionY = (-window.scrollY * 0.35).toFixed(1) + "px";
      fsteps.forEach(function (s, i) { s.classList.toggle("on", nodeY[i] <= shown + 1); });
    };
    window.addEventListener("scroll", updateFlow, { passive: true });
    window.addEventListener("resize", measureFlow);
    window.addEventListener("load", measureFlow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureFlow);
    measureFlow();
  }

  // hero: os aparelhos acompanham o ponteiro
  var par = document.querySelector("[data-parallax]");
  if (par && finePointer && !reduce) {
    var host = par.closest(".hero") || par;
    var raf = 0, nx = 0, ny = 0;
    var apply = function () { raf = 0; par.style.setProperty("--px", nx.toFixed(3)); par.style.setProperty("--py", ny.toFixed(3)); };
    host.addEventListener("pointermove", function (e) {
      var r = host.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    host.addEventListener("pointerleave", function () { nx = 0; ny = 0; if (!raf) raf = requestAnimationFrame(apply); });
  }

  // vitrine: três exemplos de sites trocam conforme a rolagem
  var sc = document.querySelector(".sc");
  if (sc) {
    var screens = sc.querySelectorAll(".screen");
    var tabs = sc.querySelectorAll(".sc-tab");
    var tracks = sc.querySelectorAll(".sc-track");
    var sticky = window.matchMedia("(min-width: 900px)");
    var current = 0, timer = 0, touched = false;
    var setActive = function (i) {
      current = i;
      screens.forEach(function (s) { s.classList.toggle("on", Number(s.dataset.i) === i); });
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); });
    };
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () {
        touched = true; clearInterval(timer);
        if (sticky.matches && tracks[k]) {
          tracks[k].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
        setActive(k);
      });
    });
    if (hasIO) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && sticky.matches) setActive(Array.prototype.indexOf.call(tracks, en.target));
        });
      }, { rootMargin: "-48% 0px -48% 0px" });
      tracks.forEach(function (t) { tio.observe(t); });
    }
    // no celular não há rolagem presa: troca sozinho, até a pessoa mexer
    if (!reduce && hasIO) {
      var vis = false;
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }, { threshold: 0.3 }).observe(sc);
      timer = setInterval(function () {
        if (!sticky.matches && vis && !touched) setActive((current + 1) % tabs.length);
      }, 7000);
    }
  }

  // formulário de contato: monta a mensagem e abre o WhatsApp (nada é guardado)
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = form.elements.nome.value.trim();
      var assunto = form.elements.assunto.value;
      var msg = form.elements.mensagem.value.trim();
      var ok = true;
      [["nome", nome], ["assunto", assunto]].forEach(function (p) {
        var box = form.elements[p[0]].closest(".fld");
        var bad = !p[1];
        box.classList.toggle("bad", bad);
        if (bad) ok = false;
      });
      if (!ok) { var first = form.querySelector(".bad input, .bad select"); if (first) first.focus(); return; }
      var text = "Oi! Aqui é " + nome + ". Vim pelo site da (e)studio49 e quero falar sobre: " + assunto + "." + (msg ? "\n\n" + msg : "");
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
  }
})();
