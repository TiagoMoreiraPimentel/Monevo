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
      const data = t.data_transacao.slice(0, 10).split("-").reverse().join("/");
      const conta = mapaContas[t.id_conta] || "Conta desconhecida";
      const tipo = t.tipo;
      const valor = `R$ ${Number(t.valor).toFixed(2)}`;
      const categoria = t.categoria;
      const descricao = t.descricao || "";

      // Desktop
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data}</td>
        <td>${conta}</td>
        <td>${tipo}</td>
        <td>${valor}</td>
        <td>${categoria}</td>
        <td title="${descricao}">${descricao.length > 30 ? descricao.slice(0, 30) + "..." : descricao}</td>
      `;
      tabela.appendChild(tr);

      // Mobile
      const card = document.createElement("div");
      card.className = "transacao-card";
      card.innerHTML = `
        <p><strong>Data:</strong> ${data}</p>
        <p><strong>Conta:</strong> ${conta}</p>
        <p><strong>Tipo:</strong> ${tipo}</p>
        <p><strong>Valor:</strong> ${valor}</p>
        <p><strong>Categoria:</strong> ${categoria}</p>
        <p><strong>Descrição:</strong> <span class="descricao-curta" title="${descricao}">${descricao.length > 30 ? descricao.slice(0, 30) + "..." : descricao}</span></p>
      `;
      listaMobile.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}
