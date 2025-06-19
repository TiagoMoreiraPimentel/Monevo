const loginForm = document.getElementById("login-form");
const cadastroForm = document.getElementById("cadastro-form");

document.getElementById("btn-cadastrar-toggle").addEventListener("click", () => {
  loginForm.classList.add("hidden");
  cadastroForm.classList.remove("hidden");
  msg.innerText = "";
});

document.getElementById("btn-voltar-login").addEventListener("click", () => {
  cadastroForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  msg.innerText = "";
});

const apiBase = "/api/usuarios";
const msg = document.getElementById("mensagem");

window.addEventListener("DOMContentLoaded", () => {
  const cadastroDiv = document.getElementById("cadastro");

  // Mostrar formulário de cadastro
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

        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
          msg.innerText = "Usuário não cadastrado.";
          return;
        }

        if (usuario.senha_hash !== senha) {
          msg.innerText = "Senha incorreta.";
          return;
        }

        if (usuario.nivel_acesso === "Verificar") {
          msg.innerText = "Seu cadastro está aguardando aprovação.";
          return;
        }

        if (usuario.nivel_acesso === "COLABORADOR") {
          msg.innerText = "Login realizado com sucesso. Perfil: COLABORADOR.";
          return;
        }

        if (usuario.nivel_acesso === "ADMINISTRADOR") {
          msg.innerText = "Login realizado com sucesso. Perfil: ADMINISTRADOR.";
          return;
        }

        msg.innerText = `Acesso não autorizado. Nível desconhecido: ${usuario.nivel_acesso}`;
      } catch (err) {
        msg.innerText = "Erro ao conectar com o servidor.";
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

      try {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoUsuario)
        });

        if (res.ok) {
          msg.innerText = "Conta criada com sucesso! Aguarde aprovação.";
          document.getElementById("cad-nome").value = "";
          document.getElementById("cad-email").value = "";
          document.getElementById("cad-senha").value = "";
          cadastroDiv.style.display = "none";
        } else {
          const texto = await res.text();
          msg.innerText = "Erro ao cadastrar: " + texto;
          console.error("Erro no cadastro:", texto);
        }
      } catch (err) {
        msg.innerText = "Erro ao enviar dados.";
        console.error("Erro na requisição de cadastro:", err);
      }
    });
  }

  // Esqueci a senha - envio por e-mail (Resend)
  const btnEsqueci = document.getElementById("btn-esqueci-senha");
  if (btnEsqueci) {
    btnEsqueci.addEventListener("click", async () => {
      const email = prompt("Informe o e-mail cadastrado:");
      if (!email) return;

      msg.innerText = "Verificando...";

      try {
        const res = await fetch(apiBase);
        const usuarios = await res.json();

        const usuario = usuarios.find(u => u.email === email.trim());

        if (!usuario) {
          msg.innerText = "E-mail não encontrado.";
          return;
        }

        // Enviar a senha atual por e-mail usando o endpoint do Resend
        const envio = await fetch("/api/enviarEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: usuario.email,
            assunto: "Recuperação de senha - Monevo",
            corpo: `
              <p>Olá, ${usuario.nome},</p>
              <p>Você solicitou a recuperação da sua senha.</p>
              <p><strong>Sua senha atual é:</strong> ${usuario.senha_hash}</p>
              <p>Recomendamos alterá-la assim que possível.</p>
            `
          })
        });

        if (envio.ok) {
          msg.innerText = "E-mail enviado com sua senha.";
        } else {
          msg.innerText = "Erro ao enviar o e-mail.";
          console.error("Erro no envio:", await envio.text());
        }
      } catch (err) {
        msg.innerText = "Erro ao recuperar senha.";
        console.error("Erro:", err);
      }
    });
  }
});
