// /api/tickets_tags.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { id_usuario } = req.query;
  if (!id_usuario) {
    return res.status(400).json({ erro: "ID do usuário não informado" });
  }

  const urlConfig = `https://<SEU_ORDS>/ords/admin/monevo_distribuicao_config?limit=1000`;
  const urlValor = `https://<SEU_ORDS>/ords/admin/monevo_distribuicao_valor?limit=1000`;
  const urlTransacoesHoje = `https://<SEU_ORDS>/ords/admin/monevo_transacao/?q={"id_usuario":${id_usuario},"tipo":"Despesa"}`;

  try {
    // 1. Buscar as configurações de distribuição
    const [rConfig, rValor] = await Promise.all([
      fetch(urlConfig),
      fetch(urlValor)
    ]);

    const configData = await rConfig.json();
    const valorData = await rValor.json();

    // 2. Filtrar configs e saldos do usuário
    const configTags = configData.items.filter(t => t.id_usuario === parseInt(id_usuario));
    const valoresTags = valorData.items.filter(t => t.id_usuario === parseInt(id_usuario));

    // 3. Buscar despesas de hoje (filtro por TRUNC(DATA_TRANSACAO) = TRUNC(SYSDATE))
    const hoje = new Date();
    const hojeISO = hoje.toISOString().split("T")[0]; // yyyy-mm-dd

    const urlDespesasHoje = `https://<SEU_ORDS>/ords/admin/monevo_transacao/`;
    const queryDespesasHoje = {
      q: {
        id_usuario: parseInt(id_usuario),
        tipo: "Despesa"
      }
    };

    const rDespesasHoje = await fetch(
      `${urlDespesasHoje}?q=${encodeURIComponent(JSON.stringify(queryDespesasHoje))}&limit=1000`
    );
    const transacoesHoje = await rDespesasHoje.json();

    const hojeStr = hoje.toISOString().split("T")[0];

    const transacoesDeHoje = transacoesHoje.items.filter(t => {
      const dataTransacao = new Date(t.data_transacao);
      const dataStr = dataTransacao.toISOString().split("T")[0];
      return dataStr === hojeStr;
    });

    // 4. Calcular tickets
    const resultado = configTags.map(tag => {
      const valor = valoresTags.find(v => v.tag_distribuicao === tag.nome_categoria);
      const saldo = valor ? parseFloat(valor.valor_disponivel) : 0;

      const gastoHoje = transacoesDeHoje
        .filter(t => t.categoria === tag.nome_categoria)
        .reduce((s, t) => s + parseFloat(t.valor), 0);

      const dias_restantes = Math.max(1, Math.ceil((new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1) - hoje) / (1000 * 60 * 60 * 24)));
      const ticket_base = saldo / dias_restantes;
      const ticket_hoje = ticket_base - gastoHoje;

      return {
        tag: tag.nome_categoria,
        saldo: saldo.toFixed(2),
        gasto_hoje: gastoHoje.toFixed(2),
        saldo_restante: (saldo - gastoHoje).toFixed(2),
        dias_restantes,
        ticket_base: ticket_base.toFixed(2),
        ticket_hoje: ticket_hoje.toFixed(2)
      };
    });

    res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao carregar tickets:", erro);
    res.status(500).json({ erro: "Erro ao carregar tickets", detalhes: erro.message });
  }
}
