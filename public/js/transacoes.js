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
      data_transacao: new Date(dataBruta).toISOString(),
      categoria,
      descricao
    };

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
  select.innerHTML = "<option value=''>Selecione uma conta</option>";

  minhas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id_conta;
    opt.textContent = `${c.nome_conta} (${c.tipo})`;
    select.appendChild(opt);
  });
}

async function carregarTransacoes(idUsuario) {
  const tabela = document.getElementById("tabela-transacoes");
  const listaMobile = document.getElementById("lista-transacoes-mobile");
  if (!tabela || !listaMobile) return;

  tabela.innerHTML = "";
  listaMobile.innerHTML = "";

  try {
    const res = await fetch("/api/transacoes");
    const todas = await res.json();
    const minhas = todas.filter(t => t.id_usuario === idUsuario);

    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const mapaContas = {};
    contas
      .filter(c => c.id_usuario === idUsuario)
      .forEach(c => {
        mapaContas[c.id_conta] = c.nome_conta;
      });

    minhas.forEach(t => {
      const dataFormatada = t.data_transacao.slice(0, 10).split("-").reverse().join("/");
      const nomeConta = mapaContas[t.id_conta] || "Conta desconhecida";
      const valorFormatado = "R$ " + Number(t.valor).toFixed(2);
      const descricaoCompleta = t.descricao || "";

      // Tabela (Desktop)
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dataFormatada}</td>
        <td>${nomeConta}</td>
        <td>${t.tipo}</td>
        <td>${valorFormatado}</td>
        <td>${t.categoria}</td>
        <td title="${descricaoCompleta}">
          ${descricaoCompleta.length > 30 ? descricaoCompleta.slice(0, 30) + "..." : descricaoCompleta}
        </td>
      `;
      tabela.appendChild(tr);

      // Card (Mobile)
      const card = document.createElement("div");
      card.className = "card-transacao";
      card.innerHTML = `
        <div class="linha"><strong>Data:</strong> ${dataFormatada}</div>
        <div class="linha"><strong>Conta:</strong> ${nomeConta}</div>
        <div class="linha"><strong>Tipo:</strong> ${t.tipo}</div>
        <div class="linha"><strong>Valor:</strong> ${valorFormatado}</div>
        <div class="linha"><strong>Categoria:</strong> ${t.categoria}</div>
        <div class="linha descricao-limitada"><strong>Descrição:</strong><br>${descricaoCompleta}</div>
      `;
      listaMobile.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}
