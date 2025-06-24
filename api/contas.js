export default async function handler(req, res) {
  const BASE_CONTA = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";
  const BASE_TAG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";
  const BASE_TRANSACAO = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";

  if (req.method === "GET") {
    const r = await fetch(BASE_CONTA);
    const json = await r.json();
    return res.status(200).json(json.items);
  }

  if (req.method === "POST") {
    const novaConta = req.body;

    const r = await fetch(BASE_CONTA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaConta)
    });

    const dados = await r.json();

    if (r.status === 201 && novaConta.TIPO === "Poupança" && novaConta.ID_USUARIO) {
      const novaTag = {
        id_usuario: novaConta.ID_USUARIO,
        nome_categoria: "Poupança",
        percentual: 0
      };

      await fetch(BASE_TAG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTag)
      });
    }

    return res.status(r.status).json(dados);
  }

  const id = req.query.id;
  if (!id) return res.status(400).send("ID obrigatório.");

  if (req.method === "PUT") {
    const r = await fetch(BASE_CONTA + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return res.status(r.status).end();
  }

  if (req.method === "DELETE") {
    try {
      // Buscar dados da conta
      const resConta = await fetch(BASE_CONTA + id);
      const conta = await resConta.json();

      if (!conta || !conta.tipo || conta.tipo !== "Poupança") {
        const r = await fetch(BASE_CONTA + id, { method: "DELETE" });
        return res.status(r.status).end();
      }

      const idUsuario = conta.id_usuario;

      // Verifica se existem transações associadas
      const resTrans = await fetch(BASE_TRANSACAO);
      const transacoes = (await resTrans.json()).items || [];
      const vinculadas = transacoes.filter(t => t.id_conta == id);
      if (vinculadas.length > 0) {
        return res.status(400).send("Não é possível excluir: existem transações associadas a esta conta Poupança.");
      }

      // Verifica se há valor disponível na TAG "Poupança"
      const resValor = await fetch(`${BASE_VALOR}?id_usuario=${idUsuario}`);
      const valores = (await resValor.json()).items || [];
      const tag = valores.find(v => v.tag_distribuicao === "Poupança");
      if (tag && tag.valor_disponivel > 0) {
        return res.status(400).send("Não é possível excluir: há saldo disponível na TAG 'Poupança'.");
      }

      // Exclui conta
      await fetch(BASE_CONTA + id, { method: "DELETE" });

      // Exclui TAG "Poupança"
      const resTags = await fetch(`${BASE_TAG}?id_usuario=${idUsuario}`);
      const tags = (await resTags.json()).items || [];
      const tagPoupanca = tags.find(t => t.nome_categoria === "Poupança");

      if (tagPoupanca) {
        await fetch(`${BASE_TAG}${tagPoupanca.id_distribuicao}`, { method: "DELETE" });
      }

      return res.status(200).send("Conta e TAG 'Poupança' excluídas com sucesso.");
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      return res.status(500).send("Erro interno ao excluir conta.");
    }
  }

  res.status(405).send("Método não permitido.");
}
