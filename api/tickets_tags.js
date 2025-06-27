export default async function handler(req, res) {
  try {
    const id_usuario = Number(req.query.id_usuario);
    if (!id_usuario) return res.status(400).json({ erro: "ID de usuário ausente." });

    // Pega data enviada do front ou usa data BRT do servidor
    const dataParam = req.query.data_atual;
    const hojeZerado = dataParam
      ? new Date(`${dataParam}T00:00:00-03:00`)
      : new Date(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
    hojeZerado.setHours(0, 0, 0, 0);

    const inicioDia = new Date(hojeZerado);
    const fimDia = new Date(hojeZerado);
    fimDia.setHours(23, 59, 59, 999);

    const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
    const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
    const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

    const diferencaEmDias = (data1, data2) => {
      const umDiaMs = 1000 * 60 * 60 * 24;
      const d1 = new Date(data1.getFullYear(), data1.getMonth(), data1.getDate());
      const d2 = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate());
      return Math.floor((d2 - d1) / umDiaMs);
    };

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
      const diaRenovacao = parseInt(cfg.dia_renovacao);

      const saldoAtual = saldos
        .filter(s => s.tag_distribuicao === tag)
        .reduce((acc, cur) => acc + Number(cur.valor_distribuido), 0);

      const gastoHoje = transacoes
        .filter(t => t.tag_distribuicao === tag)
        .reduce((acc, cur) => acc + Number(cur.valor), 0);

      const saldoOriginal = saldoAtual + gastoHoje;
      const saldoRestante = saldoOriginal - gastoHoje;

      // Protege contra valores inválidos de renovação
      if (isNaN(diaRenovacao) || diaRenovacao < 1 || diaRenovacao > 31) {
        return {
          tag,
          saldo: saldoOriginal.toFixed(2),
          gasto_hoje: gastoHoje.toFixed(2),
          saldo_restante: saldoRestante.toFixed(2),
          dia_renovacao: cfg.dia_renovacao,
          dias_restantes: null,
          ticket_base: saldoOriginal.toFixed(2),
          ticket_hoje: saldoRestante.toFixed(2),
          ticket_ajustado: saldoRestante.toFixed(2)
        };
      }

      let renovacao = new Date(hojeZerado.getFullYear(), hojeZerado.getMonth(), diaRenovacao);
      if (renovacao < hojeZerado) {
        renovacao.setMonth(renovacao.getMonth() + 1);
      }

      const diasRestantes = diferencaEmDias(hojeZerado, renovacao);

      const ticketBase = diasRestantes > 0 ? saldoOriginal / diasRestantes : saldoOriginal;
      const ticketHoje = ticketBase - gastoHoje;
      const ticketAjustado = diasRestantes > 1
        ? saldoRestante / (diasRestantes - 1)
        : saldoRestante;

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
