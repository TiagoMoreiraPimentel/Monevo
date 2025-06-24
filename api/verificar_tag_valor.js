export default async function handler(req, res) {
  const BASE_VALOR = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_valor/";

  const { id_usuario, tag } = req.query;

  if (!id_usuario || !tag) {
    return res.status(400).send("ID do usuário e nome da tag são obrigatórios.");
  }

  try {
    const response = await fetch(`${BASE_VALOR}?q={"id_usuario":${id_usuario}}`);
    const json = await response.json();
    const dados = json.items || [];

    const existeDistribuicao = dados.some(d => d.tag_distribuicao === tag);

    if (existeDistribuicao) {
      return res.status(200).json({ podeRemover: false, mensagem: "Essa tag possui distribuições vinculadas e não pode ser removida." });
    } else {
      return res.status(200).json({ podeRemover: true });
    }
  } catch (error) {
    console.error("Erro ao verificar tag:", error);
    return res.status(500).send("Erro interno ao verificar a tag.");
  }
}
