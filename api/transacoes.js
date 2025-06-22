export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_CONTAS = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";

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

      if (!r.ok) return res.status(r.status).end();

      if (transacao.tipo === "Receita") {
        const rConfig = await fetch(`${BASE_CONFIG}?id_usuario=${transacao.id_usuario}`);
        const config = (await rConfig.json()).items || [];

        for (const item of config) {
          const valorDistribuido = (transacao.valor * item.porcentagem) / 100;

          const rTag = await fetch(`${BASE_VALOR}?id_usuario=${transacao.id_usuario}&tag=${encodeURIComponent(item.nome_categoria)}`);
          const tagExistente = (await rTag.json()).items?.[0];

          if (tagExistente) {
            await fetch(BASE_VALOR + tagExistente.id_distribuicao_valor, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ saldo: tagExistente.saldo + valorDistribuido })
            });
          } else {
            await fetch(BASE_VALOR, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_usuario: transacao.id_usuario,
                tag: item.nome_categoria,
                saldo: valorDistribuido
              })
            });
          }
        }
      }

      if (transacao.tipo === "Despesa" && transacao.tagDistribuicao) {
        const rTag = await fetch(`${BASE_VALOR}?id_usuario=${transacao.id_usuario}&tag=${encodeURIComponent(transacao.tagDistribuicao)}`);
        const tag = (await rTag.json()).items?.[0];

        if (tag && tag.saldo >= transacao.valor) {
          await fetch(BASE_VALOR + tag.id_distribuicao_valor, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ saldo: tag.saldo - transacao.valor })
          });
        } else {
          return res.status(400).send("Saldo insuficiente na tag de distribuição.");
        }
      }

      return res.status(201).end();
    } catch (err) {
      console.error("Erro ao registrar transação:", err);
      return res.status(500).send("Erro ao registrar transação.");
    }
  }

  const id = req.query.id;
  if (!id) return res.status(400).send("ID obrigatório.");

  if (req.method === "PUT") {
    const r = await fetch(BASE_TRANSACOES + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return res.status(r.status).end();
  }

  if (req.method === "DELETE") {
    const r = await fetch(BASE_TRANSACOES + id, {
      method: "DELETE" });
    return res.status(r.status).end();
  }

  res.status(405).send("Método não permitido.");
}
