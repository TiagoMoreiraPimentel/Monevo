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
    const ciclo = parseInt(document.getElementById("ciclo").value);
    const descricao = document.getElementById("descricao").value.trim();
    const valorFormatado = document.getElementById("valor").value;
    const valor = parseFloat(valorFormatado.replace(/[^\d,-]/g, "").replace(",", "."));

    if (!categoria || isNaN(valor) || isNaN(ciclo)) {
      mostrarMensagem("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    const novaDespesa = {
      id_usuario: usuario.id,
      categoria,
      valor,
      descricao,
      ciclo
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
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categoria}</td>
        <td>R$ ${d.valor.toFixed(2).replace(".", ",")}</td>
        <td>${d.ciclo} dias</td>
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
