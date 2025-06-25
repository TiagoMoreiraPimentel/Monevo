export default async function handler(req, res) {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

  const BASE_CONFIG = "https://.../ords/admin/monevo_distribuicao_config/";
  const BASE_VALOR = "https://.../ords/admin/monevo_distribuicao_valor/";
  const BASE_TRANSACOES = "https://.../ords/admin/monevo_transacao/";

  try {
    console.log("Calculando tickets para ID:", id_usuario);

    // 1. Buscar configurações de TAGs
    console.log("Buscando configurações...");
    const rConfig = await fetch(BASE_CONFIG);
    const configJson = await rConfig.json();
    const configUsuario = (configJson.items || []).filter(c => c.id_usuario == id_usuario);
    console.log("Configurações recebidas:", configUsuario);

    // 2. Buscar saldos por TAG
    console.log("Buscando saldos de TAGs...");
    const rValor = await fetch(BASE_VALOR);
    const valorJson = await rValor.json();
    const saldosUsuario = (valorJson.items || []).filter(v => v.id_usuario == id_usuario);
    console.log("Saldos recebidos:", saldosUsuario);

    // 3. Buscar transações do dia
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0]; // YYYY-MM-DD
    const queryTransacoes = `?q={"id_usuario":${id_usuario},"tipo":"Despesa","DATA_TRANSACAO":"${hojeStr}"}`;

    console.log("Buscando transações de hoje:", queryTransacoes);
    const rTrans = await fetch(BASE_TRANSACOES + queryTransacoes);
    const transJson = await rTrans.json();
    const transacoesHoje = transJson.items || [];
    console.log("Transações de hoje:", transacoesHoje);

    // 4. Processar tickets
    const resultado = configUsuario.map(conf => {
      const tag = conf.nome_categoria;
      const diaRenovacao = parseInt(conf.dia_renovacao);

      if (!diaRenovacao || isNaN(diaRenovacao)) {
        return { tag, erro: "Dia de renovação não definido." };
      }

      const saldoObj = saldosUsuario.find(s => s.tag_distribuicao?.toLowerCase() === tag.toLowerCase());
      const saldo = parseFloat(saldoObj?.valor_disponivel || 0);

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria?.toLowerCase() === tag.toLowerCase())
        .reduce((soma, t) => soma + parseFloat(t.valor || 0), 0);

      const saldoRestante = saldo - gastoHoje;

      // Calcular dias restantes até próximo ciclo
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

    console.log("Resultado final:", resultado);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("Erro completo no cálculo de tickets:", err);
    return res.status(500).send("Erro ao calcular tickets.");
  }
}
