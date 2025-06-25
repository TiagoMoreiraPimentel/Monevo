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

    // URLs com filtro por usuário
    const urlConfig = `${baseURL}/ords/admin/monevo_distribuicao_config?q={"id_usuario":${id_usuario}}`;
    const urlValor = `${baseURL}/ords/admin/monevo_distribuicao_valor?q={"id_usuario":${id_usuario}}`;
    const urlTransacoes = `${baseURL}/ords/admin/monevo_transacao?q={"id_usuario":${id_usuario},"tipo":"Despesa"}`;

    // Datas para hoje (início e fim do dia)
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDia = new Date(inicioDia);
    fimDia.setDate(inicioDia.getDate() + 1);

    const [configRes, valorRes, transacoesRes] = await Promise.all([
      fetch(urlConfig),
      fetch(urlValor),
      fetch(urlTransacoes),
    ]);

    const [configData, valorData, transacoesData] = await Promise.all([
      configRes.json(),
      valorRes.json(),
      transacoesRes.json(),
    ]);

    const configuracoes = configData.items || [];
    const valores = valorData.items || [];
    const transacoesHoje = (transacoesData.items || []).filter(t => {
      const data = new Date(t.data_transacao);
      return data >= inicioDia && data < fimDia;
    });

    const diasRestantes = 5;

    const resultado = configuracoes.map((conf) => {
      const tag = conf.nome_categoria;
      const valorTag = valores.find(v => v.tag_distribuicao === tag && v.id_usuario == id_usuario);
      const saldo = valorTag ? parseFloat(valorTag.valor_disponivel || 0) : 0;

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria === tag)
        .reduce((soma, t) => soma + parseFloat(t.valor), 0);

      const saldoRestante = saldo - gastoHoje;
      const ticketBase = diasRestantes > 0 ? saldo / diasRestantes : 0;

      // Ticket de hoje é o ticket base menos o que já foi gasto hoje
      const ticketHoje = Math.max(ticketBase - gastoHoje, 0);

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
    console.error("❌ Erro ao carregar tickets por tag:", e);
    return res.status(500).json({ erro: "Erro ao carregar tickets", detalhes: e.message });
  }
}
