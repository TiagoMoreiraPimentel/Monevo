fetch('../telas/menu.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('menu-container').innerHTML = html;
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('expanded'); // inicia recolhido
  });

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('expanded');
}
