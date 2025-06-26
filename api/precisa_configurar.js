export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Método não permitido.");
  }

  const id_usuario = Number(req.query.id_usuario);
  if (!id_usuario) {
    return res.status(400).json({ erro: "ID de usuário ausente." });
  }

  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  try {
    const configResp = await fetch(`${BASE_CONFIG}?q={"id_usuario":${id_usuario}}`);
    if (!configResp.ok) {
      return res.status(500).send("Erro ao consultar configurações.");
    }

    const configData = await configResp.json();
    const configuracoes = configData.items || [];

    const precisaConfigurar = configuracoes.length === 0;
    return res.status(200).json({ precisa_configurar: precisaConfigurar });

  } catch (erro) {
    console.error("❌ Erro na verificação de configuração:", erro);
    return res.status(500).send("Erro interno ao verificar configuração.");
  }
}
