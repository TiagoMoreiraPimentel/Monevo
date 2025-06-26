export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method !== "GET") {
    return res.status(405).send("Método não permitido.");
  }

  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

  try {
    const r = await fetch(BASE);
    const json = await r.json();
    const configuracoes = (json.items || []).filter(c => c.id_usuario == id_usuario);

    const precisaConfigurar = configuracoes.length === 0;
    return res.status(200).json({ precisa_configurar: precisaConfigurar });
  } catch (err) {
    console.error("Erro ao verificar configuração inicial:", err);
    return res.status(500).send("Erro ao verificar configuração.");
  }
}
