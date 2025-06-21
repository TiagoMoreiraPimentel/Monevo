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
    const tipoSelecionado = document.getElementById("tipo").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;
    const descricao = document.getElementById("descricao").value || "";

    if (!usuario || !idConta || !tipoSelecionado || isNaN(valor) || !data || !categoria) {
      mostrarMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    const transacao = {
      id_usuario: usuario.id,
      id_conta: idConta,
      tipo: tipoSelecionado,
      valor,
      data_transacao: data,
      categoria,
      descricao
    };

    try {
      console.log("Dados enviados:", transacao);

      const res = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transacao)
      });

      const txt = await res.json();

      if (res.ok) {
        mostrarMensagem("Transação cadastrada com sucesso.");
        e.target.reset();
      } else {
        console.error("Erro ORDS:", txt);
        mostrarMensagem("Erro ao cadastrar transação.");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro de conexão.");
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
    const contasUsuario = contas.filter(c => c.id_usuario == usuario.id);

    contasUsuario.forEach(conta => {
      const opt = document.createElement("option");
      opt.value = conta.id_conta;
      opt.textContent = `${conta.nome_conta} (${conta.tipo})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar contas:", err);
    mostrarMensagem("Erro ao carregar contas.");
  }
}
