fetch('../telas/menu.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('menu-container').innerHTML = html;

    // Dispara um evento para avisar que o menu foi carregado
    document.dispatchEvent(new Event('menuCarregado'));
  });

// Função de alternar o menu lateral
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('expanded');
  }
}
