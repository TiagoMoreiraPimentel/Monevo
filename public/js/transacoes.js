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
      data_transacao: document.getElementById("data").value + "T00:00:00",
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
        mostrarMensagem("Erro ao registrar transação.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro de conexão.");
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
    const [resTransacoes, resContas] = await Promise.all([
      fetch("/api/transacoes"),
      fetch("/api/contas")
    ]);

    const todasTransacoes = await resTransacoes.json();
    const todasContas = await resContas.json();
    const minhasTransacoes = todasTransacoes.filter(t => t.id_usuario === idUsuario);
    const contasMap = Object.fromEntries(todasContas.map(c => [c.id_conta, c.nome_conta]));

    minhasTransacoes.forEach(t => {
      const nomeConta = contasMap[t.id_conta] || "Conta desconhecida";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatarDataLocal(t.data_transacao)}</td>
        <td>${nomeConta}</td>
        <td>${t.tipo}</td>
        <td>R$ ${t.valor.toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td title="${t.descricao || ""}">
          ${(t.descricao || "").slice(0, 20)}${t.descricao && t.descricao.length > 20 ? "..." : ""}
        </td>
      `;
      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }

  function formatarDataLocal(dataStr) {
  const partes = dataStr.split("T")[0].split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

}
