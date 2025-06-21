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

    const idConta = parseInt(document.getElementById("conta").value);
    const tipo = document.getElementById("tipo").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const dataBruta = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;
    const descricao = document.getElementById("descricao").value.trim();

    if (!idConta || !tipo || isNaN(valor) || !dataBruta || !categoria) {
      mostrarMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    const dados = {
      id_usuario: usuario.id,
      id_conta: idConta,
      tipo,
      valor,
      data_transacao: new Date(dataBruta).toISOString(),  // formato ISO compatível
      categoria,
      descricao
    };

    console.log("Enviando:", dados); // debug

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
        const erro = await res.text();
        console.error("Erro ORDS:", erro);
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
  select.innerHTML = "<option value=''>Selecione uma conta</option>"; // previne erros

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
    // Busca todas as transações
    const res = await fetch("/api/transacoes");
    const todas = await res.json();
    const minhas = todas.filter(t => t.id_usuario === idUsuario);

    // Busca todas as contas do usuário para mapear nome por ID
    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const mapaContas = {};
    contas
      .filter(c => c.id_usuario === idUsuario)
      .forEach(c => {
        mapaContas[c.id_conta] = c.nome_conta;
      });

    minhas.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(t.data_transacao).toLocaleDateString()}</td>
        <td>${mapaContas[t.id_conta] || "Conta desconhecida"}</td>
        <td>${t.tipo}</td>
        <td>R$ ${Number(t.valor).toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td>${t.descricao || ""}</td>
      `;
      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}
