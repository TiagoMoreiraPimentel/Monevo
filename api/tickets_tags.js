export default async function handler(req, res) {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ erro: "id_usuario obrigatório." });

  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

  try {
    console.log("🔍 Iniciando cálculo de tickets para ID:", id_usuario);

    const [rConfig, rValor] = await Promise.all([
      fetch(BASE_CONFIG),
      fetch(BASE_VALOR)
    ]);

    if (!rConfig.ok || !rValor.ok) {
      throw new Error(`Erro nas requisições: config=${rConfig.status}, valor=${rValor.status}`);
    }

    const configJson = await rConfig.json();
    const valorJson = await rValor.json();

    const configUsuario = (configJson.items || []).filter(c => c.id_usuario == id_usuario);
    const saldosUsuario = (valorJson.items || []).filter(v => v.id_usuario == id_usuario);

    console.log("✅ Configurações:", configUsuario);
    console.log("✅ Saldos:", saldosUsuario);

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const queryTransacoes = `?q={"id_usuario":${id_usuario},"tipo":"Despesa","data_transacao":"${hojeStr}"}`;
    const rTrans = await fetch(BASE_TRANSACOES + queryTransacoes);

    if (!rTrans.ok) {
      const erroTexto = await rTrans.text();
      console.error("❌ Erro ao buscar transações:", erroTexto);
      throw new Error(`Erro ao buscar transações: ${rTrans.status}`);
    }

    const transJson = await rTrans.json();
    const transacoesHoje = transJson.items || [];

    const resultado = configUsuario.map(conf => {
      const tag = conf.nome_categoria;
      const diaRenovacao = parseInt(conf.dia_renovacao);

      const saldoObj = saldosUsuario.find(s => s.tag_distribuicao?.toLowerCase() === tag.toLowerCase());
      const saldo = parseFloat(saldoObj?.valor_disponivel || 0);

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria?.toLowerCase() === tag.toLowerCase())
        .reduce((soma, t) => soma + parseFloat(t.valor || 0), 0);

      const saldoRestante = saldo - gastoHoje;

      const hojeDia = hoje.getDate();
      const hojeMes = hoje.getMonth();
      const hojeAno = hoje.getFullYear();

      let dataFim;
      if (hojeDia < diaRenovacao) {
        dataFim = new Date(hojeAno, hojeMes, diaRenovacao);
      } else {
        dataFim = new Date(hojeAno, hojeMes + 1, diaRenovacao);
      }

      const diffMs = dataFim - hoje;
      const diasRestantes = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

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

    console.log("✅ Resultado final:", resultado);
    return res.status(200).json(resultado);

  } catch (err) {
    console.error("❌ Erro completo no cálculo de tickets:", err);
    return res.status(500).json({ erro: "Erro ao calcular tickets." });
  }
}
