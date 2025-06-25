// js/menu.js

fetch('../telas/menu.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('menu-container').innerHTML = html;

    // Só agora os elementos do menu existem no DOM – podemos configurar os eventos:
    const toggleBtn = document.getElementById('toggle-btn');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
      });
    }
  })
  .catch(error => {
    console.error('Erro ao carregar o menu:', error);
  });
