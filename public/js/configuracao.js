document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  console.log("Usuário logado:", usuario);

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

      if (!nomeCategoria || isNaN(porcentagem)) {
        mostrarMensagem("Preencha todos os campos corretamente.");
        return;
      }

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
      const linhas = [...document.querySelectorAll("#tabelaDistribuicao tbody tr")];
      const configuracoes = linhas.map(tr => {
        const tds = tr.querySelectorAll("td");
        return {
          nome_categoria: tds[0].innerText,
          porcentagem: parseFloat(tds[1].innerText.replace("%", "")),
          dia_renovacao: parseInt(tds[2].innerText) || null
        };
      });

      salvarDistribuicoes(usuario.id, configuracoes);
    });
  }
});

function mostrarMensagem(msg) {
  console.log("Mensagem:", msg);
  document.getElementById("mensagem")?.innerText = msg;
}

async function buscarDistribuicoes(id_usuario) {
  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${id_usuario}`);
    const json = await res.json();
    console.log("Distribuições recebidas do backend:", json);
    return json.items || [];
  } catch (err) {
    console.error("Erro ao buscar distribuições:", err);
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
  } catch (err) {
    console.error("Erro ao salvar configurações:", err);
    alert("Erro ao salvar configurações.");
  }
}

async function carregarDistribuicoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const distribuicoes = await buscarDistribuicoes(usuario.id);
  console.log("Distribuições a carregar na tela:", distribuicoes);

  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  const cards = document.getElementById("cardsDistribuicao");
  if (!tabela || !cards) return;

  tabela.innerHTML = "";
  cards.innerHTML = "";

  distribuicoes.forEach(d => {
    // Tabela (desktop)
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nome_categoria}</td>
      <td>${d.porcentagem}%</td>
      <td>${d.dia_renovacao || "-"}</td>
      <td><button onclick="removerTag('${d.nome_categoria}')">Remover</button></td>
    `;
    tabela.appendChild(tr);

    // Card (mobile)
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
  const novas = linhas.filter(tr => tr.cells[0].innerText !== nome);

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
      return {
        porcentagem: parseFloat(tr.cells[1].innerText.replace("%", ""))
      };
    });
  }

  const total = distribuicoes.reduce((acc, d) => acc + d.porcentagem, 0);
  console.log("Total atual:", total);
  document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;

  const salvarBtn = document.getElementById("salvarConfig");
  if (salvarBtn) {
    salvarBtn.disabled = total !== 100;
  }
}
