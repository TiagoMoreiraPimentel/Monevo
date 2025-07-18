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

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="nome">${nomeCategoria}</td>
        <td><input class="porcentagem form-control" type="number" value="${porcentagem}" min="0" max="100" style="width: 80px"></td>
        <td><input class="renovacao form-control" type="number" value="${isNaN(diaRenovacao) ? "" : diaRenovacao}" min="1" max="31" style="width: 80px"></td>
        <td><button class="btn btn-danger" onclick="removerTag('${nomeCategoria}')">Remover</button></td>
      `;
      document.querySelector("#tabelaDistribuicao tbody").appendChild(tr);

      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <p><strong>Categoria:</strong> <span class="nome">${nomeCategoria}</span></p>
        <p><strong>Porcentagem:</strong> <input class="porcentagem form-control" type="number" value="${porcentagem}" min="0" max="100" style="width: 80px"></p>
        <p><strong>Renovação:</strong> <input class="renovacao form-control" type="number" value="${isNaN(diaRenovacao) ? "" : diaRenovacao}" min="1" max="31" style="width: 80px"></p>
        <button class="btn btn-danger" onclick="removerTag('${nomeCategoria}')">Remover</button>
      `;
      document.getElementById("cardsDistribuicao").appendChild(card);

      atualizarSoma();
      ativarListenersPorcentagem(); // Ativa escuta nos novos inputs
      form.reset();
    });
  }

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) {
    salvarBtn.addEventListener("click", async () => {
      const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (!usuario) return;

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
      carregarDistribuicoes(); // Após salvar, recarrega
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
      <td><input class="porcentagem form-control" type="number" value="${d.porcentagem}" min="0" max="100" style="width: 80px"></td>
      <td><input class="renovacao form-control" type="number" value="${d.dia_renovacao || ""}" min="1" max="31" style="width: 80px"></td>
      <td><button class="btn btn-danger" onclick="removerTag('${d.nome_categoria}')">🗑️</button></td>
    `;
    tabela.appendChild(tr);

    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <p><strong>Categoria:</strong> <span class="nome">${d.nome_categoria}</span></p>
      <p><strong>Porcentagem:</strong> <input class="porcentagem form-control" type="number" value="${d.porcentagem}" min="0" max="100" style="width: 80px"></p>
      <p><strong>Renovação:</strong> <input class="renovacao form-control" type="number" value="${d.dia_renovacao || ""}" min="1" max="31" style="width: 80px"></p>
      <button class="btn btn-danger" onclick="removerTag('${d.nome_categoria}')">🗑️ Excluir</button>
    `;
    cards.appendChild(card);
  });

  atualizarSoma(distribuicoes);
  ativarListenersPorcentagem(); // Escuta após preenchimento
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
  ativarListenersPorcentagem(); // Reaplica escuta após remoção
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
  const aviso = document.getElementById("somaPorcentagem");
  const salvarBtn = document.getElementById("salvarConfig");

  if (aviso) {
    if (total === 100) {
      aviso.innerText = "Total: 100% ✅";
      aviso.classList.remove("message-error");
      aviso.classList.add("message-success");
      if (salvarBtn) salvarBtn.disabled = false;
    } else {
      aviso.innerText = `Total: ${total}% ❌ A soma deve ser exatamente 100% para salvar.`;
      aviso.classList.remove("message-success");
      aviso.classList.add("message-error");
      if (salvarBtn) salvarBtn.disabled = true;
    }
  } else {
    // Apenas atualiza valor textual se aviso não estiver presente
    document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;
  }
}

function ativarListenersPorcentagem() {
  const tabelaInputs = document.querySelectorAll("#tabelaDistribuicao input.porcentagem");
  const cardInputs = document.querySelectorAll("#cardsDistribuicao input.porcentagem");
  const aviso = document.getElementById("somaPorcentagem");

  tabelaInputs.forEach(input => {
    input.removeEventListener("input", atualizarSoma);
    input.addEventListener("input", () => atualizarSoma());
  });

  cardInputs.forEach(cardInput => {
    cardInput.removeEventListener("input", atualizarSoma);
    cardInput.addEventListener("input", () => {
      const nome = cardInput.closest(".card").querySelector(".nome")?.innerText;
      const valor = parseFloat(cardInput.value) || 0;

      // Sincroniza com a tabela oculta
      const tabelaInput = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")]
        .find(tr => tr.querySelector("td.nome")?.innerText === nome)
        ?.querySelector("input.porcentagem");

      if (tabelaInput) tabelaInput.value = valor;

      atualizarSoma();
    });
  });
}




