const tabela = document.getElementById("corpo-tabela");
const usuariosPorId = {}; // ← novo

async function carregarUsuarios() {
  const res = await fetch("/api/usuarios");
  const usuarios = await res.json();

  tabela.innerHTML = "";

  usuarios.forEach(u => {
  const id = u.id;  // <- CORRETO
  usuariosPorId[id] = u; // ← armazena o usuário original
  const nome = u.nome;
  const email = u.email;
  const nivel_acesso = u.nivel_acesso;
  const status = u.status;

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${nome}</td>
    <td>${email}</td>
    <td>
      <select data-id="${id}" data-campo="nivel_acesso">
        <option value="VERIFICAR" ${nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
        <option value="COLABORADOR" ${nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
        <option value="ADMINISTRADOR" ${nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
      </select>
    </td>
    <td>
      <select data-id="${id}" data-campo="status">
        <option value="Ativo" ${status === "Ativo" ? "selected" : ""}>Ativo</option>
        <option value="Inativo" ${status === "Inativo" ? "selected" : ""}>Inativo</option>
      </select>
    </td>
    <td>
      <button class="salvar" data-id="${id}">Salvar</button>
    </td>
  `;

  tabela.appendChild(tr);
});


  // Eventos de clique para todos os botões Salvar
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
      data_cadastro: original.data_cadastro,
      status: status
    };

    const res = await fetch(`/api/usuarios/${id}`, {
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

carregarUsuarios();
