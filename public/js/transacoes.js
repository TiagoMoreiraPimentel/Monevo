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
    const minhas = todas
      .filter(t => t.id_usuario === idUsuario)
      .sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao));

    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const mapaContas = {};
    contas.filter(c => c.id_usuario === idUsuario).forEach(c => {
      mapaContas[c.id_conta] = c.nome_conta;
    });

    minhas.forEach(t => {
      const nomeConta = mapaContas[t.id_conta] || "Conta desconhecida";
      const data = t.data_transacao.slice(0, 10).split("-").reverse().join("/");
      const valor = `R$ ${Number(t.valor).toFixed(2)}`;

      // Tabela desktop
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data}</td>
        <td>${nomeConta}</td>
        <td>${t.tipo}</td>
        <td>${valor}</td>
        <td>${t.categoria}</td>
        <td title="${t.descricao || ""}">
          ${t.descricao?.length > 30 ? t.descricao.slice(0, 30) + "..." : t.descricao || ""}
        </td>
      `;
      tabela.appendChild(tr);

      // Card mobile
      const card = document.createElement("div");
      card.className = "card-transacao";
      card.innerHTML = `
        <p><strong>Data:</strong> ${data}</p>
        <p><strong>Conta:</strong> ${nomeConta}</p>
        <p><strong>Tipo:</strong> ${t.tipo}</p>
        <p><strong>Valor:</strong> ${valor}</p>
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
