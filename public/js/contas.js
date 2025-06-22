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

  carregarContas();

  document.getElementById("form-conta").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const tipo = document.getElementById("tipo").value;
    const saldo = parseFloat(document.getElementById("saldo").value);

    if (!nome || isNaN(saldo)) {
      mostrarMensagem("Preencha todos os campos corretamente.");
      return;
    }

    const todasContas = await fetch("/api/contas").then(r => r.json());
    const minhasContas = todasContas.filter(c => c.id_usuario === usuario.id);
    const contaJaExiste = minhasContas.some(c =>
      c.nome_conta.toLowerCase() === nome.toLowerCase() &&
      c.tipo.toLowerCase() === tipo.toLowerCase()
    );

    if (contaJaExiste) {
      mostrarMensagem("Você já cadastrou uma conta com esse nome e tipo.");
      return;
    }

    const novaConta = {
      id_usuario: usuario.id,
      nome_conta: nome,
      tipo,
      saldo_inicial: saldo,
      data_criacao: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaConta)
      });

      if (res.ok) {
        // Busca a conta recém criada
        const contasAtualizadas = await fetch("/api/contas").then(r => r.json());
        const nova = contasAtualizadas.find(c => c.id_usuario === usuario.id && c.nome_conta === nome && c.tipo === tipo);

        // Cria transação com o saldo inicial
        if (nova && saldo > 0) {
          const transacaoInicial = {
            id_usuario: usuario.id,
            id_conta: nova.id_conta,
            tipo: "Receita",
            valor: saldo,
            data: new Date().toISOString().split("T")[0],
            categoria: "Saldo Inicial",
            descricao: "Crédito inicial da conta"
          };

          await fetch("/api/transacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transacaoInicial)
          });
        }

        mostrarMensagem("Conta cadastrada com sucesso.");
        e.target.reset();
        carregarContas();
      } else {
        mostrarMensagem("Erro ao cadastrar conta.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro na conexão com o servidor.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

async function carregarContas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const tabela = document.getElementById("tabela-contas");

  try {
    const res = await fetch("/api/contas");
    const contas = await res.json();
    const minhasContas = contas.filter(c => c.id_usuario === usuario.id);

    tabela.innerHTML = "";
    minhasContas.forEach(conta => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td data-label="Nome"><input type="text" value="${conta.nome_conta}" data-id="${conta.id_conta}" data-campo="nome_conta"></td>
        <td data-label="Tipo">
          <select data-id="${conta.id_conta}" data-campo="tipo">
            <option value="Carteira" ${conta.tipo === "Carteira" ? "selected" : ""}>Carteira</option>
            <option value="Conta Corrente" ${conta.tipo === "Conta Corrente" ? "selected" : ""}>Conta Corrente</option>
          </select>
        </td>
        <td data-label="Saldo"><input type="number" value="${conta.saldo_inicial}" data-id="${conta.id_conta}" data-campo="saldo_inicial"></td>
        <td data-label="Ações">
          <button onclick="salvarConta('${conta.id_conta}')">Salvar</button>
          <button onclick="excluirConta('${conta.id_conta}')">Excluir</button>
        </td>
      `;

      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar contas.");
  }
}

window.salvarConta = async function (id) {
  const nome = document.querySelector(`input[data-id='${id}'][data-campo='nome_conta']`).value;
  const tipo = document.querySelector(`select[data-id='${id}'][data-campo='tipo']`).value;
  const saldo = parseFloat(document.querySelector(`input[data-id='${id}'][data-campo='saldo_inicial']`).value);

  const atualizada = {
    nome_conta: nome,
    tipo,
    saldo_inicial: saldo,
    data_criacao: new Date().toISOString()
  };

  const res = await fetch(`/api/contas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(atualizada)
  });

  if (res.ok) {
    mostrarMensagem("Conta atualizada.");
    carregarContas();
  } else {
    mostrarMensagem("Erro ao atualizar.");
  }
};

window.excluirConta = async function (id) {
  const confirmacao = confirm("Deseja excluir esta conta? Todas as transações devem ser removidas antes.");
  if (!confirmacao) return;

  const res = await fetch(`/api/contas/${id}`, {
    method: "DELETE"
  });

  if (res.ok) {
    mostrarMensagem("Conta excluída.");
    carregarContas();
  } else {
    mostrarMensagem("Erro ao excluir. Verifique se existem transações vinculadas.");
  }
};
