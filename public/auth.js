const apiBase = "/api/usuarios";
const msg = document.getElementById("mensagem");

window.addEventListener("DOMContentLoaded", () => {
  const cadastroDiv = document.getElementById("cadastro");

  // Mostrar o formulário de cadastro
  const toggleBtn = document.getElementById("btn-cadastrar-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      cadastroDiv.style.display = "block";
    });
  }

  // Submeter login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-senha").value.trim();
      msg.innerText = "Verificando...";

      try {
        const res = await fetch(apiBase);
        const usuarios = await res.json();

        const usuario = usuarios.find(
          (u) => u.email === email && u.senha_hash === senha
        );

        if (!usuario) {
          msg.innerText = "E-mail ou senha inválidos.";
        } else if (usuario.nivel_acesso === "Verificar") {
          msg.innerText = "Acesso pendente de aprovação.";
        } else {
          msg.innerText = `Bem-vindo(a), ${usuario.nome}!`;
          // redirecionar futuramente
        }
      } catch (err) {
        msg.innerText = "Erro ao conectar.";
        console.error("Erro na requisição de login:", err);
      }
    });
  }

  // Criar nova conta
  const cadastrarBtn = document.getElementById("btn-criar-conta");
  if (cadastrarBtn) {
    cadastrarBtn.addEventListener("click", async () => {
      const nome = document.getElementById("cad-nome").value.trim();
      const email = document.getElementById("cad-email").value.trim();
      const senha = document.getElementById("cad-senha").value.trim();

      if (!nome || !email || !senha) {
        msg.innerText = "Preencha todos os campos.";
        return;
      }

      const novoUsuario = {
        nome: nome.slice(0, 50),
        email: email.slice(0, 50),
        senha_hash: senha.slice(0, 200),
        nivel_acesso: "Verificar",
        data_cadastro: new Date().toISOString()
      };

      console.log("Enviando para o backend:", novoUsuario);

      try {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoUsuario)
        });

        const texto = await res.text();
        console.log("Resposta:", res.status, texto);

        if (res.ok) {
          msg.innerText = "Conta criada com sucesso! Aguarde aprovação.";
          document.getElementById("cad-nome").value = "";
          document.getElementById("cad-email").value = "";
          document.getElementById("cad-senha").value = "";
        } else {
          msg.innerText = "Erro ao cadastrar: " + texto;
        }
      } catch (err) {
        msg.innerText = "Erro ao enviar dados.";
        console.error("Erro na requisição de cadastro:", err);
      }
    });
  }
});
