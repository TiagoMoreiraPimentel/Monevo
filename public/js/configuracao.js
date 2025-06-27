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

      const jaExiste = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")]
        .some(tr => tr.querySelector("td.nome")?.innerText === nomeCategoria);
      if (jaExiste) {
        alert("Essa categoria já existe.");
        return;
      }

      // Adiciona linha na tabela
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="nome">${nomeCategoria}</td>
        <td><input class="porcentagem" type="number" value="${porcentagem}" min="0" max="100" style="width: 60px">%</td>
        <td><input class="renovacao" type="number" value="${isNaN(diaRenovacao) ? "" : diaRenovacao}" min="1" max="31" style="width: 50px"></td>
        <td><button onclick="removerTag('${nomeCategoria}')">Remover</button></td>
      `;
      document.querySelector("#tabelaDistribuicao tbody").appendChild(tr);

      // Adiciona card no mobile
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <p><strong>Categoria:</strong> <span class="nome">${nomeCategoria}</span></p>
        <p><strong>Porcentagem:</strong> <input class="porcentagem" type="number" value="${porcentagem}" min="0" max="100" style="width: 60px">%</p>
        <p><strong>Renovação:</strong> <input class="renovacao" type="number" value="${isNaN(diaRenovacao) ? "" : diaRenovacao}" min="1" max="31" style="width: 50px"></p>
        <button onclick="removerTag('${nomeCategoria}')">Remover</button>
      `;
      document.getElementById("cardsDistribuicao").appendChild(card);

      atualizarSoma();
      form.reset();
    });
  }

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) {
    salvarBtn.addEventListener("click", async () => {
      const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (!usuario) return;

      const configuracoes = [];

      // Coletar da tabela (desktop)
      const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
      linhas.forEach(tr => {
        const nome = tr.querySelector("td.nome")?.innerText;
        const porcentagem = parseFloat(tr.querySelector("input.porcentagem")?.value);
        const renovacao = parseInt(tr.querySelector("input.renovacao")?.value) || null;

        if (nome && !isNaN(porcentagem)) {
          configuracoes.push({ nome_categoria: nome, porcentagem, dia_renovacao: renovacao });
        }
      });

      // Coletar dos cards (mobile)
      const cards = [...document.querySelectorAll("#cardsDistribuicao .card")];
      cards.forEach(card => {
        const nome = card.querySelector(".nome")?.innerText;
        const porcentagem = parseFloat(card.querySelector("input.porcentagem")?.value);
        const renovacao = parseInt(card.querySelector("input.renovacao")?.value) || null;

        // Evita duplicar TAGs já coletadas da tabela
        const jaAdicionada = configuracoes.some(c => c.nome_categoria === nome);
        if (nome && !isNaN(porcentagem) && !jaAdicionada) {
          configuracoes.push({ nome_categoria: nome, porcentagem, dia_renovacao: renovacao });
        }
      });

      console.log("🚀 Configurações enviadas para o banco:", configuracoes);
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
    const res = await fetch("/api/configuracao", {
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
      <td><input class="porcentagem" type="number" value="${d.porcentagem}" min="0" max="100" style="width: 60px">%</td>
      <td><input class="renovacao" type="number" value="${d.dia_renovacao || ""}" min="1" max="31" style="width: 50px"></td>
      <td><button onclick="removerTag('${d.nome_categoria}')">Remover</button></td>
    `;
    tabela.appendChild(tr);

    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <p><strong>Categoria:</strong> <span class="nome">${d.nome_categoria}</span></p>
      <p><strong>Porcentagem:</strong> <input class="porcentagem" type="number" value="${d.porcentagem}" min="0" max="100" style="width: 60px">%</p>
      <p><strong>Renovação:</strong> <input class="renovacao" type="number" value="${d.dia_renovacao || ""}" min="1" max="31" style="width: 50px"></p>
      <button onclick="removerTag('${d.nome_categoria}')">Remover</button>
    `;
    cards.appendChild(card);
  });

  atualizarSoma(distribuicoes);
}

function removerTag(nome) {
  const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
  const novas = linhas.filter(tr => tr.querySelector("td.nome").innerText !== nome);
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
    distribuicoes = linhas.map(tr => {
      const valor = parseFloat(tr.querySelector("input.porcentagem")?.value) || 0;
      return { porcentagem: valor };
    });
  }

  const total = distribuicoes.reduce((acc, d) => acc + d.porcentagem, 0);
  document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) salvarBtn.disabled = total !== 100;
}
