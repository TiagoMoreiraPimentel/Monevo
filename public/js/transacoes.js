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

  document.getElementById("btn-toggle-form").addEventListener("click", () => {
    document.getElementById("form-transacao").classList.toggle("hidden");
  });

  document.getElementById("btn-toggle-filtros").addEventListener("click", () => {
    document.getElementById("form-filtros").classList.toggle("hidden");
  });

  document.getElementById("btn-aplicar-filtros").addEventListener("click", () => {
    carregarTransacoes(usuario.id);
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
  const selectTransacao = document.getElementById("conta");
  const selectFiltro = document.getElementById("filtro-conta");

  selectTransacao.innerHTML = "<option value=''>Selecione uma conta</option>";
  selectFiltro.innerHTML = "<option value=''>Todas</option>";

  minhas.forEach(c => {
    const opt1 = document.createElement("option");
    opt1.value = c.id_conta;
    opt1.textContent = `${c.nome_conta} (${c.tipo})`;
    selectTransacao.appendChild(opt1);

    const opt2 = opt1.cloneNode(true);
    selectFiltro.appendChild(opt2);
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
    let minhas = todas.filter(t => t.id_usuario === idUsuario);

    // Filtros
    const dataFiltro = document.getElementById("filtro-data").value;
    const contaFiltro = document.getElementById("filtro-conta").value;
    const tipoFiltro = document.getElementById("filtro-tipo").value;
    const categoriaFiltro = document.getElementById("filtro-categoria").value.trim().toLowerCase();

    if (dataFiltro) {
      minhas = minhas.filter(t => t.data_transacao.startsWith(dataFiltro));
    }
    if (contaFiltro) {
      minhas = minhas.filter(t => t.id_conta == contaFiltro);
    }
    if (tipoFiltro) {
      minhas = minhas.filter(t => t.tipo === tipoFiltro);
    }
    if (categoriaFiltro) {
      minhas = minhas.filter(t => t.categoria.toLowerCase().includes(categoriaFiltro));
    }

    minhas.sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao));

    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const mapaContas = {};
    contas
      .filter(c => c.id_usuario === idUsuario)
      .forEach(c => {
        mapaContas[c.id_conta] = c.nome_conta;
      });

    // Tabela Desktop
    minhas.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.data_transacao.slice(0, 10).split("-").reverse().join("/")}</td>
        <td>${mapaContas[t.id_conta] || "Conta desconhecida"}</td>
        <td>${t.tipo}</td>
        <td>R$ ${Number(t.valor).toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td title="${t.descricao || ''}">
          ${t.descricao?.length > 30 ? t.descricao.slice(0, 30) + "..." : t.descricao || ""}
        </td>
      `;
      tabela.appendChild(tr);
    });

    // Cards Mobile
    minhas.forEach(t => {
      const card = document.createElement("div");
      card.classList.add("card-transacao");
      card.innerHTML = `
        <p><strong>Data:</strong> ${t.data_transacao.slice(0, 10).split("-").reverse().join("/")}</p>
        <p><strong>Conta:</strong> ${mapaContas[t.id_conta] || "Conta desconhecida"}</p>
        <p><strong>Tipo:</strong> ${t.tipo}</p>
        <p><strong>Valor:</strong> R$ ${Number(t.valor).toFixed(2)}</p>
        <p><strong>Categoria:</strong> ${t.categoria}</p>
        <p><strong>Descrição:</strong><br>${t.descricao || ""}</p>
      `;
      listaMobile.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}
