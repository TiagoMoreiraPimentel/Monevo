export default async function handler(req, res) {
  try {
    const id_usuario = Number(req.query.id_usuario);
    if (!id_usuario) return res.status(400).json({ erro: "ID de usuário ausente." });

    const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
    const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
    const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // Buscar configurações
    const configResp = await fetch(`${BASE_CONFIG}?q={"id_usuario":${id_usuario}}`);
    const configData = await configResp.json();
    const configuracoes = configData.items || [];

    // Buscar saldos
    const valorResp = await fetch(`${BASE_VALOR}?q={"id_usuario":${id_usuario}}`);
    const valorData = await valorResp.json();
    const saldos = valorData.items || [];

    // Buscar transações do dia
    const transResp = await fetch(`${BASE_TRANSACOES}?q={"id_usuario":${id_usuario}}`);
    const transData = await transResp.json();
    const transacoesHoje = (transData.items || []).filter(t => {
      if (!t.data_transacao || t.tipo !== "Despesa") return false;
      const data = new Date(t.data_transacao);
      return (
        data.getFullYear() === hoje.getFullYear() &&
        data.getMonth() === hoje.getMonth() &&
        data.getDate() === hoje.getDate()
      );
    });

    const resposta = configuracoes.map(cfg => {
      const tag = cfg.nome_categoria;
      const diaRenovacao = cfg.dia_renovacao;

      const saldoTotal = saldos
        .filter(s => s.tag_distribuicao === tag)
        .reduce((acc, cur) => acc + Number(cur.valor_distribuido), 0);

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria === tag)
        .reduce((acc, cur) => acc + Number(cur.valor), 0);

      const saldoRestante = saldoTotal - gastoHoje;

      const proximaRenovacao = new Date(hoje);
      proximaRenovacao.setDate(diaRenovacao);
      if (proximaRenovacao < hoje) proximaRenovacao.setMonth(proximaRenovacao.getMonth() + 1);

      const diffMs = proximaRenovacao - hoje;
      const diasRestantes = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const ticketBase = saldoTotal / diasRestantes;
      const ticketHoje = Math.max(ticketBase - gastoHoje, 0);

      console.log(`📌 Tag: ${tag}, Saldo: ${saldoTotal}, GastoHoje: ${gastoHoje}, DiasRestantes: ${diasRestantes}, TicketBase: ${ticketBase.toFixed(2)}, TicketHoje: ${ticketHoje.toFixed(2)}`);

      return {
        tag,
        saldo: saldoTotal.toFixed(2),
        gasto_hoje: gastoHoje.toFixed(2),
        saldo_restante: saldoRestante.toFixed(2),
        dia_renovacao: diaRenovacao,
        dias_restantes: diasRestantes,
        ticket_diario: ticketHoje.toFixed(2)
      };
    });

    res.status(200).json(resposta);
  } catch (erro) {
    console.error("❌ Erro completo no cálculo de tickets:", erro);
    res.status(500).json({ erro: "Erro ao calcular tickets." });
  }
}
