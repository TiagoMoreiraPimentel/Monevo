const apiBase = "/api/usuarios";
const msg = document.getElementById("mensagem");

window.addEventListener("DOMContentLoaded", () => {
  // Toggle cadastro
  document.getElementById("btn-cadastrar-toggle").addEventListener("click", () => {
    document.getElementById("cadastro").style.display = "block";
  });

  // Login
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    msg.innerText = "Verificando login...";

    try {
      const res = await fetch(apiBase);
      const usuarios = await res.json();

      const usuario = usuarios.find(u => u.email === email && u.senha_hash === senha);
      if (!usuario) {
        msg.innerText = "E-mail ou senha incorretos.";
      } else if (usuario.nivel_acesso === "Verificar") {
        msg.innerText = "Acesso pendente de aprovação.";
      } else {
        msg.innerText = `Bem-vindo, ${usuario.nome}!`;
        // Aqui você pode redirecionar
      }
    } catch (err) {
      msg.innerText = "Erro ao conectar com o servidor.";
      console.error(err);
    }
  });

  // Criar conta
  document.getElementById("btn-criar-conta").addEventListener("click", async () => {
    const nome = document.getElementById("cad-nome").value.trim();
    const email = document.getElementById("cad-email").value.trim();
    const senha = document.getElementById("cad-senha").value.trim();

    if (!nome || !email || !senha) {
      msg.innerText = "Preencha todos os campos.";
      return;
    }

    const novoUsuario = {
      id: crypto.randomUUID(),
      nome,
      email,
      senha_hash: senha,
      nivel_acesso: "Verificar",
      data_cadastro: new Date().toISOString().split("T")[0]
    };

    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario)
      });

      const texto = await res.text();
      if (res.ok) {
        msg.innerText = "Conta criada com sucesso! Aguarde aprovação.";
      } else {
        msg.innerText = "Erro ao criar conta: " + texto;
      }
    } catch (err) {
      msg.innerText = "Erro ao enviar dados.";
      console.error(err);
    }
  });
});
