// Novo endpoint: /api/distribuicao_valor_config.js
export default async function handler(req, res) {
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method !== "GET") {
    return res.status(405).send("Método não permitido");
  }

  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).send("ID do usuário é obrigatório");

  try {
    const r = await fetch(BASE_CONFIG);
    const json = await r.json();
    const categorias = (json.items || [])
      .filter(i => i.id_usuario == id_usuario)
      .map(i => i.nome_categoria);

    const unicas = [...new Set(categorias)];

    return res.status(200).json(unicas);
  } catch (error) {
    console.error("Erro ao buscar categorias de distribuição:", error);
    return res.status(500).send("Erro interno ao buscar categorias");
  }
}
