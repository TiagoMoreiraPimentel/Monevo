export default async function handler(req, res) {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

  const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

  try {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0]; // YYYY-MM-DD

    // Buscar saldos por TAG
    const rValor = await fetch(BASE_VALOR);
    const valorJson = await rValor.json();
    const saldos = (valorJson.items || []).filter(v => v.id_usuario == id_usuario);

    // Buscar config (para pegar dia de renovação por TAG)
    const rConfig = await fetch(BASE_CONFIG);
    const configJson = await rConfig.json();
    const config = (configJson.items || []).filter(c => c.id_usuario == id_usuario);

    // Buscar transações do dia
    const queryTransacoes = `?q={"id_usuario":${id_usuario},"tipo":"Despesa","data_transacao":"${hojeStr}"}`;
    const rTrans = await fetch(BASE_TRANSACOES + queryTransacoes);
    const transJson = await rTrans.json();
    const transacoesHoje = transJson.items || [];

    const resultado = saldos.map(tagObj => {
      const tag = tagObj.tag_distribuicao;
      const saldo = parseFloat(tagObj.valor_disponivel || 0);

      // Buscar configuração correspondente
      const conf = config.find(c => c.nome_categoria?.toLowerCase() === tag.toLowerCase());
      const diaRenovacao = parseInt(conf?.dia_renovacao);

      if (!conf || isNaN(diaRenovacao)) {
        return { tag, erro: "Dia de renovação não definido." };
      }

      // Gasto hoje para essa TAG
      const gastoHoje = transacoesHoje
        .filter(t => t.categoria?.toLowerCase() === tag.toLowerCase())
        .reduce((soma, t) => soma + parseFloat(t.valor || 0), 0);

      const saldoRestante = saldo - gastoHoje;

      // Calcular dias restantes até próxima renovação
      const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      let dataFim = new Date(hojeData);

      if (hoje.getDate() < diaRenovacao) {
        dataFim.setDate(diaRenovacao);
      } else {
        dataFim.setMonth(dataFim.getMonth() + 1);
        dataFim.setDate(diaRenovacao);
      }

      const diffDias = Math.ceil((dataFim - hojeData) / (1000 * 60 * 60 * 24));
      const diasRestantes = Math.max(1, diffDias);

      const ticket = saldoRestante / diasRestantes;

      return {
        tag,
        saldo: saldo.toFixed(2),
        gasto_hoje: gastoHoje.toFixed(2),
        saldo_restante: saldoRestante.toFixed(2),
        dia_renovacao: diaRenovacao,
        dias_restantes: diasRestantes,
        ticket_diario: ticket.toFixed(2)
      };
    });

    return res.status(200).json(resultado);

  } catch (err) {
    console.error("Erro completo no cálculo de tickets:", err);
    return res.status(500).send("Erro ao calcular tickets.");
  }
}
