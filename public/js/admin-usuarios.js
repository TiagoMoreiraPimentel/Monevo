// admin-usuarios.js

const usuariosPorId = {};

function mostrarMensagem(texto, tipo = "success") {
  let msg = document.getElementById("mensagem-geral");
  if (!msg) {
    msg = document.createElement("div");
    msg.id = "mensagem-geral";
    msg.className = "message";
    document.querySelector(".main-content").prepend(msg);
  }
  msg.className = `message message-${tipo}`;
  msg.innerText = texto;
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 3500);
}

async function carregarUsuarios() {
  const corpoTabela = document.getElementById("corpo-tabela");
  const listaMobile = document.getElementById("lista-usuarios-mobile");
  if (!corpoTabela || !listaMobile) return;

  try {
    const res = await fetch("/api/usuarios");
    const usuarios = await res.json();

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
          <select class="form-control" data-id="${id}" data-campo="nivel_acesso">
            <option value="VERIFICAR" ${u.nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
            <option value="COLABORADOR" ${u.nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
            <option value="ADMINISTRADOR" ${u.nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
          </select>
        </td>
        <td>
          <select class="form-control" data-id="${id}" data-campo="status">
            <option value="Ativo" ${u.status === "Ativo" ? "selected" : ""}>Ativo</option>
            <option value="Inativo" ${u.status === "Inativo" ? "selected" : ""}>Inativo</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary salvar" data-id="${id}">Salvar</button>
        </td>
      `;
      corpoTabela.appendChild(tr);

      // --- CARD (mobile) ---
      const card = document.createElement("div");
      card.className = "transaction-card";
      card.innerHTML = `
        <div class="transaction-details">
          <div class="transaction-detail">
            <span class="detail-label">Nome</span>
            <span class="detail-value">${u.nome}</span>
          </div>
          <div class="transaction-detail">
            <span class="detail-label">Email</span>
            <span class="detail-value">${u.email}</span>
          </div>
          <div class="transaction-detail">
            <span class="detail-label">Nível de Acesso</span>
            <select class="form-control" data-id="${id}" data-campo="nivel_acesso">
              <option value="VERIFICAR" ${u.nivel_acesso === "VERIFICAR" ? "selected" : ""}>Verificar</option>
              <option value="COLABORADOR" ${u.nivel_acesso === "COLABORADOR" ? "selected" : ""}>Colaborador</option>
              <option value="ADMINISTRADOR" ${u.nivel_acesso === "ADMINISTRADOR" ? "selected" : ""}>Administrador</option>
            </select>
          </div>
          <div class="transaction-detail">
            <span class="detail-label">Status</span>
            <select class="form-control" data-id="${id}" data-campo="status">
              <option value="Ativo" ${u.status === "Ativo" ? "selected" : ""}>Ativo</option>
              <option value="Inativo" ${u.status === "Inativo" ? "selected" : ""}>Inativo</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary salvar" data-id="${id}" style="margin-top:1rem;width:100%;">Salvar</button>
      `;
      listaMobile.appendChild(card);
    });

    // Adiciona evento aos botões "Salvar" (tabela e cards)
    document.querySelectorAll(".salvar").forEach(botao => {
      botao.onclick = async () => {
        const id = botao.dataset.id;
        const original = usuariosPorId[id];

        // Busca os selects pelo data-id e data-campo (em ambos modos)
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

        botao.classList.add("loading");
        botao.disabled = true;

        try {
          const res = await fetch(`/api/usuarios?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            mostrarMensagem("Alterações salvas com sucesso.", "success");
          } else {
            mostrarMensagem("Erro ao salvar alterações.", "error");
          }
        } catch (err) {
          mostrarMensagem("Erro de conexão ao salvar.", "error");
        } finally {
          botao.classList.remove("loading");
          botao.disabled = false;
        }
      };
    });

  } catch (err) {
    mostrarMensagem("Erro ao carregar usuários.", "error");
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", carregarUsuarios);
