document.addEventListener("DOMContentLoaded", () => {
  fetch("../telas/menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu-container").innerHTML = html;

      // Só depois que o menu foi carregado no DOM
      const toggleBtn = document.querySelector(".toggle-btn");
      const sidebar = document.getElementById("sidebar");

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          sidebar.classList.toggle("expanded");
        });
      }
    })
    .catch(err => console.error("Erro ao carregar o menu:", err));
});
