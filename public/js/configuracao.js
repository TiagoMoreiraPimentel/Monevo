document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDistribuicoes();

  document.getElementById("btnAdicionar").addEventListener("click", (e) => {
    e.preventDefault();
    adicionarTag();
  });

  document.getElementById("salvarConfig").addEventListener("click", () => {
    salvarConfiguracoes();
  });
});

async function carregarDistribuicoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${usuario.id}`);
    const json = await res.json();
    const distribuicoes = Array.isArray(json) ? json : json.items || [];

    renderizarTabela(distribuicoes);
    renderizarCards(distribuicoes);
    atualizarSoma(distribuicoes);
  } catch (error) {
    console.error("Erro ao carregar distribuições:", error);
  }
}

function adicionarTag() {
  const nome = document.getElementById("nomeCategoria").value.trim();
  const porcentagem = parseFloat(document.getElementById("porcentagem").value);
  const dia = parseInt(document.getElementById("diaRenovacao").value);

  if (!nome || isNaN(porcentagem)) {
    alert("Preencha corretamente os campos.");
    return;
  }

  const jaExiste = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")]
    .some(tr => tr.querySelector("td.nome")?.innerText === nome);
  if (jaExiste) {
    alert("Essa TAG já existe.");
    return;
  }

  const nova = { nome_categoria: nome, porcentagem, dia_renovacao: isNaN(dia) ? null : dia };

  adicionarLinhaTabela(nova);
  adicionarCard(nova);

  atualizarSoma();
  document.getElementById("form-distribuicao").reset();
}

function adicionarLinhaTabela({ nome_categoria, porcentagem, dia_renovacao }) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="nome">${nome_categoria}</td>
    <td><input class="porcentagem" type="number" value="${porcentagem}" min="0" max="100"></td>
    <td><input class="renovacao" type="number" value="${dia_renovacao || ""}" min="1" max="31"></td>
    <td><button class="btn btn-danger btn-sm" onclick="removerTag('${nome_categoria}')">🗑️</button></td>
  `;
  document.querySelector("#tabelaDistribuicao tbody").appendChild(tr);
}

function adicionarCard({ nome_categoria, porcentagem, dia_renovacao }) {
  const card = document.createElement("div");
  card.classList.add("transaction-card");

  card.innerHTML = `
    <div class="transaction-header">
      <div>
        <div class="transaction-amount" style="font-size: 1rem; font-weight: 600; color: var(--cor-texto);">
          Categoria: <span class="nome" style="font-weight: normal;">${nome_categoria}</span>
        </div>
        <div class="transaction-date">Renovação: ${dia_renovacao ? "Dia " + dia_renovacao : "-"}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removerTag('${nome_categoria}')">🗑️</button>
    </div>

    <div class="transaction-details">
      <div class="transaction-detail">
        <span class="detail-label">Porcentagem:</span>
        <input class="porcentagem" type="number" value="${porcentagem}" min="0" max="100" style="width: 80px; padding: 4px; border-radius: 6px; border: 1px solid #ccc; text-align: center;" />
      </div>
    </div>
  `;

  document.getElementById("cardsDistribuicao").appendChild(card);
}

function removerTag(nome) {
  const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
  const novas = linhas.filter(tr => tr.querySelector("td.nome")?.innerText !== nome);
  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  tabela.innerHTML = "";
  novas.forEach(tr => tabela.appendChild(tr));

  const cards = [...document.querySelectorAll("#cardsDistribuicao .card")];
  const novos = cards.filter(card => !card.innerHTML.includes(nome));
  const container = document.getElementById("cardsDistribuicao");
  container.innerHTML = "";
  novos.forEach(c => container.appendChild(c));

  atualizarSoma();
}

function renderizarTabela(distribuicoes) {
  const tbody = document.querySelector("#tabelaDistribuicao tbody");
  tbody.innerHTML = "";
  distribuicoes.forEach(adicionarLinhaTabela);
}

function renderizarCards(distribuicoes) {
  const container = document.getElementById("cardsDistribuicao");
  container.innerHTML = "";
  distribuicoes.forEach(adicionarCard);
}

function atualizarSoma(distribuicoes = null) {
  if (!distribuicoes) {
    const porcentagens = [...document.querySelectorAll("input.porcentagem")];
    distribuicoes = porcentagens.map(p => ({ porcentagem: parseFloat(p.value) || 0 }));
  }
  const total = distribuicoes.reduce((acc, d) => acc + d.porcentagem, 0);
  document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;
  document.getElementById("salvarConfig").disabled = total !== 100;
}

function coletarConfiguracoes() {
  const configuracoes = [];
  const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
  linhas.forEach(tr => {
    const nome = tr.querySelector("td.nome")?.innerText;
    const porcentagem = parseFloat(tr.querySelector("input.porcentagem")?.value);
    const renovacao = parseInt(tr.querySelector("input.renovacao")?.value) || null;
    if (nome && !isNaN(porcentagem)) {
      configuracoes.push({ nome_categoria: nome, porcentagem, dia_renovacao: renovacao });
    }
  });

  const cards = [...document.querySelectorAll("#cardsDistribuicao .card")];
  cards.forEach(card => {
    const nome = card.querySelector(".nome")?.innerText;
    const porcentagem = parseFloat(card.querySelector("input.porcentagem")?.value);
    const renovacao = parseInt(card.querySelector("input.renovacao")?.value) || null;
    if (nome && !isNaN(porcentagem) && !configuracoes.some(c => c.nome_categoria === nome)) {
      configuracoes.push({ nome_categoria: nome, porcentagem, dia_renovacao: renovacao });
    }
  });

  return configuracoes;
}

async function salvarConfiguracoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const configuracoes = coletarConfiguracoes();

  try {
    const res = await fetch("/api/configuracao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario: usuario.id, configuracoes })
    });

    if (res.ok) {
      alert("Configurações salvas com sucesso!");
      carregarDistribuicoes();
    } else {
      const erro = await res.text();
      alert("Erro ao salvar: " + erro);
    }
  } catch (err) {
    alert("Erro ao salvar configurações.");
    console.error(err);
  }
}
