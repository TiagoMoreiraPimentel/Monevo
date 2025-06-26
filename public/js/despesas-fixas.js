document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-despesa-fixa");
  const lista = document.getElementById("lista-despesas");

  async function carregarDespesas() {
    try {
      const res = await fetch("/api/despesas_fixas");
      const json = await res.json();

      lista.innerHTML = "";
      if (json.items && json.items.length > 0) {
        json.items.forEach(despesa => {
          const div = document.createElement("div");
          div.classList.add("card-despesa");
          div.innerHTML = `
            <strong>${despesa.categoria}</strong> - R$ ${despesa.valor.toFixed(2)}<br/>
            ${despesa.descricao} | Ciclo: ${despesa.ciclo} dias
            <button data-id="${despesa.id_despesa_fixa}" class="btn-excluir">Excluir</button>
          `;
          lista.appendChild(div);
        });

        document.querySelectorAll(".btn-excluir").forEach(btn => {
          btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            await fetch(`/api/despesas_fixas?id=${id}`, { method: "DELETE" });
            carregarDespesas();
          });
        });
      } else {
        lista.innerHTML = "<p>Nenhuma despesa fixa cadastrada.</p>";
      }
    } catch (e) {
      console.error("Erro ao carregar despesas:", e);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaDespesa = {
      id_usuario: 1,
      valor: parseFloat(document.getElementById("valor").value),
      categoria: document.getElementById("categoria").value,
      descricao: document.getElementById("descricao").value,
      ciclo: parseInt(document.getElementById("ciclo").value)
    };

    try {
      const res = await fetch("/api/despesas_fixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa)
      });

      const resultado = await res.json();
      if (res.ok) {
        form.reset();
        carregarDespesas();
      } else {
        alert("Erro: " + (resultado.erro || "Falha ao cadastrar"));
        console.error(resultado);
      }
    } catch (e) {
      alert("Erro inesperado");
      console.error(e);
    }
  });

  carregarDespesas();
});
