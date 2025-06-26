document.addEventListener("DOMContentLoaded", () => {
  fetch("../telas/menu.html")
    .then(res => res.text())
    .then(async html => {
      document.getElementById("menu-container").innerHTML = html;

      // Lógica de expansão do menu
      const toggleBtn = document.querySelector(".toggle-btn");
      const sidebar = document.getElementById("sidebar");

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          sidebar.classList.toggle("expanded");
        });
      }

      // ✅ Verificação de configuração obrigatória
      const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
      const estaNaTelaConfiguracao = window.location.pathname.includes("configuracao.html");

      if (usuario && !estaNaTelaConfiguracao) {
        try {
          const res = await fetch(`/api/precisa_configurar?id_usuario=${usuario.id}`);
          const dados = await res.json();

          if (dados.precisa_configurar) {
            alert("Antes de usar o sistema, você precisa configurar suas TAGs de distribuição.");
            window.location.href = "/telas/configuracao.html";
          }
        } catch (err) {
          console.error("Erro ao verificar configuração obrigatória:", err);
        }
      }
    })
    .catch(err => console.error("Erro ao carregar o menu:", err));
});
