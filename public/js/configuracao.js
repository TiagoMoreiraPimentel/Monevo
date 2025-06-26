document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const BASE_URL = "/api/configuracao";
  const form = document.getElementById("form-distribuicao");
  const nomeInput = document.getElementById("nomeCategoria");
  const porcentagemInput = document.getElementById("porcentagem");
  const diaRenovacaoInput = document.getElementById("diaRenovacao");
  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  const cardsContainer = document.getElementById("cardsDistribuicao");
  const somaDisplay = document.getElementById("somaPorcentagem");
  const salvarBtn = document.getElementById("salvarConfig");

  let configuracoes = [];

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const porcentagem = parseFloat(porcentagemInput.value);
    const diaRenovacao = parseInt(diaRenovacaoInput.value);

    if (!nome || isNaN(porcentagem) || porcentagem <= 0 || (diaRenovacao && (diaRenovacao < 1 || diaRenovacao > 31))) {
      alert("Preencha os campos corretamente.");
      return;
    }

    configuracoes.push({ nome_categoria: nome, porcentagem, dia_renovacao: diaRenovacao || null });

    nomeInput.value = "";
    porcentagemInput.value = "";
    diaRenovacaoInput.value = "";
    atualizarTabela();
  });

  function atualizarTabela() {
    const isMobile = window.innerWidth <= 768;

    tabela.innerHTML = "";
    cardsContainer.innerHTML = "";

    let soma = 0;

    if (isMobile) {
      cardsContainer.style.display = "grid";
      document.getElementById("tabelaDistribuicao").style.display = "none";

      configuracoes.forEach((item, index) => {
        const valor = parseFloat(item.porcentagem) || 0;
        soma += valor;

        const card = document.createElement("div");
        card.className = "tag-card";
        card.innerHTML = `
          <strong>${item.nome_categoria}</strong>
          <div>
            <label>Porcentagem:</label>
            <input type="number" min="0" max="100" step="0.01" value="${valor}" 
              onchange="atualizarPorcentagem(${index}, this.value)" />
          </div>
          <div>
            <label>Dia Renovação:</label>
            <input type="number" min="1" max="31" value="${item.dia_renovacao || ''}" 
              onchange="atualizarRenovacao(${index}, this.value)" />
          </div>
          <button onclick="removerCategoria(${index})">Remover</button>
        `;
        cardsContainer.appendChild(card);
      });

    } else {
      cardsContainer.style.display = "none";
      document.getElementById("tabelaDistribuicao").style.display = "table";

      configuracoes.forEach((item, index) => {
        const valor = parseFloat(item.porcentagem) || 0;
        soma += valor;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.nome_categoria}</td>
          <td>
            <input type="number" min="0" max="100" step="0.01" value="${valor}" 
              onchange="atualizarPorcentagem(${index}, this.value)" />
          </td>
          <td>
            <input type="number" min="1" max="31" value="${item.dia_renovacao || ''}" 
              onchange="atualizarRenovacao(${index}, this.value)" />
          </td>
          <td><button onclick="removerCategoria(${index})">Remover</button></td>
        `;
        tabela.appendChild(tr);
      });
    }

    somaDisplay.textContent = `Total: ${soma.toFixed(2)}%`;
    salvarBtn.disabled = soma.toFixed(2) != 100.00;
  }

  window.removerCategoria = async (index) => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const nomeTag = configuracoes[index].nome_categoria;

    try {
      const res = await fetch(`/api/verificar_tag_valor?id_usuario=${usuario.id}&tag=${encodeURIComponent(nomeTag)}`);
      const { podeRemover } = await res.json();

      if (!podeRemover) {
        alert("Não é possível remover esta TAG. Existem valores distribuídos vinculados a ela.");
        return;
      }

      configuracoes.splice(index, 1);
      atualizarTabela();

    } catch (err) {
      console.error("Erro ao verificar remoção da TAG:", err);
      alert("Erro ao validar remoção da TAG.");
    }
  };

  window.atualizarPorcentagem = (index, novoValor) => {
    const valor = parseFloat(novoValor);
    if (isNaN(valor) || valor < 0 || valor > 100) {
      alert("Porcentagem inválida.");
      return;
    }
    configuracoes[index].porcentagem = valor;
    atualizarTabela();
  };

  window.atualizarRenovacao = (index, novoValor) => {
    const valor = parseInt(novoValor);
    if (isNaN(valor) || valor < 1 || valor > 31) {
      alert("Dia de renovação inválido.");
      return;
    }
    configuracoes[index].dia_renovacao = valor;
    atualizarTabela();
  };

  salvarBtn.addEventListener("click", async () => {
    const total = configuracoes.reduce((soma, item) => soma + parseFloat(item.porcentagem || 0), 0);
    if (total.toFixed(2) != 100.00) {
      alert(`A soma das porcentagens precisa ser exatamente 100%. Soma atual: ${total.toFixed(2)}%.`);
      return;
    }

    try {
      const body = {
        id_usuario: usuario.id,
        configuracoes
      };

      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      alert("Configuração salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
      alert("Erro ao salvar. Verifique a conexão.");
    }
  });

  async function carregarConfiguracoesExistentes() {
    try {
      const r = await fetch(`${BASE_URL}?id_usuario=${usuario.id}`);
      const json = await r.json();

      configuracoes = (json.items || []).map(item => ({
        nome_categoria: item.nome_categoria,
        porcentagem: parseFloat(item.porcentagem),
        dia_renovacao: item.dia_renovacao
      }));


      atualizarTabela();
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    }
  }

  carregarConfiguracoesExistentes();
});
