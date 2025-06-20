document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  // 🔐 Redireciona se não estiver logado
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  // 👤 Saudação com nome
  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome}`;
  }

  // 🔐 Exibe botão "Gerenciar Usuários" apenas para ADMINISTRADOR
  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso === "ADMINISTRADOR") {
    if (botaoAdmin) {
      botaoAdmin.classList.remove("hidden");
      botaoAdmin.addEventListener("click", () => {
        window.location.href = "../telas/admin-usuarios.html";
      });
    }
  } else if (botaoAdmin) {
    botaoAdmin.style.display = "none";
  }

  // ☰ Botão de menu lateral (caso não esteja usando onclick direto)
  const menuBtn = document.getElementById("menu-toggle");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      sidebar.classList.toggle("expanded");
    });
  }
});

// Função de toggle global para uso com onclick="toggleSidebar()"
window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("expanded");
};

// 🔓 Logout
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}
