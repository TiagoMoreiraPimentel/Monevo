export default {
  async handler(req, res) {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const id_usuario = searchParams.get("id_usuario");

    if (!id_usuario) {
      return res.status(400).json({ erro: "Parâmetro id_usuario é obrigatório." });
    }

    const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
    const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
    const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

    try {
      // Buscar configurações de renovação (dia_renovacao)
      const resConfig = await fetch(`${BASE_CONFIG}?id_usuario=${id_usuario}`);
      const jsonConfig = await resConfig.json();
      const configuracoes = jsonConfig.items || [];

      // Buscar saldos por tag
      const resSaldos = await fetch(`${BASE_VALOR}?id_usuario=${id_usuario}`);
      const jsonSaldos = await resSaldos.json();
      const saldos = jsonSaldos.items || [];

      // Calcular data atual
      const hoje = new Date();
      const dataHoje = hoje.toISOString().split("T")[0];

      // Buscar transações do dia para o usuário
      const resTransacoes = await fetch(`${BASE_TRANSACOES}?id_usuario=${id_usuario}&data_transacao=${dataHoje}`);
      const jsonTransacoes = await resTransacoes.json();
      const transacoes = jsonTransacoes.items || [];

      const resultado = configuracoes.map((conf) => {
        const tag = conf.nome_categoria;
        const dia_renovacao = conf.dia_renovacao;

        const totalTag = saldos
          .filter((s) => s.tag_distribuicao === tag)
          .reduce((soma, item) => soma + (parseFloat(item.valor_distribuido) || 0), 0);

        const gastoHoje = transacoes
          .filter((t) => t.tipo === "Despesa" && t.categoria === tag)
          .reduce((soma, t) => soma + (parseFloat(t.valor) || 0), 0);

        const saldoRestante = totalTag - gastoHoje;

        // Calcular dias restantes até o próximo dia_renovacao
        let proximaRenovacao = new Date(hoje);
        proximaRenovacao.setDate(dia_renovacao);
        if (proximaRenovacao < hoje) {
          proximaRenovacao.setMonth(proximaRenovacao.getMonth() + 1);
        }

        const diasRestantes = Math.max(1, Math.ceil((proximaRenovacao - hoje) / (1000 * 60 * 60 * 24)));

        return {
          tag,
          saldo: totalTag.toFixed(2),
          gasto_hoje: gastoHoje.toFixed(2),
          saldo_restante: saldoRestante.toFixed(2),
          dia_renovacao,
          dias_restantes: diasRestantes,
          ticket_diario: (totalTag / diasRestantes).toFixed(2),
        };
      });

      return res.status(200).json(resultado);
    } catch (erro) {
      console.error("Erro completo no cálculo de tickets:", erro);
      return res.status(500).json({ erro: "Erro ao calcular tickets." });
    }
  },
};
