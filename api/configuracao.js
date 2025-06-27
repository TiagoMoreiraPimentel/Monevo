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
      const configuracoes = (json.items || []).filter(c => c.id_usuario == id_usuario);

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
      // 🔍 Buscar todas as TAGs
      const resposta = await fetch(BASE_CONFIG);
      const todas = await resposta.json();
      const antigas = (todas.items || []).filter(c => c.id_usuario == id_usuario && c.id_distribuicao);

      console.log("📦 Configurações antigas encontradas:", antigas.map(t => ({
        id: t.id_distribuicao,
        nome: t.nome_categoria
      })));

      // 🧹 Remover as antigas
      for (const existente of antigas) {
        const deleteUrl = BASE_CONFIG + existente.id_distribuicao;
        console.log("🧨 Removendo:", deleteUrl);
        await fetch(deleteUrl, { method: "DELETE" });
      }

      // 💾 Inserir novas configurações
      for (const config of configuracoes) {
        const nova = {
          id_usuario,
          nome_categoria: config.nome_categoria,
          porcentagem: config.porcentagem,
          dia_renovacao: config.dia_renovacao || null
        };

        console.log("🚀 Inserindo nova TAG:", nova);

        const response = await fetch(BASE_CONFIG, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nova)
        });

        if (!response.ok) {
          const erroDetalhado = await response.text();
          console.error("❌ Erro ao inserir:", nova, "->", erroDetalhado);
        }
      }

      return res.status(201).send("Configurações salvas com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error);
      return res.status(500).send("Erro ao salvar configurações.");
    }
  }

  res.status(405).send("Método não permitido.");
}
