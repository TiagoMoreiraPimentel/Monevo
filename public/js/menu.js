document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("menu-container");

  fetch("/telas/menu.html")
    .then(response => {
      if (!response.ok) {
        throw new Error("Erro ao carregar o menu");
      }
      return response.text();
    })
    .then(html => {
      menuContainer.innerHTML = html;
      configurarMenu(); // Chama a função para adicionar os eventos
    })
    .catch(error => {
      console.error("Erro ao inserir o menu:", error);
    });
});

// Função para adicionar eventos ao menu após ser carregado
function configurarMenu() {
  const toggleBtns = document.querySelectorAll(".toggle-btn, .mobile-toggle");
  const sidebar = document.getElementById("sidebar");

  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("aberto");
    });
  });

  const btnSair = document.querySelector("#menu-container .menu-opcoes button:last-child");
  if (btnSair) {
    btnSair.addEventListener("click", logout);
  }

  const nomeUsuario = localStorage.getItem("nome");
  const saudacao = document.getElementById("saudacao");
  if (saudacao && nomeUsuario) {
    saudacao.textContent = `Olá, ${nomeUsuario}`;
  }

  const nivel = localStorage.getItem("nivel_acesso");
  const adminBtn = document.getElementById("admin-only");
  if (adminBtn && nivel === "ADMINISTRADOR") {
    adminBtn.classList.remove("hidden");
    adminBtn.addEventListener("click", () => {
      window.location.href = "/telas/admin-usuarios.html";
    });
  }
}
