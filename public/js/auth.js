const apiBase = "/api/usuarios";
const msg = document.getElementById("mensagem");

// Elementos da interface
const loginForm = document.getElementById("login-form");
const cadastroForm = document.getElementById("cadastro-form");

// Troca de telas
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

// SUBMIT LOGIN
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

    if (usuario.status !== "Ativo") {
      msg.innerText = "Sua conta está inativa. Procure o administrador.";
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

    if (usuario.nivel_acesso === "ADMINISTRADOR" || usuario.nivel_acesso === "COLABORADOR") {
      localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

      try {
        const verif = await fetch(`/api/precisa_configurar?id_usuario=${usuario.id}`);
        const dados = await verif.json();

        if (dados.precisa_configurar) {
          window.location.href = "/telas/configuracao.html";
        } else {
          window.location.href = "/telas/dashboard.html";
        }
      } catch (err) {
        console.error("Erro ao verificar configuração obrigatória:", err);
        msg.innerText = "Erro ao verificar configuração.";
      }

      return;
    }

    msg.innerText = `Acesso não autorizado: ${usuario.nivel_acesso}`;
  } catch (err) {
    msg.innerText = "Erro ao conectar com o servidor.";
    console.error("Erro no login:", err);
  }
});

// CADASTRO
document.getElementById("btn-criar-conta").addEventListener("click", async () => {
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
    status: "Ativo", // ADICIONADO AQUI
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
      cadastroForm.reset();
      cadastroForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    } else {
      const texto = await res.text();
      msg.innerText = "Erro ao cadastrar: " + texto;
      console.error("Erro no cadastro:", texto);
    }
  } catch (err) {
    msg.innerText = "Erro ao enviar dados.";
    console.error("Erro no cadastro:", err);
  }
});

// ESQUECI A SENHA
document.getElementById("btn-esqueci-senha").addEventListener("click", async () => {
  const email = prompt("Informe seu e-mail cadastrado:");
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
      msg.innerText = "E-mail com a senha enviado com sucesso.";
    } else {
      msg.innerText = "Erro ao enviar e-mail.";
      console.error("Erro envio:", await envio.text());
    }
  } catch (err) {
    msg.innerText = "Erro ao recuperar senha.";
    console.error("Erro:", err);
  }
});
