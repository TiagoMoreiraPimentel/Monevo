document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarContas();

  const form = document.getElementById("form-transacao");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idConta = document.getElementById("conta").value;
    const tipo = document.getElementById("tipo").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;
    const descricao = document.getElementById("descricao").value.trim();

    if (!idConta || !tipo || isNaN(valor) || !data || !categoria) {
      mostrarMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    const dados = {
      id_usuario: parseInt(usuario.id),
      id_conta: parseInt(idConta),
      tipo,
      valor,
      data_transacao: new Date(data).toISOString(),
      categoria,
      descricao: descricao || null
    };

    console.log("Dados enviados:", dados);

    try {
      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      if (res.ok) {
        mostrarMensagem("Transação cadastrada com sucesso.");
        form.reset();
      } else {
        const erro = await res.text();
        console.error("Erro ORDS:", erro);
        mostrarMensagem("Erro ao salvar transação.");
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
      mostrarMensagem("Erro de rede.");
    }
  });
});

function mostrarMensagem(msg) {
  document.getElementById("mensagem").innerText = msg;
}

async function carregarContas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const select = document.getElementById("conta");
  try {
    const res = await fetch("/api/contas");
    const contas = await res.json();
    const minhasContas = contas.filter(c => c.id_usuario == usuario.id);
    minhasContas.forEach(conta => {
      const option = document.createElement("option");
      option.value = conta.id_conta;
      option.textContent = conta.nome_conta;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar contas:", err);
    mostrarMensagem("Erro ao carregar contas.");
  }
}
