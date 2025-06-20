document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  if (usuario.nivel_acesso !== "ADMINISTRADOR") {
    alert("Acesso restrito a administradores.");
    window.location.href = "/telas/dashboard.html";
    return;
  }

  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome}`;
  }

  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso !== "ADMINISTRADOR" && botaoAdmin) {
    botaoAdmin.style.display = "none";
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("expanded");
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}
