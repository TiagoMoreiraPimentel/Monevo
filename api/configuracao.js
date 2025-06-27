export default async function handler(req, res) {
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).send("id_usuario obrigatório.");
    }

    try {
      const resposta = await fetch(BASE_CONFIG);
      const json = await resposta.json();
      const configuracoes = (json.items || []).filter(c => c.ID_USUARIO == id_usuario);

      return res.status(200).json({ items: configuracoes });
    } catch (error) {
      console.error("❌ Erro ao buscar configurações:", error);
      return res.status(500).send("Erro ao buscar configurações.");
    }
  }

  if (req.method === "POST") {
    const { id_usuario, configuracoes } = req.body;

    if (!id_usuario || !Array.isArray(configuracoes)) {
      return res.status(400).send("Dados inválidos.");
    }

    try {
      // 🔍 Buscar TAGs do usuário
      const resposta = await fetch(BASE_CONFIG);
      const jsonTodas = await resposta.json();
      const antigas = (jsonTodas.items || []).filter(c =>
        c.ID_USUARIO == id_usuario && c.ID_DISTRIBUICAO
      );

      console.log("🔍 Configurações existentes do usuário:", antigas.map(c => ({
        id: c.ID_DISTRIBUICAO,
        nome_categoria: c.NOME_CATEGORIA,
        porcentagem: c.PORCENTAGEM,
        dia_renovacao: c.DIA_RENOVACAO
      })));

      // 🧹 Remover as antigas
      for (const existente of antigas) {
        const deleteUrl = BASE_CONFIG + existente.ID_DISTRIBUICAO;
        console.log("🧨 Removendo ID:", existente.ID_DISTRIBUICAO, "→", deleteUrl);

        const rDelete = await fetch(deleteUrl, { method: "DELETE" });
        console.log("✅ DELETE status:", rDelete.status);
        if (!rDelete.ok) {
          const erro = await rDelete.text();
          console.error("❌ Falha ao deletar ID:", existente.ID_DISTRIBUICAO, "→", erro);
        }
      }

      // 💾 Inserir as novas
      for (const config of configuracoes) {
        const nova = {
          ID_USUARIO: id_usuario,
          NOME_CATEGORIA: config.nome_categoria,
          PORCENTAGEM: config.porcentagem,
          DIA_RENOVACAO: config.dia_renovacao || null
        };

        console.log("🚀 Inserindo nova TAG:", nova);

        const rPost = await fetch(BASE_CONFIG, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nova)
        });

        console.log("✅ POST status:", rPost.status);

        if (!rPost.ok) {
          const erro = await rPost.text();
          console.error("❌ Falha ao inserir TAG:", nova.NOME_CATEGORIA, "→", erro);
        }
      }

      return res.status(201).send("Configurações salvas.");
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error);
      return res.status(500).send("Erro ao salvar configurações.");
    }
  }

  res.status(405).send("Método não permitido.");
}
