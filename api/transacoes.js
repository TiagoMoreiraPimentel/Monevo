export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_transacao/";

  if (req.method === "GET") {
    const r = await fetch(BASE);
    const json = await r.json();
    return res.status(200).json(json.items);
  }

  if (req.method === "POST") {
    const dados = req.body;

    // 🔒 Validação de campos obrigatórios
    const camposObrigatorios = ["id_usuario", "id_conta", "tipo", "valor", "data_transacao", "categoria"];
    const faltando = camposObrigatorios.find(campo => !dados[campo] && dados[campo] !== 0);
    if (faltando) {
      return res.status(400).json({ erro: `Campo obrigatório ausente: ${faltando}` });
    }

    // ✅ Formatar a data corretamente se estiver em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dados.data_transacao)) {
      dados.data_transacao += "T00:00:00";
    }

    try {
      const r = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      const texto = await r.text();

      if (!r.ok) {
        return res.status(r.status).send(`Erro do ORDS: ${texto}`);
      }

      return res.status(200).send(texto);
    } catch (err) {
      console.error("Erro no backend:", err);
      return res.status(500).send("Erro interno no servidor.");
    }
  }

  const id = req.query.id;
  if (!id) return res.status(400).send("ID obrigatório.");

  if (req.method === "PUT") {
    const r = await fetch(BASE + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return res.status(r.status).end();
  }

  if (req.method === "DELETE") {
    const r = await fetch(BASE + id, {
      method: "DELETE"
    });
    return res.status(r.status).end();
  }

  res.status(405).send("Método não permitido.");
}
