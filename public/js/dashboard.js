
document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const saudacao = document.getElementById("saudacao");
  saudacao.textContent = `Olá, ${usuario.nome} (${usuario.nivel_acesso})`;

  // Ocultar itens da tela principal
  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso !== "ADMINISTRADOR") {
    botaoAdmin.classList.add("hidden");
  }
});
