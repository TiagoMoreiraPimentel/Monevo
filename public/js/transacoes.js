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

  carregarContas(usuario.id);
  carregarTransacoes(usuario.id);

  document.getElementById("form-transacao").addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      id_usuario: usuario.id,
      id_conta: parseInt(document.getElementById("conta").value),
      tipo: document.getElementById("tipo").value,
      valor: parseFloat(document.getElementById("valor").value),
      data_transacao: document.getElementById("data").value, // corrigido!
      categoria: document.getElementById("categoria").value,
      descricao: document.getElementById("descricao").value.trim()
    };

    console.log("Dados que serão enviados:", dados);

    try {
      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      if (res.ok) {
        mostrarMensagem("Transação registrada.");
        e.target.reset();
        carregarTransacoes(usuario.id);
      } else {
        const erroTexto = await res.text(); // captura resposta do ORDS
        console.error("Erro ORDS:", erroTexto);
        mostrarMensagem("Erro ao registrar transação. Verifique os dados.");
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
      mostrarMensagem("Erro de conexão com servidor.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

async function carregarContas(idUsuario) {
  const res = await fetch("/api/contas");
  const contas = await res.json();
  const minhas = contas.filter(c => c.id_usuario === idUsuario);
  const select = document.getElementById("conta");
  select.innerHTML = "";

  minhas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id_conta;
    opt.textContent = `${c.nome_conta} (${c.tipo})`;
    select.appendChild(opt);
  });
}

async function carregarTransacoes(idUsuario) {
  const tabela = document.getElementById("tabela-transacoes");
  tabela.innerHTML = "";

  try {
    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const res = await fetch("/api/transacoes");
    const todas = await res.json();
    const minhas = todas.filter(t => t.id_usuario === idUsuario);

    minhas.forEach(t => {
      const conta = contas.find(c => c.id_conta === t.id_conta);
      const nomeConta = conta ? conta.nome_conta : "N/D";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(t.data_transacao).toLocaleDateString()}</td>
        <td>${nomeConta}</td>
        <td>${t.tipo}</td>
        <td>R$ ${t.valor.toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td>
          ${t.descricao ? `<details><summary>Ver</summary>${t.descricao}</details>` : "-"}
        </td>
      `;
      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}
