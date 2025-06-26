// JS - despesas-fixas.js atualizado

document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDespesas();

  const inputValor = document.getElementById("valor");
  inputValor.addEventListener("input", () => {
    let valor = inputValor.value.replace(/\D/g, "");
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    inputValor.value = parseFloat(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  });

  document.getElementById("form-despesa-fixa").addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoria = document.getElementById("categoria").value.trim();
    const parcelas = parseInt(document.getElementById("parcelas").value);
    const descricao = document.getElementById("descricao").value.trim();
    const valorFormatado = document.getElementById("valor").value;
    const valor = parseFloat(valorFormatado.replace(/[^\d,-]/g, "").replace(",", "."));
    const data_lancamento = new Date(document.getElementById("data_lancamento").value + "T00:00:00").toISOString();
    const vencimento = new Date(document.getElementById("vencimento").value + "T00:00:00").toISOString();

    if (!categoria || isNaN(valor) || isNaN(parcelas) || !data_lancamento || !vencimento) {
      mostrarMensagem("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    const novaDespesa = {
      id_usuario: usuario.id,
      categoria,
      valor,
      descricao,
      parcelas,
      pagas: 0,
      data_lancamento,
      vencimento
    };

    try {
      const res = await fetch("/api/despesas_fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa)
      });

      if (res.ok) {
        mostrarMensagem("Despesa fixa cadastrada com sucesso.");
        e.target.reset();
        carregarDespesas();
      } else {
        const erro = await res.json();
        mostrarMensagem(erro.erro || "Erro ao cadastrar.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro de conexão com o servidor.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

async function carregarDespesas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const tabela = document.getElementById("tabela-despesas");

  try {
    const res = await fetch("/api/despesas_fixas");
    const despesas = await res.json();
    const minhas = despesas.filter(d => d.id_usuario === usuario.id);

    tabela.innerHTML = "";
    minhas.forEach(d => {
      const valorTotal = d.parcelas > 1 ? d.valor * d.parcelas - d.valor * (d.pagas || 0) : 0;
      const status = valorTotal > 0 ? "Pendente" : "Quitada";

      // calcular próxima data de vencimento
      let proximoVenc = new Date(d.vencimento);
      for (let i = 1; i < (d.pagas || 0); i++) {
        proximoVenc.setMonth(proximoVenc.getMonth() + 1);
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categoria}</td>
        <td>R$ ${d.valor.toFixed(2).replace(".", ",")}</td>
        <td>${d.parcelas > 1 ? "R$ " + (d.valor * d.parcelas).toFixed(2).replace(".", ",") : "-"}</td>
        <td>${d.pagas || 0}/${d.parcelas}</td>
        <td>${d.parcelas > 1 ? formatarData(proximoVenc.toISOString()) : formatarData(d.vencimento)}</td>
        <td>${status}</td>
        <td>${d.descricao || "-"}</td>
        <td>
          <button onclick="toggleParcelas(this, ${d.id_despesa_fixa}, ${d.parcelas}, ${d.pagas || 0}, '${d.vencimento}')">📂</button>
          <button onclick="excluirDespesa(${d.id_despesa_fixa})">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar despesas.");
  }
}

function toggleParcelas(botao, id, total, pagas, vencimento) {
  const tr = botao.closest("tr");
  const existe = tr.nextElementSibling?.classList.contains("linha-parcelas");

  if (existe) {
    tr.nextElementSibling.remove();
    return;
  }

  const novaLinha = document.createElement("tr");
  novaLinha.classList.add("linha-parcelas");

  let checkboxes = "";
  let venc = new Date(vencimento);
  for (let i = 1; i <= total; i++) {
    const checked = i <= pagas ? "checked" : "";
    const vencParcela = new Date(venc);
    vencParcela.setMonth(venc.getMonth() + (i - 1));
    const dataFormatada = vencParcela.toLocaleDateString("pt-BR");

    checkboxes += `
      <div>
        <input type="checkbox" id="p${id}_${i}" ${checked} onchange="atualizarParcela(${id}, ${i}, this.checked)" />
        <label for="p${id}_${i}">Parcela ${i} - Vence em ${dataFormatada}</label>
      </div>
    `;
  }

  novaLinha.innerHTML = `<td colspan="8"><div class="lista-parcelas">${checkboxes}</div></td>`;
  tr.insertAdjacentElement("afterend", novaLinha);
}

async function atualizarParcela(id, numero, marcado) {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const res = await fetch("/api/despesas_fixas");
  const todas = await res.json();
  const despesa = todas.find(d => d.id_usuario === usuario.id && d.id_despesa_fixa === id);

  if (!despesa) return;

  let novaPagas = despesa.pagas || 0;
  novaPagas = marcado
    ? Math.max(novaPagas, numero)
    : Math.min(novaPagas, numero - 1);

  // 🧠 Calcular nova data de vencimento
  let novaVencimento = null;
  if (novaPagas < despesa.parcelas) {
    const base = new Date(despesa.vencimento);
    base.setMonth(base.getMonth() - (despesa.parcelas - 1));
    base.setMonth(base.getMonth() + novaPagas);
    novaVencimento = base.toISOString();
  }

  try {
    await fetch("/api/despesas_fixas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...despesa, pagas: novaPagas, vencimento: novaVencimento })
    });
    carregarDespesas();
  } catch (err) {
    console.error("Erro ao atualizar parcelas:", err);
  }
}

async function excluirDespesa(id) {
  if (!confirm("Deseja excluir esta despesa fixa?")) return;

  try {
    const res = await fetch(`/api/despesas_fixas?id=${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      mostrarMensagem("Despesa excluída.");
      carregarDespesas();
    } else {
      mostrarMensagem("Erro ao excluir.");
    }
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro de conexão.");
  }
}
