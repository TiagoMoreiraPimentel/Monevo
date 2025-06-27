document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const inputValor = document.getElementById("valor");
  if (inputValor) {
    inputValor.addEventListener("input", () => {
      let valor = inputValor.value.replace(/\D/g, "");
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      inputValor.value = parseFloat(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    });
  }

  const formDespesa = document.getElementById("form-despesa-fixa");
  if (formDespesa) {
    formDespesa.addEventListener("submit", async (e) => {
      e.preventDefault();

      const categoria = document.getElementById("categoria")?.value.trim();
      const ciclo = parseInt(document.getElementById("ciclo")?.value);
      const descricao = document.getElementById("descricao")?.value.trim();
      const valorFormatado = document.getElementById("valor")?.value;
      const valor = parseFloat(valorFormatado.replace(/[^\d,-]/g, "").replace(",", "."));

      const data_lancamento_raw = document.getElementById("data_lancamento")?.value;
      const vencimento_raw = document.getElementById("vencimento")?.value;

      if (!categoria || isNaN(valor) || isNaN(ciclo) || !data_lancamento_raw || !vencimento_raw) {
        mostrarMensagem("Preencha todos os campos obrigatórios corretamente.");
        return;
      }

      const data_lancamento = new Date(data_lancamento_raw).toISOString();
      const vencimento = new Date(vencimento_raw).toISOString();

      const novaDespesa = {
        id_usuario: usuario.id,
        categoria,
        valor,
        descricao,
        ciclo,
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
  }

  carregarDespesas();
});

function mostrarMensagem(msg) {
  const msgEl = document.getElementById("mensagem");
  if (msgEl) msgEl.innerText = msg;
  else alert(msg); // fallback
}

async function carregarDespesas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const tabela = document.getElementById("tabela-despesas");

  if (!usuario || !tabela) return;

  try {
    const res = await fetch(`/api/despesas_fixas?id_usuario=${usuario.id}`);
    const despesas = await res.json();

    if (!Array.isArray(despesas)) {
      console.error("Resposta inesperada:", despesas);
      mostrarMensagem("Erro ao carregar despesas.");
      return;
    }

    tabela.innerHTML = "";
    despesas.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categoria}</td>
        <td>R$ ${d.valor.toFixed(2).replace(".", ",")}</td>
        <td>${d.ciclo} dias</td>
        <td>${formatarData(d.data_lancamento)}</td>
        <td>${formatarData(d.vencimento)}</td>
        <td>${d.descricao || "-"}</td>
        <td><button onclick="excluirDespesa(${d.id_despesa_fixa})">Excluir</button></td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar despesas.");
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
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
