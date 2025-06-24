let graficoSaldos, graficoDespesas, graficoReceitas, graficoLinhas, graficoConta;

if (typeof Chart !== "undefined") {
  Chart.defaults.plugins.title.display = false;
}

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

      renderizarGraficoCategoriasDespesas(despesas);
      renderizarGraficoCategoriasReceitas(receitas);
      renderizarGraficoLinhas(totalReceitas, totalDespesas);
      renderizarGraficoConta(transacoes);
      carregarGraficoSaldosTags(usuario.id);
    });
}

function carregarGraficoSaldosTags(idUsuario) {
  fetch(`/api/saldos_tags?id_usuario=${idUsuario}`)
    .then((r) => r.json())
    .then((dados) => {
      const labels = dados.map(d => d.tag);
      const valores = dados.map(d => parseFloat(d.valor) || 0);
      const maxValor = Math.max(...valores, 0);

      if (graficoSaldos) graficoSaldos.destroy();
      graficoSaldos = new Chart(document.getElementById("grafico-saldos-tags"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "",
            data: valores,
            backgroundColor: "#ff9800",
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }, // ✅ Isso remove a barrinha colorida
            title: { display: false },
            datalabels: {
              anchor: "end",
              align: "top",
              font: { size: 10 },
              formatter: valor => `R$ ${valor.toFixed(2)}`,
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              suggestedMax: maxValor * 1.2,
              grid: { display: false }
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    });
}

function renderizarGraficoCategoriasDespesas(transacoes) {
  const categorias = {};
  let total = 0;
  transacoes.forEach(t => {
    categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    total += t.valor;
  });

  const labels = Object.keys(categorias);
  const valores = Object.values(categorias);
  const porcentagens = valores.map(v => ((v / total) * 100).toFixed(1));
  const maxValor = Math.max(...valores, 0);

  if (graficoDespesas) graficoDespesas.destroy();
  graficoDespesas = new Chart(document.getElementById("grafico-despesas"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "",
        data: valores,
        backgroundColor: "#f44336",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // ✅ Isso remove a barrinha colorida
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10 },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.2,
          grid: { display: false }
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderizarGraficoCategoriasReceitas(transacoes) {
  const categorias = {};
  let total = 0;
  transacoes.forEach(t => {
    categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    total += t.valor;
  });

  const labels = Object.keys(categorias);
  const valores = Object.values(categorias);
  const porcentagens = valores.map(v => ((v / total) * 100).toFixed(1));
  const maxValor = Math.max(...valores, 0);

  if (graficoReceitas) graficoReceitas.destroy();
  graficoReceitas = new Chart(document.getElementById("grafico-receitas"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "",
        data: valores,
        backgroundColor: "#008B65",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // ✅ Isso remove a barrinha colorida
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10 },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.2,
          grid: { display: false }
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderizarGraficoLinhas(receitas, despesas) {
  const total = receitas + despesas;
  const pReceitas = ((receitas / total) * 100).toFixed(1);
  const pDespesas = ((despesas / total) * 100).toFixed(1);
  const maxValor = Math.max(receitas, despesas) * 1.2;

  if (graficoLinhas) graficoLinhas.destroy();
  graficoLinhas = new Chart(document.getElementById("grafico-linhas"), {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        label: "",
        data: [receitas, despesas],
        backgroundColor: ["#4caf50", "#f44336"],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // ✅ Isso remove a barrinha colorida
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10 },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${[pReceitas, pDespesas][ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor,
          grid: { display: false }
        },
      },
    },
    plugins: [ChartDataLabels],
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
  const maxValor = Math.max(...valores, 0);

  if (graficoConta) graficoConta.destroy();
  graficoConta = new Chart(document.getElementById("grafico-conta"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "",
        data: valores,
        backgroundColor: "#2196f3",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // ✅ Isso remove a barrinha colorida
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10 },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.2,
          grid: { display: false }
        },
      },
    },
    plugins: [ChartDataLabels],
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
  if (saudacao) saudacao.textContent = `Olá, ${usuario.nome}`;

  const botaoAdmin = document.getElementById("admin-only");
  if (usuario.nivel_acesso === "ADMINISTRADOR") {
    botaoAdmin.classList.remove("hidden");
    botaoAdmin.addEventListener("click", () => {
      window.location.href = "../telas/admin-usuarios.html";
    });
  } else {
    botaoAdmin.style.display = "none";
  }

  document.getElementById("mes").value = String(new Date().getMonth() + 1).padStart(2, "0");
  document.getElementById("ano").value = String(new Date().getFullYear());

  carregarResumo();
});

window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("expanded");
};

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}
