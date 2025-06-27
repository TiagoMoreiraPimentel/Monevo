document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  console.log("Usuário logado:", usuario);

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDespesas();

  document.getElementById("form-despesa-fixa").addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoria = document.getElementById("categoria").value.trim();
    const ciclo = parseInt(document.getElementById("ciclo").value);
    const descricao = document.getElementById("descricao").value.trim();
    const valorFormatado = document.getElementById("valor").value;
    const valor = parseFloat(valorFormatado.replace(/[^\d,-]/g, "").replace(",", "."));
    const data_lancamento_raw = document.getElementById("data_lancamento").value;
    const vencimento_raw = document.getElementById("vencimento").value;

    console.log("Valores capturados:", { categoria, ciclo, descricao, valor, data_lancamento_raw, vencimento_raw });

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

    console.log("Enviando nova despesa fixa:", novaDespesa);

    try {
      const res = await fetch("/api/despesas_fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa)
      });

      console.log("Resposta POST:", res.status);

      if (res.ok) {
        mostrarMensagem("Despesa fixa cadastrada com sucesso.");
        e.target.reset();
        carregarDespesas();
      } else {
        const erro = await res.json();
        console.error("Erro ao cadastrar:", erro);
        mostrarMensagem(erro.erro || "Erro ao cadastrar.");
      }
    } catch (err) {
      console.error("Erro de conexão ao cadastrar:", err);
      mostrarMensagem("Erro de conexão com o servidor.");
    }
  });
});

function mostrarMensagem(msg) {
  console.log("Mensagem:", msg);
  const el = document.getElementById("mensagem");
  if (el) el.innerText = msg;
}

async function carregarDespesas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const tabela = document.getElementById("tabela-despesas");

  console.log("Carregando despesas para usuário ID:", usuario.id);

  try {
    const res = await fetch(`/api/despesas_fixas?id_usuario=${usuario.id}`);
    console.log("Resposta GET despesas:", res.status);

    const despesas = await res.json();
    console.log("Dados recebidos do backend:", despesas);

    const minhas = despesas.filter(d => d.id_usuario === usuario.id);
    console.log("Despesas filtradas do usuário:", minhas);

    tabela.innerHTML = "";

    minhas.forEach(d => {
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
    console.error("Erro ao carregar despesas:", err);
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

  console.log("Solicitando exclusão da despesa:", id);

  try {
    const res = await fetch(`/api/despesas_fixas?id=${id}`, {
      method: "DELETE"
    });

    console.log("Resposta DELETE:", res.status);

    if (res.ok) {
      mostrarMensagem("Despesa excluída.");
      carregarDespesas();
    } else {
      mostrarMensagem("Erro ao excluir.");
    }
  } catch (err) {
    console.error("Erro de conexão ao excluir:", err);
    mostrarMensagem("Erro de conexão.");
  }
}
