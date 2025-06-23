export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://.../ords/admin/monevo_transacao/";
  const BASE_CONTAS = "https://.../ords/admin/monevo_conta/";
  const BASE_CONFIG = "https://.../ords/admin/monevo_distribuicao_config/";
  const BASE_DISTRIBUICAO = "https://.../ords/admin/monevo_distribuicao_valor/";

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

      // Se for DESPESA com TAG, validar saldo
      if (transacao.tipo === "Despesa" && transacao.tag_distribuicao) {
        const rSaldo = await fetch(BASE_DISTRIBUICAO);
        const jsonSaldo = await rSaldo.json();
        const saldos = jsonSaldo.items.filter(
          s => s.id_usuario === transacao.id_usuario &&
               s.tag_distribuicao === transacao.tag_distribuicao
        );

        const totalDisponivel = saldos.reduce((acc, s) => acc + parseFloat(s.valor_disponivel || 0), 0);

        if (totalDisponivel < transacao.valor) {
          return res.status(400).send("Saldo insuficiente na tag de distribuição.");
        }
      }

      // Registrar transação
      const r = await fetch(BASE_TRANSACOES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transacao),
      });

      if (!r.ok) return res.status(r.status).send("Erro ao registrar transação");

      // Se for RECEITA, distribuir
      if (transacao.tipo === "Receita") {
        const resConfig = await fetch(BASE_CONFIG);
        const jsonConfig = await resConfig.json();
        const configuracoes = jsonConfig.items.filter(c => c.id_usuario === transacao.id_usuario);

        for (const conf of configuracoes) {
          const valorDistribuido = (transacao.valor * conf.porcentagem) / 100;

          const novaDistribuicao = {
            id_usuario: transacao.id_usuario,
            tag_distribuicao: conf.nome_categoria,
            valor_disponivel: valorDistribuido
          };

          await fetch(BASE_DISTRIBUICAO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novaDistribuicao)
          });
        }
      }

      // Se for DESPESA com TAG, registrar valor negativo
      if (transacao.tipo === "Despesa" && transacao.tag_distribuicao) {
        const novoDebito = {
          id_usuario: transacao.id_usuario,
          tag_distribuicao: transacao.tag_distribuicao,
          valor_disponivel: -Math.abs(transacao.valor)
        };

        await fetch(BASE_DISTRIBUICAO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoDebito)
        });
      }

      return res.status(201).send("Transação registrada.");
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      return res.status(500).send("Erro interno ao registrar transação.");
    }
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).send("ID obrigatório.");

    const r = await fetch(BASE_TRANSACOES + id, {
      method: "DELETE"
    });

    return res.status(r.status).end();
  }

  if (req.method === "PUT") {
    const id = req.query.id;
    if (!id) return res.status(400).send("ID obrigatório.");

    const r = await fetch(BASE_TRANSACOES + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    return res.status(r.status).end();
  }

  return res.status(405).send("Método não permitido.");
}
