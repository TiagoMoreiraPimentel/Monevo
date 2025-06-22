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
        nome_conta: mapaContas[t.id_conta]?.nome || "Conta",
        data: t.data_transacao || t.data_transacao
      }));

      const filtradas = transacoesEnriquecidas.filter(t => {
        const data = new Date(t.data);
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
      const valorNumerico = parseFloat(valor);

      const bodyLimpo = {
        ID_USUARIO: body.id_usuario,
        ID_CONTA: body.id_conta,
        TIPO: body.tipo,
        VALOR: valorNumerico,
        DATA_TRANSACAO: body.data,
        CATEGORIA: body.categoria,
        DESCRICAO: body.descricao
      };

      if (tipo === "Despesa") {
        if (!tag_distribuicao || tag_distribuicao.trim() === "") {
          return res.status(400).send("Tag de distribuição não informada.");
        }

        // Validação da existência da tag
        const rConfig = await fetch(`${BASE_CONFIG}?id_usuario=${id_usuario}`);
        const configJson = await rConfig.json();
        const configTags = configJson.items || [];
        const tagExiste = configTags.some(t =>
          t.nome_categoria?.toLowerCase().trim() === tag_distribuicao.toLowerCase().trim()
        );

        if (!tagExiste) {
          return res.status(400).send("Tag de distribuição não encontrada.");
        }

        // Verifica se a tag existe na tabela de valores
        const rCheck = await fetch(`${BASE_DISTRIBUICAO}?id_usuario=${id_usuario}`);
        const checkJson = await rCheck.json();
        let tag = checkJson.items?.find(t =>
          t.TAG_DISTRIBUICAO?.toLowerCase().trim() === tag_distribuicao.toLowerCase().trim()
        );

        if (!tag) {
          const payloadNova = {
            ID_USUARIO: id_usuario,
            TAG_DISTRIBUICAO: tag_distribuicao,
            VALOR_DISPONIVEL: 0
          };

          const novaTagResp = await fetch(BASE_DISTRIBUICAO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadNova)
          });

          if (!novaTagResp.ok) {
            return res.status(400).send("Erro ao criar tag de distribuição.");
          }

          const novaTag = await novaTagResp.json();
          tag = novaTag;
        }

        if (!tag) {
          return res.status(400).send("Tag de distribuição ainda não localizada.");
        }

        const saldoDisponivel = parseFloat(tag.VALOR_DISPONIVEL);
        if (saldoDisponivel < valorNumerico) {
          return res.status(400).send("Saldo insuficiente na tag.");
        }

        await fetch(`${BASE_DISTRIBUICAO}${tag.ID_DISTRIBUICAO_VALOR}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ID_USUARIO: id_usuario,
            TAG_DISTRIBUICAO: tag_distribuicao,
            VALOR_DISPONIVEL: saldoDisponivel - valorNumerico
          })
        });

        bodyLimpo.TAG_DISTRIBUICAO = tag_distribuicao;
      }

      const r = await fetch(BASE_TRANSACOES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyLimpo)
      });

      if (!r.ok) {
        const erro = await r.text();
        console.error("Erro ao registrar transação:", erro);
        return res.status(r.status).send(erro);
      }

      // Distribuição automática da receita
      if (tipo === "Receita") {
        const rConfig = await fetch(`${BASE_CONFIG}?id_usuario=${id_usuario}`);
        const configJson = await rConfig.json();
        const configuracoes = configJson.items || [];

        for (const config of configuracoes) {
          const { nome_categoria, porcentagem } = config;
          const valorDistribuir = (valorNumerico * porcentagem) / 100;

          const rCheck = await fetch(`${BASE_DISTRIBUICAO}?id_usuario=${id_usuario}`);
          const checkJson = await rCheck.json();
          const tags = checkJson.items || [];

          const existente = tags.find(t =>
            t.TAG_DISTRIBUICAO?.toLowerCase().trim() === nome_categoria.toLowerCase().trim()
          );

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

      return res.status(201).end();
    } catch (err) {
      console.error("Erro ao registrar transação:", err);
      return res.status(500).send("Erro interno ao registrar transação.");
    }
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).send("ID obrigatório.");

    try {
      const rTransacao = await fetch(BASE_TRANSACOES + id);
      const t = await rTransacao.json();

      if (t.tipo === "Despesa" && t.tag_distribuicao) {
        const rCheck = await fetch(`${BASE_DISTRIBUICAO}?id_usuario=${t.id_usuario}`);
        const checkJson = await rCheck.json();
        const tag = (checkJson.items || []).find(x =>
          x.TAG_DISTRIBUICAO?.toLowerCase().trim() === t.tag_distribuicao.toLowerCase().trim()
        );
        if (tag) {
          const novoValor = parseFloat(tag.VALOR_DISPONIVEL) + parseFloat(t.valor);
          await fetch(`${BASE_DISTRIBUICAO}${tag.ID_DISTRIBUICAO_VALOR}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ID_USUARIO: t.id_usuario,
              TAG_DISTRIBUICAO: t.tag_distribuicao,
              VALOR_DISPONIVEL: novoValor
            })
          });
        }
      }

      const r = await fetch(BASE_TRANSACOES + id, {
        method: "DELETE"
      });

      return res.status(r.status).end();
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      return res.status(500).send("Erro ao excluir transação.");
    }
  }

  res.status(405).send("Método não permitido.");
}
