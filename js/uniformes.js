/* Calculadora de uniformes. Preços por peça (tabela do site antigo, confirmada pelo Vini no briefing). */
(function () {
  var WA = "5549999819979";
  var MIN = 7;
  var EXTRA = 8; // estampa maior ou nas costas, por peça
  var PRICES = {
    camiseta: { nome: "Camiseta", faixas: [65, 63, 60, 55] },
    polo: { nome: "Polo", faixas: [73, 70, 65, 60] },
    moletom: { nome: "Moletom", faixas: [120, 117, 115, 110] }
  };
  var TECIDOS = { elastano: "algodão com elastano (95% / 5%)", algodao: "100% algodão" };
  var form = document.getElementById("calc");
  if (!form) return;
  var out = {
    box: document.getElementById("result"),
    peca: document.getElementById("r-peca"),
    qtd: document.getElementById("r-qtd"),
    unit: document.getElementById("r-unit"),
    estampa: document.getElementById("r-estampa"),
    total: document.getElementById("r-total"),
    send: document.getElementById("r-send"),
    tecidoField: document.getElementById("f-tecido"),
    qty: document.getElementById("qtd"),
    preview: document.getElementById("preview")
  };
  var brl = function (n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var tier = function (q) { return q <= 20 ? 0 : q <= 30 ? 1 : q <= 50 ? 2 : 3; };
  var val = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; };
  var lastPeca = "camiseta";

  function render() {
    var peca = val("peca");
    var q = parseInt(out.qty.value, 10);
    if (isNaN(q) || q < 0) q = 0;
    var ehPolo = peca === "polo";
    if (ehPolo) { form.querySelector('input[name="estampa"][value="peito"]').checked = true; }
    document.getElementById("opt-maior").hidden = ehPolo;
    document.getElementById("h-polo").hidden = !ehPolo;
    var maior = val("estampa") === "maior";
    var ehCamiseta = peca === "camiseta";
    out.tecidoField.hidden = !ehCamiseta;

    var p = PRICES[peca];
    var under = q < MIN;
    var unit = p.faixas[tier(Math.max(q, MIN))] + (maior ? EXTRA : 0);
    var total = unit * q;

    out.box.classList.toggle("under", under);
    out.peca.textContent = p.nome + (ehCamiseta ? " (" + TECIDOS[val("tecido")] + ")" : "");
    out.qtd.textContent = q + (q === 1 ? " peça" : " peças");
    out.unit.textContent = brl(unit);
    out.estampa.textContent = maior ? "Maior ou nas costas" : "Logo no peito";
    out.total.textContent = under ? brl(unit * MIN) : brl(total);
    out.send.setAttribute("aria-disabled", under ? "true" : "false");
    out.send.tabIndex = under ? -1 : 0;

    // pré-visualização: só troca a peça (os mockups não mudam de cor)
    var pv = out.preview;
    if (peca !== lastPeca) {
      pv.dataset.g = peca;
      pv.classList.remove("swap"); void pv.offsetWidth; pv.classList.add("swap");
      lastPeca = peca;
    } else {
      pv.dataset.g = peca;
    }
    var cap = document.getElementById("pv-cap");
    if (cap) cap.textContent = maior
      ? "Pré-visualização com logo no peito. Estampa maior ou nas costas: a gente combina a arte com você."
      : "Pré-visualização ilustrativa. A arte final é aprovada com você.";
    var tecido = ehCamiseta ? ", " + TECIDOS[val("tecido")] : "";
    var text = "Oi! Vim pelo site da (e)studio49 e quero um orçamento de uniformes.\n\n" +
      "Peça: " + p.nome + tecido + "\n" +
      "Quantidade: " + q + " peças\n" +
      "Estampa: " + (maior ? "maior ou nas costas" : "logo no peito") + "\n" +
      "Estimativa do site: " + brl(unit) + " por peça, total " + brl(total) + "\n\n" +
      "Pode me confirmar a disponibilidade do tecido e das cores?";
    out.send.href = under ? "#" : "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
  }

  form.addEventListener("change", render);
  form.addEventListener("input", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      var q = parseInt(out.qty.value, 10) || MIN;
      q = Math.max(1, q + parseInt(b.dataset.step, 10));
      out.qty.value = q;
      render();
    });
  });
  out.send.addEventListener("click", function (e) {
    if (out.send.getAttribute("aria-disabled") === "true") e.preventDefault();
  });
  render();
})();
