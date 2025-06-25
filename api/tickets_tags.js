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

    // Formato de data para ORDS: DATE'YYYY-MM-DD'
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataInicio = `DATE'${ano}-${mes}-${dia}'`;
    const dataFimObj = new Date(hoje);
    dataFimObj.setDate(hoje.getDate() + 1);
    const anoFim = dataFimObj.getFullYear();
    const mesFim = String(dataFimObj.getMonth() + 1).padStart(2, "0");
    const diaFim = String(dataFimObj.getDate()).padStart(2, "0");
    const dataFim = `DATE'${anoFim}-${mesFim}-${diaFim}'`;

    const urlConfig = `${baseURL}/ords/admin/monevo_distribuicao_config?q={"id_usuario":${id_usuario}}`;
    const urlValor = `${baseURL}/ords/admin/monevo_distribuicao_valor?q={"id_usuario":${id_usuario}}`;

    const urlTransacoesHoje = `${baseURL}/ords/admin/monevo_transacao?limit=1000&q={
      "id_usuario": ${id_usuario},
      "tipo": "Despesa",
      "$and": [
        {"data_transacao": { "$gte": ${dataInicio} }},
        {"data_transacao": { "$lt": ${dataFim} }}
      ]
    }`.replace(/\s+/g, ""); // remove quebras para URL

    const [configRes, valorRes, transacoesRes] = await Promise.all([
      fetch(urlConfig),
      fetch(urlValor),
      fetch(urlTransacoesHoje),
    ]);

    const [configData, valorData, transacoesData] = await Promise.all([
      configRes.json(),
      valorRes.json(),
      transacoesRes.json(),
    ]);

    const configuracoes = configData.items || [];
    const valores = valorData.items || [];
    const transacoesHoje = transacoesData.items || [];

    const diasRestantes = 5;

    const resultado = configuracoes.map((conf) => {
      const tag = conf.nome_categoria;
      const valorTag = valores.find(v => v.tag_distribuicao === tag && v.id_usuario == id_usuario);
      const saldo = valorTag ? parseFloat(valorTag.valor_disponivel || 0) : 0;

      const gastoHoje = transacoesHoje
        .filter(t => t.categoria === tag)
        .reduce((soma, t) => soma + parseFloat(t.valor || 0), 0);

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
