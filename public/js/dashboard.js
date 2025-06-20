document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  // Saudação com nome e nível
  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome} (${usuario.nivel_acesso})`;
  }

  // Ocultar botão admin se não for ADMINISTRADOR
  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso !== "ADMINISTRADOR" && botaoAdmin) {
    botaoAdmin.style.display = "none";
  }
});

// Função para expandir/contrair o menu lateral
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("expanded");
}
