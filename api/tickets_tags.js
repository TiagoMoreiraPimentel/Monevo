// /api/tickets_tags.js

import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { id_usuario } = req.query;
  if (!id_usuario) {
    return res.status(400).json({ erro: "ID do usuário é obrigatório" });
  }

  try {
    const baseURL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com";

    const urlConfig = `${baseURL}/ords/admin/monevo_distribuicao_config?q={"id_usuario":${id_usuario}}`;
    const urlValor = `${baseURL}/ords/admin/monevo_distribuicao_valor?q={"id_usuario":${id_usuario}}`;

    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDia = new Date(inicioDia);
    fimDia.setDate(fimDia.getDate() + 1);

    const formatData = (d) => d.toISOString().split("T")[0];

    const urlTransacoesHoje = `${baseURL}/ords/admin/monevo_transacao?q=${encodeURIComponent(JSON.stringify({
      id_usuario: Number(id_usuario),
      tipo: "Despesa",
      $and: [
        { data_transacao: { $gte: `DATE'${formatData(inicioDia)}'` } },
        { data_transacao: { $lt: `DATE'${formatData(fimDia)}'` } }
      ]
    }))}`;

    // 🔍 Logs de depuração
    console.log("[URL Config]", urlConfig);
    console.log("[URL Valor]", urlValor);
    console.log("[URL Transações Hoje]", urlTransacoesHoje);

    const [configRes, valorRes, transacoesRes] = await Promise.all([
      fetch(urlConfig),
      fetch(urlValor),
      fetch(urlTransacoesHoje),
    ]);

    // 📡 Checar status HTTP
    console.log("[Status Config]", configRes.status);
    console.log("[Status Valor]", valorRes.status);
    console.log("[Status Transações]", transacoesRes.status);

    if (!configRes.ok || !valorRes.ok || !transacoesRes.ok) {
      return res.status(500).json({ erro: "Falha ao buscar dados", status: {
        config: configRes.status,
        valor: valorRes.status,
        transacoes: transacoesRes.status
      }});
    }

    const [configData, valorData, transacoesData] = await Promise.all([
      configRes.json(),
      valorRes.json(),
      transacoesRes.json(),
    ]);

    const configuracoes = configData.items;
    const valores = valorData.items;
    const transacoesHoje = transacoesData.items;

    const resultado = configuracoes.map((conf) => {
      const tag = conf.nome_categoria;
      const percentual = parseFloat(conf.porcentagem || 0);
      const valorTag = valores.find(v => v.tag_distribuicao === tag && v.id_usuario == id_usuario);
      const saldo = valorTag ? parseFloat(valorTag.valor_distribuido || 0) : 0;

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria === tag)
        .reduce((soma, t) => soma + parseFloat(t.valor), 0);

      const diasRestantes = 5;
      const saldoRestante = saldo - gastoHoje;
      const ticketBase = diasRestantes > 0 ? saldo / diasRestantes : 0;
      const ticketHoje = diasRestantes > 0 ? saldoRestante / diasRestantes : 0;

      return {
        tag,
        saldo: saldo.toFixed(2),
        gasto_hoje: gastoHoje.toFixed(2),
        saldo_restante: saldoRestante.toFixed(2),
        dias_restantes: diasRestantes,
        ticket_base: ticketBase.toFixed(2),
        ticket_hoje: ticketHoje.toFixed(2),
      };
    });

    return res.status(200).json(resultado);

  } catch (e) {
    console.error("Erro ao carregar tickets por tag:", e);
    return res.status(500).json({ erro: "Erro ao carregar tickets", detalhes: e.message });
  }
}
