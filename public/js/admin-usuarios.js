const usuariosPorId = {};

function carregarUsuarios() {
  const corpoTabela = document.getElementById("corpo-tabela");
  const listaMobile = document.getElementById("lista-usuarios-mobile");
  if (!corpoTabela || !listaMobile) return;

  fetch("/api/usuarios")
    .then(res => res.json())
    .then(usuarios => {
      corpoTabela.innerHTML = "";
      listaMobile.innerHTML = "";

      usuarios.forEach(u => {
        const id = u.id;
        usuariosPorId[id] = u;

        // --- TABELA (desktop) ---
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
          <td><button class="salvar" data-id="${id}">Salvar</button></td>
        `;
        corpoTabela.appendChild(tr);

        // --- CARD (mobile) ---
        const card = document.createElement("div");
        card.classList.add("card-usuario");
        card.innerHTML = `
          <p><strong>Nome:</strong> ${u.nome}</p>
          <p><strong>Email:</strong> ${u.email}</p>
          <label>Nível de Acesso:</label>
          <select data-id="${id}" data-campo="nivel_acesso">
            <option value="VERIFICAR" ${u.nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
            <option value="COLABORADOR" ${u.nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
            <option value="ADMINISTRADOR" ${u.nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
          </select>
          <label>Status:</label>
          <select data-id="${id}" data-campo="status">
            <option value="Ativo" ${u.status === "Ativo" ? "selected" : ""}>Ativo</option>
            <option value="Inativo" ${u.status === "Inativo" ? "selected" : ""}>Inativo</option>
          </select>
          <button class="salvar" data-id="${id}">Salvar</button>
        `;
        listaMobile.appendChild(card);
      });

      document.querySelectorAll(".salvar").forEach(botao => {
        botao.addEventListener("click", async () => {
          const id = botao.dataset.id;
          const original = usuariosPorId[id];
          const nivel = document.querySelector(`select[data-id="${id}"][data-campo="nivel_acesso"]`).value;
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

          alert(res.ok ? "Alterações salvas com sucesso." : "Erro ao salvar alterações.");
        });
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const aguardar = setInterval(() => {
    if (document.getElementById("corpo-tabela") && document.getElementById("lista-usuarios-mobile")) {
      clearInterval(aguardar);
      carregarUsuarios();
    }
  }, 100);
});
