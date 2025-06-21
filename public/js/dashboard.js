document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const saudacao = document.getElementById("saudacao");
  if (saudacao) {
    saudacao.textContent = `Olá, ${usuario.nome}`;
  }

  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso === "ADMINISTRADOR") {
    botaoAdmin.classList.remove("hidden");
    botaoAdmin.addEventListener("click", () => {
      window.location.href = "../telas/admin-usuarios.html";
    });
  } else {
    botaoAdmin.style.display = "none";
  }

  const hoje = new Date();
  document.getElementById("mes").value = String(hoje.getMonth() + 1).padStart(2, '0');
  document.getElementById("ano").value = String(hoje.getFullYear());

  carregarResumo();
});

window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("expanded");
};

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}

async function carregarResumo() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const mes = document.getElementById("mes").value;
  const ano = document.getElementById("ano").value;

  const transacoes = await buscarTransacoes(usuario.id, mes, ano);

  let totalReceitas = 0;
  let totalDespesas = 0;
  const porCategoria = {};
  const porConta = {};

  transacoes.forEach(t => {
    const valor = parseFloat(t.valor);
    if (t.tipo === "Receita") {
      totalReceitas += valor;
    } else {
      totalDespesas += valor;
    }

    const cat = t.categoria || "Outros";
    porCategoria[cat] = (porCategoria[cat] || 0) + valor;

    const tipoConta = t.tipo_conta || "Desconhecida";
    porConta[tipoConta] = (porConta[tipoConta] || 0) + valor;
  });

  document.getElementById("total-receitas").textContent = totalReceitas.toFixed(2);
  document.getElementById("total-despesas").textContent = totalDespesas.toFixed(2);
  document.getElementById("saldo").textContent = (totalReceitas - totalDespesas).toFixed(2);

  desenharGraficoPizza(porCategoria);
  desenharGraficoBarra(totalReceitas, totalDespesas);
  desenharGraficoConta(porConta);
}

async function buscarTransacoes(idUsuario, mes, ano) {
  const url = `/api/transacoes?id_usuario=${idUsuario}&mes=${mes}&ano=${ano}`;
  try {
    const res = await fetch(url);
    const dados = await res.json();
    return dados;
  } catch (err) {
    console.error("Erro ao buscar transações", err);
    return [];
  }
}

let graficoPizza, graficoBarra, graficoConta;

function desenharGraficoPizza(dados) {
  const ctx = document.getElementById("grafico-categorias").getContext("2d");
  if (graficoPizza) graficoPizza.destroy();
  graficoPizza = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        label: 'Despesas por Categoria',
        data: Object.values(dados),
        backgroundColor: ['#008B65', '#FF6384', '#FFCE56', '#36A2EB', '#9966FF', '#FF9F40']
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: "#000",
          formatter: v => `R$ ${v.toFixed(2)}`,
          anchor: 'end',
          align: 'start'
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function desenharGraficoBarra(receitas, despesas) {
  const ctx = document.getElementById("grafico-linhas").getContext("2d");
  if (graficoBarra) graficoBarra.destroy();
  graficoBarra = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        label: 'Resumo do mês',
        data: [receitas, despesas],
        backgroundColor: ['#008B65', '#FF6384']
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: "#000",
          anchor: 'end',
          align: 'top',
          formatter: v => `R$ ${v.toFixed(2)}`
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function desenharGraficoConta(dados) {
  const ctx = document.getElementById("grafico-conta").getContext("2d");
  if (graficoConta) graficoConta.destroy();
  graficoConta = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        label: "Valor movimentado por tipo de conta",
        data: Object.values(dados),
        backgroundColor: "#36A2EB"
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "top",
          formatter: val => `R$ ${val.toFixed(2)}`
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}
