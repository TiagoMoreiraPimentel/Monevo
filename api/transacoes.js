export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_CONTAS = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";

  if (req.method === "GET") {
    try {
      const { id_usuario, mes, ano } = req.query;

      // Busca todas as transações
      const rTrans = await fetch(BASE_TRANSACOES);
      const jsonTrans = await rTrans.json();
      const transacoes = jsonTrans.items || [];

      // Busca todas as contas para mapear tipo_conta
      const rContas = await fetch(BASE_CONTAS);
      const jsonContas = await rContas.json();
      const contas = jsonContas.items || [];

      const mapaContas = {};
      contas.forEach(conta => {
        mapaContas[conta.id] = conta.tipo || "Desconhecida";
      });

      // Enriquecer cada transação com tipo_conta
      const transacoesEnriquecidas = transacoes.map(t => ({
        ...t,
        tipo_conta: mapaContas[t.id_conta] || "Desconhecida"
      }));

      // Filtrar por mês, ano e id_usuario
      const filtradas = transacoesEnriquecidas.filter(t => {
        if (!t.data) return false;
        const data = new Date(t.data);
        const mesmoMes = mes ? String(data.getMonth() + 1).padStart(2, "0") === mes : true;
        const mesmoAno = ano ? String(data.getFullYear()) === ano : true;
        const mesmoUsuario = id_usuario ? String(t.id_usuario) === id_usuario : true;
        return mesmoMes && mesmoAno && mesmoUsuario;
      });

      return res.status(200).json(filtradas);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      return res.status(500).send("Erro interno no servidor.");
    }
  }

  if (req.method === "POST") {
    const r = await fetch(BASE_TRANSACOES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    return res.status(r.status).end();
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
      method: "DELETE"
    });
    return res.status(r.status).end();
  }

  res.status(405).send("Método não permitido.");
}
