const tabela = document.getElementById("corpo-tabela");
const usuariosPorId = {};

// Função principal para montar a tabela
async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();

  tabela.innerHTML = "";

  usuarios.forEach(u => {
    const id = u.id;
    usuariosPorId[id] = u;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>
        <select data-id="${id}" data-campo="nivel_acesso">
          <option value="VERIFICAR" ${u.nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
          <option value="COLABORADOR" ${u.nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
          <option value="ADMINISTRADOR" ${u.nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
        </select>
      </td>
      <td>
        <select data-id="${id}" data-campo="status">
          <option value="Ativo" ${u.status === "Ativo" ? "selected" : ""}>Ativo</option>
          <option value="Inativo" ${u.status === "Inativo" ? "selected" : ""}>Inativo</option>
        </select>
      </td>
      <td>
        <button class="salvar" data-id="${id}">Salvar</button>
      </td>
    `;

    tabela.appendChild(tr);
  });

  document.querySelectorAll(".salvar").forEach(botao => {
    botao.addEventListener("click", async () => {
      const id = botao.dataset.id;
      const original = usuariosPorId[id];

      const nivel = document.querySelector(`select[data-id="${id}"][data-campo="nivel_acesso"]`).value.toUpperCase();
      const status = document.querySelector(`select[data-id="${id}"][data-campo="status"]`).value;

      const payload = {
        nome: original.nome,
        email: original.email,
        senha_hash: original.senha_hash,
        nivel_acesso: nivel,
        status: status,
        data_cadastro: original.data_cadastro
      };

      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Alterações salvas com sucesso.");
      } else {
        alert("Erro ao salvar alterações.");
      }
    });
  });
}

// Executa tudo ao carregar
carregarUsuarios();

// 🎯 Fora da função principal
document.getElementById("btn-voltar-dashboard").addEventListener("click", () => {
  window.location.href = "/telas/dashboard.html";
});
