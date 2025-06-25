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

    const dataISO = (d) => d.toISOString().split("T")[0];

    const queryTransacoes = {
      id_usuario: Number(id_usuario),
      tipo: "Despesa",
      $and: [
        { data_transacao: { $gte: `DATE'${dataISO(inicioDia)}'` } },
        { data_transacao: { $lt: `DATE'${dataISO(fimDia)}'` } }
      ]
    };
    const urlTransacoesHoje = `${baseURL}/ords/admin/monevo_transacao?q=${encodeURIComponent(JSON.stringify(queryTransacoes))}`;

    const [resConfig, resValor, resTransacoes] = await Promise.all([
      fetch(urlConfig),
      fetch(urlValor),
      fetch(urlTransacoesHoje)
    ]);

    const status = {
      config: resConfig.status,
      valor: resValor.status,
      transacoes: resTransacoes.status,
    };

    if (!resConfig.ok || !resValor.ok || !resTransacoes.ok) {
      return res.status(500).json({ erro: "Falha ao buscar dados", status });
    }

    const [configData, valorData, transacoesData] = await Promise.all([
      resConfig.json(),
      resValor.json(),
      resTransacoes.json()
    ]);

    const configuracoes = configData.items || [];
    const valores = valorData.items || [];
    const transacoesHoje = transacoesData.items || [];

    const resultado = configuracoes.map((conf) => {
      const tag = conf.nome_categoria;

      // Calcula saldo somando todas as distribuições dessa tag
      const saldo = valores
        .filter(v => v.tag_distribuicao === tag && v.id_usuario == id_usuario)
        .reduce((soma, v) => soma + parseFloat(v.valor_distribuido || 0), 0);

      // Total gasto hoje com essa categoria
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
