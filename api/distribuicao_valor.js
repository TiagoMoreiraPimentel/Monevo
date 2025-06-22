export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

    try {
      const response = await fetch(`${BASE}?id_usuario=${id_usuario}`);
      const json = await response.json();
      return res.status(200).json(json.items || []);
    } catch (err) {
      console.error("Erro GET /distribuicao_valor:", err);
      return res.status(500).send("Erro ao buscar valores de distribuição.");
    }
  }

  res.status(405).send("Método não permitido.");
}
