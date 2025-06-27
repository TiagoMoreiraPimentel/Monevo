document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDistribuicoes();

  document.getElementById("form-distribuicao").addEventListener("submit", async (e) => {
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

  document.getElementById("salvarConfig").addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) return;

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
});

async function buscarDistribuicoes(id_usuario) {
  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${id_usuario}`);
    const json = await res.json();
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

async function carregarDistribuicao() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  try {
    const res = await fetch(`/api/distribuicao_valor_config?id_usuario=${usuario.id}`);
    const dados = await res.json();

    console.log("Usuário:", usuario.id);
    console.log("Resposta da API:", dados);

    const tbody = document.querySelector("#tabelaDistribuicao tbody");
    tbody.innerHTML = "";

    dados.items.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.nome_categoria}</td>
        <td>${item.porcentagem}%</td>
        <td>${item.dia_renovacao || "-"}</td>
        <td><button>Remover</button></td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro ao carregar distribuição:", err);
  }
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
  document.getElementById("somaPorcentagem").innerText = `Total: ${total}%`;

  const salvarBtn = document.getElementById("salvarConfig");
  salvarBtn.disabled = total !== 100;
}
