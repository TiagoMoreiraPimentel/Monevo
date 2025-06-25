// menu.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu-container");
  if (container) {
    fetch("menu.html")
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        if (typeof toggleSidebar === "undefined") {
          window.toggleSidebar = () => {
            const sidebar = document.getElementById("sidebar");
            sidebar.classList.toggle("open");
          };
        }
        // Lógica de exibição do botão Admin
        const nivel = localStorage.getItem("nivel_acesso");
        if (nivel === "ADMINISTRADOR") {
          document.getElementById("admin-only").classList.remove("hidden");
        }
      });
  }
});
