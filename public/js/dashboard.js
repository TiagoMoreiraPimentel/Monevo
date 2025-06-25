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
            legend: { display: false },
            title: { display: false },
            datalabels: {
              anchor: "end",
              align: "top",
              font: { size: 10, weight: "bold" },
              formatter: valor => `R$ ${valor.toFixed(2)}`,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { weight: 'bold' } }
            },
            y: {
              beginAtZero: true,
              suggestedMax: maxValor * 1.2,
              grid: { display: false },
              ticks: { font: { weight: 'bold' } }
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
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10, weight: "bold" },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.2,
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
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
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10, weight: "bold" },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.2,
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
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

  if (graficoLinhas) graficoLinhas.destroy();
  graficoLinhas = new Chart(document.getElementById("grafico-linhas"), {
    type: "pie",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: ["#4caf50", "#f44336"],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "bottom" },
        title: { display: false },
        datalabels: {
          color: "#000",
          font: { size: 12, weight: "bold" },
          formatter: (valor, ctx) => {
            const percent = ctx.chart.data.datasets[0].data[ctx.dataIndex] / total * 100;
            return `R$ ${valor.toFixed(2)} (${percent.toFixed(1)}%)`;
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderizarGraficoConta(transacoes) {
  const saldosPorConta = {};

  transacoes.forEach((t) => {
    const tipo = t.tipo_conta || "Desconhecido";
    const valor = t.tipo === "Receita" ? t.valor : -t.valor;

    if (!saldosPorConta[tipo]) saldosPorConta[tipo] = 0;
    saldosPorConta[tipo] += valor;
  });

  const labels = Object.keys(saldosPorConta);
  const valores = Object.values(saldosPorConta);
  const total = valores.reduce((s, v) => s + v, 0);
  const porcentagens = valores.map(v => ((v / total) * 100).toFixed(1));
  const maxValor = Math.max(...valores, 0) * 1.2;

  if (graficoConta) graficoConta.destroy();
  graficoConta = new Chart(document.getElementById("grafico-conta"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Saldo disponível por Tipo de Conta",
        data: valores,
        backgroundColor: "#2196f3",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          font: { size: 10, weight: "bold" },
          formatter: (valor, ctx) => `R$ ${valor.toFixed(2)} (${porcentagens[ctx.dataIndex]}%)`,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValor,
          grid: { display: false },
          ticks: { font: { weight: 'bold' } }
        }
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

  async function carregarTicketsTags() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || !usuario.id) return;

    try {
      const res = await fetch(`/api/tickets_tags?id_usuario=${usuario.id}`);
      const dados = await res.json();

      const container = document.getElementById("tabela-ticket-tags");
      container.innerHTML = ""; // limpa conteúdo anterior
      container.className = "tabela-tickets";

      const tabela = document.createElement("table");
      tabela.innerHTML = `
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Saldo</th>
            <th>Gasto Hoje</th>
            <th>Saldo Restante</th>
            <th>Dias Restantes</th>
            <th>Ticket Diário</th>
          </tr>
        </thead>
        <tbody>
          ${dados.map(tag => `
            <tr>
              <td>${tag.tag}</td>
              <td>R$ ${tag.saldo}</td>
              <td>R$ ${tag.gasto_hoje}</td>
              <td>R$ ${tag.saldo_restante}</td>
              <td>${tag.dias_restantes}</td>
              <td><strong>R$ ${tag.ticket_diario}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      `;

      container.appendChild(tabela);

    } catch (err) {
      console.error("Erro ao carregar tickets por tag:", err);
    }
  }

window.onload = function () {
  carregarResumo();
  carregarTicketsTags(); // ⬅️ Incluído
};

});

window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("expanded");
};

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}
