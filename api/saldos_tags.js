export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
  const { id_usuario } = req.query;

  if (!id_usuario) return res.status(400).send("ID do usuário não informado.");

  try {
    const response = await fetch(`${BASE_URL}?q={"id_usuario":${id_usuario}}`);
    const json = await response.json();
    const dados = json.items || [];

    const resultado = dados.map(d => ({
      tag: d.tag_distribuicao || d.nome_categoria,
      valor: parseFloat(d.valor_disponivel ?? d.valor_distribuido ?? d.VALOR_DISTRIBUIDO ?? 0)
    }));

    res.status(200).json(resultado);
  } catch (e) {
    console.error("Erro ao buscar saldos por tag:", e);
    res.status(500).send("Erro interno.");
  }
}
