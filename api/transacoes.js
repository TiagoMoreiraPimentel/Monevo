export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_DISTRIBUICAO = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
  const BASE_CONTAS = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";

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
      const body = req.body;
      const { tipo, valor, id_usuario, tag_distribuicao } = body;

      if (tipo === "Despesa") {
        if (!tag_distribuicao) {
          return res.status(400).send("Tag de distribuição obrigatória para despesas.");
        }

        const rTags = await fetch(`${BASE_DISTRIBUICAO}?id_usuario=${id_usuario}`);
        const tagsJson = await rTags.json();
        const tags = tagsJson.items || [];
        const tag = tags.find(t => t.TAG_DISTRIBUICAO === tag_distribuicao);

        if (!tag) {
          return res.status(400).send("Tag de distribuição não encontrada.");
        }

        const valorAtual = parseFloat(tag.VALOR_DISPONIVEL);
        const novoValor = valorAtual - valor;

        if (novoValor < 0) {
          return res.status(400).send("Saldo insuficiente na tag.");
        }

        await fetch(`${BASE_DISTRIBUICAO}${tag.ID_DISTRIBUICAO_VALOR}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ID_USUARIO: id_usuario,
            TAG_DISTRIBUICAO: tag_distribuicao,
            VALOR_DISPONIVEL: novoValor
          })
        });
      }

      // Salvar transação com tag_distribuicao
      const payloadTransacao = {
        ...body,
        tag_distribuicao: tipo === "Receita" ? null : tag_distribuicao
      };

      const r = await fetch(BASE_TRANSACOES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadTransacao)
      });

      if (tipo === "Receita") {
        const rConfig = await fetch(`${BASE_CONFIG}?id_usuario=${id_usuario}`);
        const configJson = await rConfig.json();
        const configuracoes = configJson.items || [];

        for (const config of configuracoes) {
          const { nome_categoria, porcentagem } = config;
          const valorDistribuir = (valor * porcentagem) / 100;

          const rCheck = await fetch(`${BASE_DISTRIBUICAO}?id_usuario=${id_usuario}`);
          const checkJson = await rCheck.json();
          const tags = checkJson.items || [];

          const existente = tags.find(t => t.TAG_DISTRIBUICAO === nome_categoria);

          if (existente) {
            const novoValor = parseFloat(existente.VALOR_DISPONIVEL) + valorDistribuir;

            await fetch(`${BASE_DISTRIBUICAO}${existente.ID_DISTRIBUICAO_VALOR}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ID_USUARIO: id_usuario,
                TAG_DISTRIBUICAO: nome_categoria,
                VALOR_DISPONIVEL: novoValor
              })
            });
          } else {
            await fetch(BASE_DISTRIBUICAO, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ID_USUARIO: id_usuario,
                TAG_DISTRIBUICAO: nome_categoria,
                VALOR_DISPONIVEL: valorDistribuir
              })
            });
          }
        }
      }

      return res.status(r.status).end();
    } catch (err) {
      console.error("Erro ao registrar transação:", err);
      return res.status(500).send("Erro interno ao registrar transação.");
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
