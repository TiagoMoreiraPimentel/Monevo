document.addEventListener("DOMContentLoaded", async () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado.");
    window.location.href = "../telas/login.html";
    return;
  }

  document.getElementById("btn-voltar").addEventListener("click", () => {
    window.location.href = "/telas/dashboard.html";
  });

  await carregarContas(usuario.id);
  await carregarTransacoes(usuario.id);

  document.getElementById("form-transacao").addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaTransacao = {
      id_usuario: parseInt(usuario.id),
      id_conta: parseInt(idConta),
      tipo: tipoSelecionado,
      valor: parseFloat(valor),
      data_transacao: dataSelecionada,
      categoria: categoriaSelecionada,
      descricao: descricao || null
    };

    try {
      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTransacao)
      });

      if (res.ok) {
        mostrarMensagem("Transação adicionada.");
        e.target.reset();
        await carregarTransacoes(usuario.id);
      } else {
        mostrarMensagem("Erro ao salvar transação.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro na conexão.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

async function carregarContas(idUsuario) {
  const res = await fetch("/api/contas");
  const contas = await res.json();
  const minhas = contas.filter(c => c.id_usuario == idUsuario);
  const select = document.getElementById("conta");
  minhas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id_conta;
    opt.textContent = `${c.nome_conta} (${c.tipo})`;
    select.appendChild(opt);
  });
}

async function carregarTransacoes(idUsuario) {
  const res = await fetch("/api/transacoes");
  const lista = await res.json();
  const minhas = lista.filter(t => t.id_usuario == idUsuario);
  const tabela = document.getElementById("tabela-transacoes");
  tabela.innerHTML = "";
  minhas.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.id_conta}</td>
      <td>${t.tipo}</td>
      <td>R$ ${parseFloat(t.valor).toFixed(2)}</td>
      <td>${new Date(t.data_transacao).toLocaleDateString()}</td>
      <td>${t.categoria}</td>
      <td>${t.descricao || ""}</td>
    `;
    tabela.appendChild(tr);
  });
}
