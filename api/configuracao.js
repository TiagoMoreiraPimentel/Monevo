export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

    try {
      const r = await fetch(`${BASE}?id_usuario=${id_usuario}`);
      const json = await r.json();
      return res.status(200).json(json.items || []);
    } catch (err) {
      console.error("Erro GET:", err);
      return res.status(500).send("Erro ao buscar configurações.");
    }
  }

  if (req.method === "POST") {
    try {
      const r = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      return res.status(r.status).end();
    } catch (err) {
      console.error("Erro POST:", err);
      return res.status(500).send("Erro ao salvar configuração.");
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).send("ID obrigatório para deletar.");

    try {
      const r = await fetch(`${BASE}${id}`, { method: "DELETE" });
      return res.status(r.status).end();
    } catch (err) {
      console.error("Erro DELETE:", err);
      return res.status(500).send("Erro ao deletar configuração.");
    }
  }

  res.status(405).send("Método não permitido.");
}
