export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_CONTAS = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_DISTRIBUICAO = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";

  if (req.method === "GET") {
    try {
      const { id_usuario, mes, ano } = req.query;

      const resTrans = await fetch(BASE_TRANSACOES);
      const jsonTrans = await resTrans.json();
      const transacoes = jsonTrans.items || [];

      const resContas = await fetch(BASE_CONTAS);
      const jsonContas = await resContas.json();
      const contas = jsonContas.items || [];

      const mapaContas = {};
      contas.forEach(conta => {
        mapaContas[conta.id_conta] = {
          tipo: conta.tipo || "Desconhecida",
          nome: conta.nome_conta || "Conta"
        };
      });

      const transacoesEnriquecidas = transacoes.map(t => ({
        ...t,
        tipo_conta: mapaContas[t.id_conta]?.tipo || "Desconhecida",
        nome_conta: mapaContas[t.id_conta]?.nome || "Conta"
      }));

      const filtradas = transacoesEnriquecidas.filter(t => {
        if (!t.data && !t.data_transacao) return false;
        const data = new Date(t.data || t.data_transacao);
        const mesmoMes = mes ? String(data.getMonth() + 1).padStart(2, "0") === mes : true;
        const mesmoAno = ano ? String(data.getFullYear()) === ano : true;
        const mesmoUsuario = id_usuario ? String(t.id_usuario) === id_usuario : true;
        return mesmoMes && mesmoAno && mesmoUsuario;
      });

      return res.status(200).json(filtradas);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      return res.status(500).send("Erro interno ao buscar transações.");
    }
  }

  if (req.method === "POST") {
    try {
      const transacao = req.body;

      const r = await fetch(BASE_TRANSACOES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transacao),
      });

      if (!r.ok) return res.status(r.status).send("Erro ao registrar transação");

      const resposta = await r.json();
      const idTransacao = resposta.id_transacao;

      // Receita
      if (transacao.tipo === "Receita") {
        const configRes = await fetch(`${BASE_CONFIG}?id_usuario=${transacao.id_usuario}`);
        const configJson = await configRes.json();
        const configuracoes = configJson.items || [];

        for (const conf of configuracoes) {
          const valorDistribuido = (transacao.valor * conf.porcentagem) / 100;
          await fetch(BASE_DISTRIBUICAO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_usuario: transacao.id_usuario,
              tag_distribuicao: conf.nome_categoria,
              valor_distribuido: valorDistribuido,
              id_transacao: idTransacao
            })
          });
        }
      }

      // Despesa
      if (transacao.tipo === "Despesa" && transacao.tag_distribuicao) {
        const tagRes = await fetch(`${BASE_CONFIG}?id_usuario=${transacao.id_usuario}`);
        const tagJson = await tagRes.json();
        const tagsUsuario = tagJson.items.map(t => t.nome_categoria);

        if (!tagsUsuario.includes(transacao.tag_distribuicao)) {
          return res.status(400).send("Tag de distribuição inválida para o usuário.");
        }

        await fetch(BASE_DISTRIBUICAO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_usuario: transacao.id_usuario,
            tag_distribuicao: transacao.tag_distribuicao,
            valor_distribuido: -transacao.valor,
            id_transacao: idTransacao
          })
        });
      }

      return res.status(201).send("Transação registrada e distribuição feita.");
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      return res.status(500).send("Erro interno.");
    }
  }

  const id = req.query.id;
  if (!id) return res.status(400).send("ID obrigatório.");

  if (req.method === "DELETE") {
    try {
      const distRes = await fetch(BASE_DISTRIBUICAO);
      const distJson = await distRes.json();
      const vinculadas = distJson.items.filter(d => d.id_transacao == id);

      for (const d of vinculadas) {
        await fetch(`${BASE_DISTRIBUICAO}${d.id_distribuicao_valor}`, {
          method: "DELETE"
        });
      }

      const r = await fetch(`${BASE_TRANSACOES}${id}`, { method: "DELETE" });
      return res.status(r.status).end();
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      return res.status(500).send("Erro ao excluir transação.");
    }
  }

  res.status(405).send("Método não permitido.");
}
