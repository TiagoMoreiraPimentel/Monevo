export default async function handler(req, res) {
  try {
    const id_usuario = Number(req.query.id_usuario);
    if (!id_usuario) return res.status(400).json({ erro: "ID de usuário ausente." });

    const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
    const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
    const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

    // Buscar configs
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
    const transacoes = (transData.items || []).filter(t => {
      if (t.tipo !== "Despesa" || !t.data_transacao) return false;
      const data = new Date(t.data_transacao);
      return data >= inicioDia && data <= fimDia;
    });

    const resposta = configuracoes.map(cfg => {
      const tag = cfg.nome_categoria;
      const diaRenovacao = cfg.dia_renovacao;

      const hojeDia = new Date().getDate();
      let diasRestantes = diaRenovacao - hojeDia;
      if (diasRestantes < 0) diasRestantes += 30;

      const saldoAtual = saldos
        .filter(s => s.tag_distribuicao === tag)
        .reduce((acc, cur) => acc + Number(cur.valor_distribuido), 0);

      const gastoHoje = transacoes
        .filter(t => t.categoria === tag)
        .reduce((acc, cur) => acc + Number(cur.valor), 0);

      const saldoOriginal = saldoAtual + gastoHoje;
      const saldoRestante = saldoOriginal - gastoHoje;

      const ticketBase = diasRestantes > 0 ? saldoOriginal / diasRestantes : saldoOriginal;
      let ticketHoje = 0;
      let ticketAjustado = ticketBase;

      if (gastoHoje === 0) {
        ticketHoje = ticketBase;
        ticketAjustado = diasRestantes > 1 ? saldoRestante / (diasRestantes - 1) : saldoRestante;
      } else if (gastoHoje >= ticketBase) {
        ticketHoje = 0;
        ticketAjustado = diasRestantes > 1 ? saldoRestante / (diasRestantes - 1) : 0;
      } else {
        ticketHoje = ticketBase - gastoHoje;
        ticketAjustado = ticketBase;
      }

      return {
        tag,
        saldo: saldoOriginal.toFixed(2),
        gasto_hoje: gastoHoje.toFixed(2),
        saldo_restante: saldoRestante.toFixed(2),
        dia_renovacao: diaRenovacao,
        dias_restantes: diasRestantes,
        ticket_base: ticketBase.toFixed(2),
        ticket_hoje: ticketHoje.toFixed(2),
        ticket_ajustado: ticketAjustado.toFixed(2)
      };
    });

    res.status(200).json(resposta);
  } catch (erro) {
    console.error("❌ Erro completo no cálculo de tickets:", erro);
    res.status(500).json({ erro: "Erro ao calcular tickets." });
  }
}
