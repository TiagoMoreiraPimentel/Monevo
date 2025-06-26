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

async function carregarDespesas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const tabela = document.getElementById("tabela-despesas");

  try {
    const res = await fetch("/api/despesas_fixas");
    const despesas = await res.json();
    const minhas = despesas.filter(d => d.id_usuario === usuario.id);

    tabela.innerHTML = "";
    minhas.forEach(d => {
      const pagas = d.pagas || 0;
      const total = d.parcelas || 1;
      const restantes = Math.max(total - pagas, 0);

      const valorParcela = d.valor;
      const totalCalculado = total > 1 ? restantes * valorParcela : (pagas >= 1 ? 0 : valorParcela);
      const valorTotalFormatado = `${totalCalculado.toFixed(2).replace(".", ",")}`;
      const valorParcelaFormatado = `${valorParcela.toFixed(2).replace(".", ",")}`;
      const status = totalCalculado === 0 ? "Quitada" : "Pendente";

      let proximoVenc = "-";
      if (restantes > 0 && d.vencimento) {
        const vencBase = new Date(d.vencimento);
        vencBase.setMonth(vencBase.getMonth() + pagas);
        proximoVenc = vencBase.toLocaleDateString("pt-BR", { timeZone: "UTC" });
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Categoria">${d.categoria}</td>
        <td data-label="Valor Parcela">${valorParcelaFormatado}</td>
        <td data-label="Valor Total">${valorTotalFormatado}</td>
        <td data-label="Progresso">${pagas}/${total}</td>
        <td data-label="Próximo Vencimento">${proximoVenc}</td>
        <td data-label="Status">${status}</td>
        <td data-label="Descrição" style="white-space: pre-wrap;">${d.descricao || "-"}</td>
        <td data-label="Ações">
          <div class="acoes-botoes">
            <button onclick="toggleParcelas(this, ${d.id_despesa_fixa}, ${total}, ${pagas}, '${d.vencimento}', ${valorParcela})">📂</button>
            <button onclick="excluirDespesa(${d.id_despesa_fixa})">Excluir</button>
          </div>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar despesas.");
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

function toggleParcelas(botao, id, total, pagas, vencimentoInicial, valorParcela) {
  const tr = botao.closest("tr");
  const existe = tr.nextElementSibling?.classList.contains("linha-parcelas");

  if (existe) {
    tr.nextElementSibling.remove();
    return;
  }

  const novaLinha = document.createElement("tr");
  novaLinha.classList.add("linha-parcelas");

  let checkboxes = "";
  const dataBase = new Date(vencimentoInicial);

  for (let i = 1; i <= total; i++) {
    const venc = new Date(dataBase);
    venc.setMonth(dataBase.getMonth() + (i - 1));
    const vencFormatado = venc.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const checked = i <= pagas ? "checked" : "";

    checkboxes += `
      <div style="margin-bottom: 8px;">
        <input type="checkbox" id="p${id}_${i}" ${checked}
          onchange="atualizarParcela(${id}, ${i}, this.checked)" />
        <label for="p${id}_${i}">
          Parcela ${i} — ${vencFormatado} — ${valorParcela.toFixed(2).replace(".", ",")}
        </label>
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

  try {
    await fetch("/api/despesas_fixas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...despesa, pagas: novaPagas })
    });
    carregarDespesas();
  } catch (err) {
    console.error("Erro ao atualizar parcelas:", err);
  }
}
