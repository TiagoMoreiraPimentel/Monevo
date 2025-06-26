document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-despesa-fixa");
  const valorInput = document.getElementById("valor");
  const cicloInput = document.getElementById("ciclo");
  const totalFixasSpan = document.getElementById("total-fixas");

  let despesasFixas = [];

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }

  function limparMascara(valorStr) {
    if (!valorStr) return 0;
    const somenteNumeros = valorStr.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(somenteNumeros) || 0;
  }

  function aplicarMascaraMoeda(campo) {
    let valor = campo.value.replace(/\D/g, "");
    valor = (parseFloat(valor) / 100).toFixed(2);
    campo.value = Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  valorInput.addEventListener("input", () => {
    aplicarMascaraMoeda(valorInput);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = document.getElementById("data").value;
    const valorFormatado = valorInput.value;
    const valor = Number.isNaN(limparMascara(valorFormatado)) ? 0 : limparMascara(valorFormatado);

    console.log("Valor formatado:", valorFormatado);
    console.log("Valor numérico:", valor);

    const categoria = document.getElementById("categoria").value;
    const descricao = document.getElementById("descricao").value;
    const vencimento = document.getElementById("vencimento").value;
    const ciclo = parseInt(cicloInput.value);

    console.log({ data, valor, categoria, vencimento, ciclo });

    if (!data || valor <= 0 || !categoria || !vencimento || isNaN(ciclo) || ciclo < 1) {
      alert("Preencha todos os campos obrigatórios corretamente.");
      return;
    }


    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    const novaDespesa = {
      ID_USUARIO: usuario.id,
      DATA_REGISTRO: data,
      VALOR: valor,
      CATEGORIA: categoria,
      DESCRICAO: descricao?.trim() || null,
      DATA_VENCIMENTO: vencimento,
      CICLO_TOTAL: ciclo || 1,
      CICLO_PAGO: 0,
      CONCLUIDO: "N"
    };

    fetch("/api/despesas_fixas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaDespesa)
    })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao salvar despesa.");
      return res.json();
    })
    .then(() => {
      despesasFixas.push({ data, valor, categoria, descricao, vencimento, ciclo, pagos: 0 });
      form.reset();
      atualizarTotal();
      alert("Despesa fixa registrada com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao registrar despesa fixa:", err);
      alert("Erro ao registrar a despesa. Tente novamente.");
    });

  });

  function atualizarTotal() {
    const total = despesasFixas.reduce((soma, d) => soma + d.valor, 0);
    totalFixasSpan.textContent = formatarMoeda(total);
  }
});
