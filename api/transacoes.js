export default async function handler(req, res) {
  const BASE_TRANSACOES = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";
  const BASE_CONTAS = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_conta/";

  if (req.method === "GET") {
    try {
      const { id_usuario, mes, ano } = req.query;

      // Busca transações
      const resTrans = await fetch(BASE_TRANSACOES);
      const jsonTrans = await resTrans.json();
      const transacoes = jsonTrans.items || [];

      // Busca contas
      const resContas = await fetch(BASE_CONTAS);
      const jsonContas = await resContas.json();
      const contas = jsonContas.items || [];

      // Cria mapa de contas por id
      const mapaContas = {};
      contas.forEach(conta => {
        mapaContas[conta.id] = {
          tipo: conta.tipo || "Desconhecida",
          nome: conta.nome_conta || "Conta"
        };
      });

      // Enriquecer transações com tipo_conta e nome_conta
      const transacoesEnriquecidas = transacoes.map(t => ({
        ...t,
        tipo_conta: mapaContas[t.id_conta]?.tipo || "Desconhecida",
        nome_conta: mapaContas[t.id_conta]?.nome || "Conta"
      }));

      // Filtrar se solicitado
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
