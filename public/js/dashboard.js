document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  // Saudação
  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome} (${usuario.nivel_acesso})`;
  }

  // Esconde botões de admin
  if (usuario.nivel_acesso !== "ADMINISTRADOR") {
    const botaoAdmin = document.getElementById("admin-only");
    const botaoAdminMobile = document.getElementById("admin-only-mobile");
    if (botaoAdmin) botaoAdmin.style.display = "none";
    if (botaoAdminMobile) botaoAdminMobile.style.display = "none";
  }

  // Expansão do menu lateral (desktop)
  const toggle = document.getElementById("toggle-menu");
  const menuLateral = document.getElementById("menu-lateral");

  if (toggle && menuLateral) {
    toggle.addEventListener("click", () => {
      menuLateral.classList.toggle("expandido");
    });
  }

  // Menu suspenso (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  const menuMobile = document.getElementById("menu-mobile");

  if (menuToggle && menuMobile) {
    menuToggle.addEventListener("click", () => {
      menuMobile.classList.toggle("ativo");
    });
  }
});

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}
