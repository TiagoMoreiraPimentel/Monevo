document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome}`;
  }

  const botaoAdmin = document.getElementById("admin-only");

  if (usuario.nivel_acesso === "ADMINISTRADOR" && botaoAdmin) {
    botaoAdmin.classList.remove("hidden");

    botaoAdmin.addEventListener("click", () => {
      window.location.href = "../telas/admin-usuarios.html";
    });
  } else if (botaoAdmin) {
    botaoAdmin.style.display = "none";
  }
});
