const apiContas = "/api/contas";
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

if (!usuario) {
  alert("Acesso negado. Faça login.");
  window.location.href = "../telas/login.html";
}

document.getElementById("btn-voltar").addEventListener("click", () => {
  window.location.href = "/telas/dashboard.html";
});

document.getElementById("form-conta").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const tipo = document.getElementById("tipo").value;
  const saldo = parseFloat(document.getElementById("saldo").value || 0);
  const msg = document.getElementById("mensagem");

  if (!nome || !tipo) {
    msg.innerText = "Preencha todos os campos obrigatórios.";
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
    const res = await fetch(apiContas, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaConta)
    });

    if (res.ok) {
      msg.innerText = "Conta cadastrada com sucesso.";
      document.getElementById("form-conta").reset();
      carregarContas();
    } else {
      const texto = await res.text();
      msg.innerText = "Erro ao cadastrar: " + texto;
    }
  } catch (err) {
    msg.innerText = "Erro na conexão.";
    console.error(err);
  }
});

async function carregarContas() {
  const tabela = document.getElementById("tabela-contas");
  tabela.innerHTML = "";
  try {
    const res = await fetch(apiContas);
    const contas = await res.json();
    contas.filter(c => c.id_usuario === usuario.id).forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Nome">${c.nome_conta}</td>
        <td data-label="Tipo">${c.tipo}</td>
        <td data-label="Saldo">R$ ${parseFloat(c.saldo_inicial).toFixed(2)}</td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar contas:", err);
  }
}

carregarContas();
