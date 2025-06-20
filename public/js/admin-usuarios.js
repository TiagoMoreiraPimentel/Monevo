const tabela = document.getElementById("corpo-tabela");

async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();

  tabela.innerHTML = "";

  usuarios.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>
        <select data-id="${u.id_usuario}" data-campo="nivel_acesso">
          <option value="VERIFICAR" ${u.nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
          <option value="COLABORADOR" ${u.nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
          <option value="ADMINISTRADOR" ${u.nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
        </select>
      </td>
      <td>
        <select data-id="${u.id_usuario}" data-campo="status">
          <option value="Ativo" ${u.status === "Ativo" ? "selected" : ""}>Ativo</option>
          <option value="Inativo" ${u.status === "Inativo" ? "selected" : ""}>Inativo</option>
        </select>
      </td>
      <td>
        <button class="salvar" data-id="${u.id_usuario}">Salvar</button>
      </td>
    `;

    tabela.appendChild(tr);
  });

  // Depois de montar a tabela, adiciona os eventos de clique nos botões
  document.querySelectorAll(".salvar").forEach(botao => {
    botao.addEventListener("click", async () => {
      const id = botao.dataset.id;
      const nivel = document.querySelector(`select[data-id="${id}"][data-campo="nivel_acesso"]`).value.toUpperCase();
      const status = document.querySelector(`select[data-id="${id}"][data-campo="status"]`).value;

      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel_acesso: nivel, status })
      });

      if (res.ok) {
        alert("Alterações salvas com sucesso.");
      } else {
        alert("Erro ao salvar alterações.");
      }
    });
  });
}

// 🚀 Inicia o carregamento ao abrir a tela
carregarUsuarios();
