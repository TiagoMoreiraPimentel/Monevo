document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarContas();

  const inputSaldo = document.getElementById("saldo");

  inputSaldo.value = (0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // Formatar valor enquanto digita
  inputSaldo.addEventListener("input", () => {
    let valor = inputSaldo.value.replace(/\D/g, "");
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    inputSaldo.value = parseFloat(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  });

  document.getElementById("form-conta").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const tipo = document.getElementById("tipo").value;
    const saldoFormatado = document.getElementById("saldo").value;
    const saldo = parseFloat(saldoFormatado.replace(/[^\d,-]/g, "").replace(",", "."));

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
        const contaCriada = await res.json();

        const transacaoInicial = {
          id_usuario: usuario.id,
          id_conta: contaCriada.id_conta,
          tipo: "Receita",
          valor: saldo,
          data_transacao: new Date().toISOString(),
          categoria: "Saldo Inicial",
          descricao: "Saldo inicial da conta"
        };

        await fetch("/api/transacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transacaoInicial)
        });

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
      // Corrigir o tipo para exibição correta
      const tipoFormatado =
        conta.tipo === "Corrente" ? "Conta Corrente" : conta.tipo;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Nome"><input type="text" value="${conta.nome_conta}" data-id="${conta.id_conta}" data-campo="nome_conta"></td>
        <td data-label="Tipo">
          <select data-id="${conta.id_conta}" data-campo="tipo">
            <option value="Carteira" ${tipoFormatado === "Carteira" ? "selected" : ""}>Carteira</option>
            <option value="Conta Corrente" ${tipoFormatado === "Conta Corrente" ? "selected" : ""}>Conta Corrente</option>
            <option value="Poupança" ${tipoFormatado === "Poupança" ? "selected" : ""}>Poupança</option>
          </select>
        </td>
        <td data-label="Saldo"><input type="number" value="${conta.saldo_inicial}" data-id="${conta.id_conta}" data-campo="saldo_inicial"></td>
        <td data-label="Ações">
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

window.excluirConta = async function (id) {
  const confirmacao = confirm("Deseja excluir esta conta? Todas as transações devem ser removidas antes.");
  if (!confirmacao) return;

  const transacoes = await fetch("/api/transacoes").then(r => r.json());
  const vinculadas = transacoes.some(t => t.id_conta == id);

  if (vinculadas) {
    mostrarMensagem("Erro ao excluir. Existem transações vinculadas a esta conta.");
    return;
  }

  try {
    const res = await fetch(`/api/contas?id=${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      mostrarMensagem("Conta excluída.");
      carregarContas();
    } else {
      const erro = await res.text();
      console.error("Erro ao excluir conta:", erro);
      mostrarMensagem("Erro ao excluir conta.");
    }
  } catch (err) {
    console.error("Erro de conexão:", err);
    mostrarMensagem("Erro de conexão ao excluir conta.");
  }
};
