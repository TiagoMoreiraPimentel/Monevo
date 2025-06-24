export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";
  const { id_usuario } = req.query;

  if (!id_usuario) return res.status(400).send("ID do usuário não informado.");

  try {
    const response = await fetch(`${BASE_URL}?q={"id_usuario":${id_usuario}}`);
    const json = await response.json();
    const dados = json.items || [];

    // Agrupa e consolida valores por tag
    const saldos = dados.reduce((acc, d) => {
      const tag = d.tag_distribuicao || d.nome_categoria;
      const valor = parseFloat(d.valor_disponivel ?? d.valor_distribuido ?? d.VALOR_DISTRIBUIDO ?? 0);

      if (!acc[tag]) acc[tag] = 0;
      acc[tag] += valor;

      return acc;
    }, {});

    // Transforma o objeto em array para retorno
    const resultado = Object.entries(saldos).map(([tag, valor]) => ({
      tag,
      valor
    }));

    res.status(200).json(resultado);
  } catch (e) {
    console.error("Erro ao buscar saldos por tag:", e);
    res.status(500).send("Erro interno.");
  }
}
