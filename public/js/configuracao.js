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

  const BASE_URL = "/api/configuracao";
  const form = document.getElementById("form-distribuicao");
  const nomeInput = document.getElementById("nomeCategoria");
  const porcentagemInput = document.getElementById("porcentagem");
  const tabela = document.querySelector("#tabelaDistribuicao tbody");
  const somaDisplay = document.getElementById("somaPorcentagem");
  const salvarBtn = document.getElementById("salvarConfig");

  let configuracoes = [];

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const porcentagem = parseFloat(porcentagemInput.value);

    if (!nome || isNaN(porcentagem) || porcentagem <= 0) {
      alert("Preencha os campos corretamente.");
      return;
    }

    configuracoes.push({ nome_categoria: nome, porcentagem });
    nomeInput.value = "";
    porcentagemInput.value = "";
    atualizarTabela();
  });

  function atualizarTabela() {
    tabela.innerHTML = "";
    let soma = 0;

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
        <td><button onclick="removerCategoria(${index})">Remover</button></td>
      `;
      tabela.appendChild(tr);
    });

    somaDisplay.textContent = `Total: ${soma.toFixed(2)}%`;
    salvarBtn.disabled = soma.toFixed(2) != 100.00;
  }

  window.removerCategoria = (index) => {
    configuracoes.splice(index, 1);
    atualizarTabela();
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

  salvarBtn.addEventListener("click", async () => {
    const total = configuracoes.reduce((soma, item) => soma + parseFloat(item.porcentagem || 0), 0);
    if (total.toFixed(2) != 100.00) {
      alert(`A soma das porcentagens precisa ser exatamente 100%. Soma atual: ${total.toFixed(2)}%.`);
      return;
    }

    try {
      // Deleta as configurações anteriores do usuário
      const existentes = await fetch(`${BASE_URL}?id_usuario=${usuario.id}`);
      const data = await existentes.json();

      for (const item of data || []) {
        await fetch(`${BASE_URL}?id=${item.id_distribuicao}`, { method: "DELETE" });
      }

      // Salva as novas configurações
      for (const config of configuracoes) {
        await fetch(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_usuario: usuario.id,
            nome_categoria: config.nome_categoria,
            porcentagem: config.porcentagem
          })
        });
      }

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

      configuracoes = (json || []).map(item => ({
        nome_categoria: item.nome_categoria,
        porcentagem: parseFloat(item.porcentagem)
      }));

      atualizarTabela();
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    }
  }

  carregarConfiguracoesExistentes();
});
