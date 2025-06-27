document.addEventListener("DOMContentLoaded", () => {
  fetch("../telas/menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu-container").innerHTML = html;

      const toggleBtn = document.querySelector(".toggle-btn");
      const sidebar = document.getElementById("sidebar");

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          sidebar.classList.toggle("expanded");
        });
      }

      // ✅ Só executa essa parte depois que o menu foi carregado
      const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
      const botaoAdmin = document.getElementById("botao-usuarios");

      if (!usuario || !botaoAdmin) return;

      if (usuario.nivel_acesso !== "ADMINISTRADOR") {
        botaoAdmin.style.display = "none";
      } else {
        botaoAdmin.addEventListener("click", () => {
          window.location.href = "/telas/admin-usuarios.html";
        });
      }

    })
    .catch(err => console.error("Erro ao carregar o menu:", err));
});
