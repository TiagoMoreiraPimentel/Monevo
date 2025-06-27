document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDistribuicoes();

  const form = document.getElementById("form-distribuicao");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nomeCategoria = document.getElementById("nomeCategoria").value.trim();
      const porcentagem = parseFloat(document.getElementById("porcentagem").value);
      const diaRenovacao = parseInt(document.getElementById("diaRenovacao").value);

      if (!nomeCategoria || isNaN(porcentagem)) return;

      const distribuicoes = await buscarDistribuicoes(usuario.id);

      distribuicoes.push({
        nome_categoria: nomeCategoria,
        porcentagem,
        dia_renovacao: isNaN(diaRenovacao) ? null : diaRenovacao
      });

      salvarDistribuicoes(usuario.id, distribuicoes);
    });
  }

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) {
    salvarBtn.addEventListener("click", async () => {
      const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (!usuario) return;

      const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];

      const mapaUnico = new Map();

      linhas.forEach(tr => {
        const nome = tr.querySelector(".nome").innerText;
        const porcentagem = parseFloat(tr.querySelector(".porcentagem").value);
        const dia = parseInt(tr.querySelector(".renovacao").value) || null;

        if (!mapaUnico.has(nome)) {
          mapaUnico.set(nome, { nome_categoria: nome, porcentagem, dia_renovacao: dia });
        } else {
          const existente = mapaUnico.get(nome);
          if (!existente.dia_renovacao && dia) {
            existente.dia_renovacao = dia;
          }
        }
      });

      const configuracoes = Array.from(mapaUnico.values());

      salvarDistribuicoes(usuario.id, configuracoes);
    });
  }
});

async function buscarDistribuicoes(id_usuario) {
  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${id_usuario}`);
    const json = await res.json();
    return Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

async function salvarDistribuicoes(id_usuario, configuracoes) {
  try {
    const res = await fetch("/api/distribuicao_valor_config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario, configuracoes })
    });

    if (res.ok) {
      alert("Configurações salvas com sucesso!");
      carregarDistribuicoes();
    } else {
      const erro = await res.text();
      alert("Erro ao salvar: " + erro);
    }
  } catch {
    alert("Erro ao salvar configurações.");
  }
}

async function carregarDistribuicoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const distribuicoes = await buscarDistribuicoes(usuario.id);

  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  const cards = document.getElementById("cardsDistribuicao");
  if (!tabela || !cards) return;

  tabela.innerHTML = "";
  cards.innerHTML = "";

  distribuicoes.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="nome">${d.nome_categoria}</td>
      <td><input class="porcentagem" type="number" value="${d.porcentagem}" min="0" max="100" step="1" style="width: 60px">%</td>
      <td><input class="renovacao" type="number" value="${d.dia_renovacao || ""}" min="1" max="31" style="width: 50px"></td>
      <td><button onclick="removerTag('${d.nome_categoria}')">Remover</button></td>
    `;
    tabela.appendChild(tr);

    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <p><strong>Categoria:</strong> ${d.nome_categoria}</p>
      <p><strong>Porcentagem:</strong> ${d.porcentagem}%</p>
      <p><strong>Renovação:</strong> ${d.dia_renovacao || "-"}</p>
      <button onclick="removerTag('${d.nome_categoria}')">Remover</button>
    `;
    cards.appendChild(card);
  });

  atualizarSoma(distribuicoes);
}

function removerTag(nome) {
  const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
  const novas = linhas.filter(tr => tr.querySelector(".nome").innerText !== nome);

  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  tabela.innerHTML = "";
  novas.forEach(tr => tabela.appendChild(tr));

  const cards = [...document.querySelectorAll("#cardsDistribuicao .card")];
  const novosCards = cards.filter(c => !c.innerHTML.includes(nome));
  const container = document.getElementById("cardsDistribuicao");
  container.innerHTML = "";
  novosCards.forEach(c => container.appendChild(c));

  atualizarSoma();
}

function atualizarSoma(distribuicoes = null) {
  if (!distribuicoes) {
    const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
    distribuicoes = linhas.map(tr => ({
      porcentagem: parseFloat(tr.querySelector(".porcentagem").value)
    }));
  }

  const total = distribuicoes.reduce((acc, d) => acc + d.porcentagem, 0);
  document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) salvarBtn.disabled = total !== 100;
}
