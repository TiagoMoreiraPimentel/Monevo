export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const idUsuario = req.query.id_usuario;
  if (!idUsuario) {
    return res.status(400).json({ erro: "ID do usuário é obrigatório" });
  }

  try {
    const response = await fetch(`https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/?id_usuario=${idUsuario}`, {
      headers: {
        Authorization: "Basic SEU_TOKEN_BASE64_AQUI",
        "Content-Type": "application/json"
      }
    });

    const dados = await response.json();
    const precisaConfigurar = !dados.items || dados.items.length === 0;

    return res.status(200).json({ precisa_configurar: precisaConfigurar });
  } catch (erro) {
    console.error("Erro ao verificar configuração:", erro);
    return res.status(500).json({ erro: "Erro ao verificar configuração" });
  }
}
