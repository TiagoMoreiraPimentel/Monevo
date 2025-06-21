document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  document.getElementById("btn-voltar").addEventListener("click", () => {
    window.location.href = "/telas/dashboard.html";
  });

  carregarContas();
  carregarTransacoes();

  document.getElementById("form-transacao").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id_conta = document.getElementById("conta").value;
    const tipo = document.getElementById("tipo").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value.trim();

    if (!id_conta || !tipo || isNaN(valor) || !data || !categoria) {
      mostrarMensagem("Preencha todos os campos corretamente.");
      return;
    }

    const transacao = {
      id_usuario: usuario.id,
      id_conta,
      tipo,
      valor,
      data_transacao: data,
      categoria
    };

    try {
      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transacao)
      });

      if (res.ok) {
        mostrarMensagem("Transação cadastrada com sucesso.");
        e.target.reset();
        carregarTransacoes();
      } else {
        mostrarMensagem("Erro ao cadastrar transação.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro na conexão com o servidor.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

async function carregarContas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const select = document.getElementById("conta");
  const res = await fetch("/api/contas");
  const contas = await res.json();
  const minhas = contas.filter(c => c.id_usuario == usuario.id);

  minhas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id_conta;
    opt.textContent = `${c.nome_conta} (${c.tipo})`;
    select.appendChild(opt);
  });
}

async function carregarTransacoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const res = await fetch("/api/transacoes");
  const transacoes = await res.json();
  const minhas = transacoes.filter(t => t.id_usuario == usuario.id);

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
    `;
    tabela.appendChild(tr);
  });
}
