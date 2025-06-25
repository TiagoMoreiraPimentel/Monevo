document.addEventListener("DOMContentLoaded", () => {
  fetch("../telas/menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu-container").innerHTML = html;
    });
});

function toggleSidebar() {
  const sidebar = document.getElementById("menuSidebar");
  if (sidebar) {
    sidebar.classList.toggle("expanded");
  }
}
