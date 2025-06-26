document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-despesa-fixa");
  const container = document.getElementById("despesas-fixas-container");
  const idUsuario = localStorage.getItem("id_usuario");

  async function carregarDespesas() {
    const res = await fetch("/api/despesas_fixas");
    const dados = await res.json();

    const minhasDespesas = dados.items.filter(d => d.id_usuario == idUsuario);

    container.innerHTML = "";

    if (minhasDespesas.length === 0) {
      container.innerHTML = "<p>Nenhuma despesa fixa cadastrada.</p>";
      return;
    }

    minhasDespesas.forEach(despesa => {
      const card = document.createElement("div");
      card.className = "card-despesa";
      card.innerHTML = `
        <p><strong>Valor:</strong> R$ ${parseFloat(despesa.valor).toFixed(2)}</p>
        <p><strong>Categoria:</strong> ${despesa.categoria}</p>
        <p><strong>Descrição:</strong> ${despesa.descricao || "-"}</p>
        <p><strong>Lançamento:</strong> ${despesa.data_lancamento}</p>
        <p><strong>Vencimento:</strong> ${despesa.vencimento}</p>
        <p><strong>Ciclo:</strong> ${despesa.ciclo} mês(es)</p>
        <button onclick="excluirDespesa(${despesa.id_despesa_fixa})">Excluir</button>
      `;
      container.appendChild(card);
    });
  }

  async function excluirDespesa(id) {
    if (!confirm("Deseja excluir esta despesa fixa?")) return;

    await fetch(`/api/despesas_fixas?id=${id}`, {
      method: "DELETE"
    });

    carregarDespesas();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      id_usuario: parseInt(idUsuario),
      valor: parseFloat(form.valor.value),
      categoria: form.categoria.value,
      descricao: form.descricao.value,
      data_lancamento: form.data_lancamento.value,
      vencimento: form.vencimento.value,
      ciclo: parseInt(form.ciclo.value)
    };

    await fetch("/api/despesas_fixas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    form.reset();
    carregarDespesas();
  });

  carregarDespesas();
});
