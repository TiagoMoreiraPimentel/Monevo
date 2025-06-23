document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const selectTipo = document.getElementById("tipo");
  const tagContainer = document.getElementById("container-tag");
  const selectTag = document.getElementById("tag-distribuicao");

  document.getElementById("btn-voltar").addEventListener("click", () => {
    window.location.href = "/telas/dashboard.html";
  });

  document.getElementById("btn-toggle-form").addEventListener("click", () => {
    document.getElementById("form-transacao").classList.toggle("hidden");
  });

  document.getElementById("btn-toggle-filtros").addEventListener("click", () => {
    document.getElementById("filtros-container").classList.toggle("hidden");
  });

  document.getElementById("btn-aplicar-filtro").addEventListener("click", () => {
    carregarTransacoes(usuario.id);
  });

  carregarContas(usuario.id);
  carregarTransacoes(usuario.id);

  selectTipo.addEventListener("change", async () => {
    if (selectTipo.value === "Despesa") {
      tagContainer.classList.remove("hidden");
      await carregarTagsDistribuicao(usuario.id);
    } else {
      tagContainer.classList.add("hidden");
      selectTag.innerHTML = "<option value=''>Selecione uma tag</option>";
    }
  });

  document.getElementById("form-transacao").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idConta = parseInt(document.getElementById("conta").value);
    const tipo = selectTipo.value;
    const valor = parseFloat(document.getElementById("valor").value);
    const dataBruta = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;
    const descricao = document.getElementById("descricao").value.trim();
    const tag = selectTag.value;

    if (!idConta || !tipo || isNaN(valor) || !dataBruta || !categoria) {
      mostrarMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    if (tipo === "Despesa" && !tag) {
      mostrarMensagem("Selecione uma tag de distribuição.");
      return;
    }

    const dados = {
      id_usuario: usuario.id,
      id_conta: idConta,
      tipo,
      valor,
      data_transacao: new Date(dataBruta).toISOString(),
      categoria,
      descricao,
      tag_distribuicao: tipo === "Despesa" ? tag : null
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
        tagContainer.classList.add("hidden");
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
  const el = document.getElementById("mensagem");
  if (el) el.innerText = msg;
}

async function carregarTagsDistribuicao(idUsuario) {
  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${idUsuario}`);
    const tags = await res.json();

    const selectTag = document.getElementById("tag-distribuicao");
    selectTag.innerHTML = "<option value=''>Selecione uma tag</option>";
    tags.forEach(tag => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      selectTag.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar tags de distribuição:", err);
    mostrarMensagem("Erro ao carregar tags.");
  }
}

async function carregarContas(idUsuario) {
  const res = await fetch("/api/contas");
  const contas = await res.json();
  const minhas = contas.filter(c => c.id_usuario === idUsuario);
  const select = document.getElementById("conta");
  const filtroConta = document.getElementById("filtro-conta");
  select.innerHTML = "<option value=''>Selecione uma conta</option>";
  filtroConta.innerHTML = "<option value=''>Todas</option>";

  minhas.forEach(c => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");
    opt1.value = c.id_conta;
    opt2.value = c.id_conta;
    opt1.textContent = opt2.textContent = `${c.nome_conta} (${c.tipo})`;
    select.appendChild(opt1);
    filtroConta.appendChild(opt2);
  });
}

async function carregarTransacoes(idUsuario) {
  const tabela = document.getElementById("tabela-transacoes");
  const listaMobile = document.getElementById("lista-transacoes-mobile");
  tabela.innerHTML = "";
  listaMobile.innerHTML = "";

  const filtroData = document.getElementById("filtro-data").value;
  const filtroConta = document.getElementById("filtro-conta").value;
  const filtroTipo = document.getElementById("filtro-tipo").value;
  const filtroCategoria = document.getElementById("filtro-categoria").value;

  try {
    const res = await fetch("/api/transacoes");
    const todas = await res.json();
    let minhas = todas.filter(t => t.id_usuario === idUsuario);

    if (filtroData) minhas = minhas.filter(t => t.data_transacao.startsWith(filtroData));
    if (filtroConta) minhas = minhas.filter(t => t.id_conta == filtroConta);
    if (filtroTipo) minhas = minhas.filter(t => t.tipo === filtroTipo);
    if (filtroCategoria) minhas = minhas.filter(t => t.categoria === filtroCategoria);

    minhas.sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao));

    const resContas = await fetch("/api/contas");
    const contas = await resContas.json();
    const mapaContas = {};
    contas.filter(c => c.id_usuario === idUsuario).forEach(c => {
      mapaContas[c.id_conta] = c.nome_conta;
    });

    minhas.forEach(t => {
      const dataFormatada = t.data_transacao.slice(0, 10).split("-").reverse().join("/");
      const conta = mapaContas[t.id_conta] || "Conta desconhecida";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dataFormatada}</td>
        <td>${conta}</td>
        <td>${t.tipo}</td>
        <td>R$ ${Number(t.valor).toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td title="${t.descricao || ''}">
          ${t.descricao?.length > 30 ? t.descricao.slice(0, 30) + "..." : t.descricao || ""}
        </td>
        <td><button class="btn-excluir" onclick="excluirTransacao('${t.id_transacao}', ${idUsuario})">Excluir</button></td>
      `;
      tabela.appendChild(tr);

      const card = document.createElement("div");
      card.classList.add("card-transacao");
      card.innerHTML = `
        <p><strong>Data:</strong> ${dataFormatada}</p>
        <p><strong>Conta:</strong> ${conta}</p>
        <p><strong>Tipo:</strong> ${t.tipo}</p>
        <p><strong>Valor:</strong> R$ ${Number(t.valor).toFixed(2)}</p>
        <p><strong>Categoria:</strong> ${t.categoria}</p>
        <p><strong>Descrição:</strong><br>${t.descricao || ""}</p>
        <button class="btn-excluir" onclick="excluirTransacao('${t.id_transacao}', ${idUsuario})">Excluir</button>
      `;
      listaMobile.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar transações.");
  }
}

window.excluirTransacao = async function (id, idUsuario) {
  const confirmar = confirm("Deseja excluir esta transação?");
  if (!confirmar) return;

  try {
    const res = await fetch(`/api/transacoes?id=${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      mostrarMensagem("Transação excluída.");
      carregarTransacoes(idUsuario);
    } else {
      const erro = await res.text();
      console.error("Erro ao excluir:", erro);
      mostrarMensagem("Erro ao excluir transação.");
    }
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro de conexão.");
  }
};
