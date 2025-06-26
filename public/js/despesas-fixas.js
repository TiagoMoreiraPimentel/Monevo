document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Faça login para acessar.");
    window.location.href = "../telas/login.html";
    return;
  }

  carregarDespesas();

  document.getElementById("form-despesa").addEventListener("submit", async (e) => {
    e.preventDefault();

    const despesa = {
      id_usuario: usuario.id,
      categoria: document.getElementById("categoria").value,
      descricao: document.getElementById("descricao").value,
      valor: parseFloat(document.getElementById("valor").value),
      data_lancamento: document.getElementById("data_lancamento").value || null,
      vencimento: document.getElementById("vencimento").value || null,
      ciclo: parseInt(document.getElementById("ciclo").value) || null
    };

    try {
      const r = await fetch("/api/despesas_fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(despesa)
      });

      if (r.ok) {
        mostrarMensagem("Despesa cadastrada com sucesso!", false);
        e.target.reset();
        carregarDespesas();
      } else {
        const erro = await r.json();
        mostrarMensagem(erro.erro || "Erro ao cadastrar.");
        console.error(erro);
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro na conexão.");
    }
  });
});

function mostrarMensagem(msg, erro = true) {
  const el = document.getElementById("mensagem");
  el.style.color = erro ? "red" : "green";
  el.textContent = msg;
}

async function carregarDespesas() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const lista = document.getElementById("lista-despesas");

  try {
    const r = await fetch("/api/despesas_fixas");
    const dados = await r.json();
    const minhas = dados.filter(d => d.id_usuario === usuario.id);

    lista.innerHTML = "";
    minhas.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.categoria}</td>
        <td>${d.descricao || ""}</td>
        <td>R$ ${parseFloat(d.valor).toFixed(2).replace(".", ",")}</td>
        <td>${d.data_lancamento?.split("T")[0] || "-"}</td>
        <td>${d.vencimento?.split("T")[0] || "-"}</td>
        <td>${d.ciclo || "-"}</td>
      `;
      lista.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao carregar despesas.");
  }
}
