let graficoSaldos, graficoDespesas, graficoReceitas, graficoLinhas, graficoConta;

function formatarValorBR(valor, comSimbolo = true) {
  const valorFormatado = parseFloat(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return comSimbolo ? `R$ ${valorFormatado}` : valorFormatado;
}

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

      document.getElementById("total-receitas").textContent = formatarValorBR(totalReceitas);
      document.getElementById("total-despesas").textContent = formatarValorBR(totalDespesas);
      document.getElementById("saldo").textContent = formatarValorBR(saldo);

      // NOVO: Calcular total restante das despesas fixas (parcelas não pagas)
      fetch(`/api/despesas_fixas?id_usuario=${usuario.id}`)
        .then((res) => res.json())
        .then((dados) => {
          const totalRestante = dados.reduce((soma, item) => {
            const parcelas = item.parcelas || 1;
            const pagas = item.pagas || 0;
            const restantes = Math.max(parcelas - pagas, 0);
            const valorParcela = parseFloat(item.valor) || 0;
            return soma + (restantes * valorParcela);
          }, 0);

          const campoFixas = document.getElementById("total-fixas");
          if (campoFixas) {
            campoFixas.textContent = totalRestante.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        })
        .catch((erro) => {
          console.error("Erro ao calcular valor restante das despesas fixas:", erro);
        });

      // Gráficos e dados complementares
      renderizarGraficoCategoriasDespesas(despesas);
      renderizarGraficoCategoriasReceitas(receitas);
      renderizarGraficoLinhas(totalReceitas, totalDespesas);
      renderizarGraficoConta(transacoes);
      const hojeBRT = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
      );
      const dataAtual = hojeBRT.toISOString().split("T")[0];
      carregarGraficoSaldosTags(usuario.id, dataAtual);
      carregarTicketsTags();
    });
}

function carregarGraficoSaldosTags(idUsuario, dataAtual) {
  console.log("📅 Enviando dataAtual para API:", dataAtual); // <--- TESTE
  fetch(`/api/tickets_tags?id_usuario=${idUsuario}&data_atual=${dataAtual}`)
    .then((r) => r.json())
    .then((dados) => {
      const labels = dados.map(d => d.tag);
      const valores = dados.map(d => parseFloat(d.saldo) || 0);
      const ticketsHoje = dados.map(d => parseFloat(d.ticket_hoje) || 0);
      const maxValor = Math.max(...valores, 0);

      if (graficoSaldos) graficoSaldos.destroy();

      const pluginTicketHoje = {
        id: 'pluginTicketHoje',
        afterDatasetsDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          ticketsHoje.forEach((ticket, index) => {
            const bar = meta.data[index];
            if (!bar) return;

            const { x, y } = bar.tooltipPosition();
            const cor = ticket < 0 ? '#800000' : ticket === 0 ? '#032F99' : '#086900';

            ctx.save();
            ctx.fillStyle = cor;
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(formatarValorBR(ticket, false), x, y - 5);
            ctx.restore();
          });
        }
      };

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
              offset: 10,
              font: { size: 10, weight: "bold" },
              formatter: valor => formatarValorBR(valor, false)
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { weight: 'bold' } }
            },
            y: {
              beginAtZero: true,
              suggestedMax: maxValor + 20,
              grid: { display: false },
              ticks: { font: { weight: 'bold' } }
            },
          },
        },
        plugins: [ChartDataLabels, pluginTicketHoje],
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
          formatter: (valor, ctx) => `${formatarValorBR(valor, false)} (${porcentagens[ctx.dataIndex]}%)`,
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
          formatter: (valor, ctx) => `${formatarValorBR(valor, false)} (${porcentagens[ctx.dataIndex]}%)`,
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
            return `${formatarValorBR(valor)} (${percent.toFixed(1)}%)`;
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
          formatter: (valor, ctx) => `${formatarValorBR(valor, false)} (${porcentagens[ctx.dataIndex]}%)`,
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

async function carregarTicketsTags() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  try {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split("T")[0];
    const res = await fetch(`/api/tickets_tags?id_usuario=${usuario.id}&data_atual=${dataAtual}`);
    if (!res.ok) {
      const erroTexto = await res.text();
      throw new Error(`Erro do servidor: ${erroTexto}`);
    }

    const dados = await res.json();

    const container = document.createElement("div");
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
          <th>Ticket Base</th>
          <th>Ticket Hoje</th>
          <th>Ticket Ajustado</th>
        </tr>
      </thead>
      <tbody>
        ${dados.map(tag => {
          const ticketHojeNum = parseFloat(tag.ticket_hoje);
          let cor = "#4caf50";
          if (ticketHojeNum === 0) cor = "#2196f3";
          else if (ticketHojeNum < 0) cor = "#f44336";

          return `
            <tr>
              <td>${tag.tag}</td>
              <td>${formatarValorBR(tag.saldo)}</td>
              <td>${formatarValorBR(tag.gasto_hoje)}</td>
              <td>${formatarValorBR(tag.saldo_restante)}</td>
              <td>${tag.dias_restantes}</td>
              <td>${formatarValorBR(tag.ticket_base)}</td>
              <td style="color: ${cor}; font-weight: bold;">${formatarValorBR(ticketHojeNum)}</td>
              <td>${formatarValorBR(tag.ticket_ajustado)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    container.appendChild(tabela);
    document.querySelector("#tabela-ticket-tags").innerHTML = "";
    document.querySelector("#tabela-ticket-tags").appendChild(container);

  } catch (err) {
    console.error("Erro ao carregar tickets por tag:", err);
  }
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

  const mesAtual = String(new Date().getMonth() + 1).padStart(2, "0");
  const campoMes = document.getElementById("mes");
  if (campoMes) campoMes.value = mesAtual;

  const anoAtual = String(new Date().getFullYear());
  const campoAno = document.getElementById("ano");
  if (campoAno) {
    const existe = [...campoAno.options].some(opt => opt.value === anoAtual);
    if (!existe) {
      const nova = document.createElement("option");
      nova.value = anoAtual;
      nova.text = anoAtual;
      campoAno.appendChild(nova);
    }
    campoAno.value = anoAtual;
  }

  carregarResumo();
  carregarTicketsTags();
});

window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("expanded");
};

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "../telas/login.html";
}

function toggleGrafico(botao) {
  const conteudo = botao.nextElementSibling;
  const aberto = conteudo.style.display === "block";

  conteudo.style.display = aberto ? "none" : "block";
  botao.textContent = (aberto ? "▶️" : "🔽") + " " + botao.textContent.slice(2);
}
