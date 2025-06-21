let graficoCategorias, graficoLinhas, graficoConta;

function carregarResumo() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const mes = document.getElementById("mes").value;
  const ano = document.getElementById("ano").value;

  fetch(`/api/transacoes?id_usuario=${usuario.id}&mes=${mes}&ano=${ano}`)
    .then((r) => r.json())
    .then((transacoes) => {
      const receitas = transacoes.filter((t) => t.tipo === "Receita");
      const despesas = transacoes.filter((t) => t.tipo === "Despesa");

      const totalReceitas = receitas.reduce((s, t) => s + t.valor, 0);
      const totalDespesas = despesas.reduce((s, t) => s + t.valor, 0);
      const saldo = totalReceitas - totalDespesas;

      document.getElementById("total-receitas").textContent = totalReceitas.toFixed(2);
      document.getElementById("total-despesas").textContent = totalDespesas.toFixed(2);
      document.getElementById("saldo").textContent = saldo.toFixed(2);

      renderizarGraficoCategorias(transacoes);
      renderizarGraficoLinhas(totalReceitas, totalDespesas);
      renderizarGraficoConta(transacoes);
    });
}

function renderizarGraficoCategorias(transacoes) {
  const categorias = {};
  let total = 0;
  transacoes.forEach((t) => {
    categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    total += t.valor;
  });

  const labels = Object.keys(categorias);
  const valores = Object.values(categorias);
  const porcentagens = valores.map((v) => ((v / total) * 100).toFixed(1));

  if (graficoCategorias) graficoCategorias.destroy();
  graficoCategorias = new Chart(document.getElementById("grafico-categorias"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Categorias",
        data: valores,
        backgroundColor: "#008B65"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function renderizarGraficoLinhas(receitas, despesas) {
  const total = receitas + despesas;
  const pReceitas = ((receitas / total) * 100).toFixed(1);
  const pDespesas = ((despesas / total) * 100).toFixed(1);

  if (graficoLinhas) graficoLinhas.destroy();
  graficoLinhas = new Chart(document.getElementById("grafico-linhas"), {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        label: "Total",
        data: [receitas, despesas],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${[pReceitas, pDespesas][ctx.dataIndex]}%)`,
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function renderizarGraficoConta(transacoes) {
  const tipos = {};
  let total = 0;
  transacoes.forEach((t) => {
    const tipo = t.tipo_conta || "Desconhecido";
    tipos[tipo] = (tipos[tipo] || 0) + t.valor;
    total += t.valor;
  });

  const labels = Object.keys(tipos);
  const valores = Object.values(tipos);
  const porcentagens = valores.map((v) => ((v / total) * 100).toFixed(1));

  if (graficoConta) graficoConta.destroy();
  graficoConta = new Chart(document.getElementById("grafico-conta"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Tipo de Conta",
        data: valores,
        backgroundColor: "#2196f3"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    },
    plugins: [ChartDataLabels]
  });
}

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

  // Seleciona mês atual por padrão
  const hoje = new Date();
  document.getElementById("mes").value = String(hoje.getMonth() + 1).padStart(2, "0");
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
