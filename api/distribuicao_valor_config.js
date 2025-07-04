export default async function handler(req, res) {
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).send("ID do usuário não informado.");
    }

    try {
      const resposta = await fetch(BASE_CONFIG);
      const json = await resposta.json();
      const configuracoes = json.items.filter(c => c.id_usuario == id_usuario);

      return res.status(200).json(configuracoes);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      return res.status(500).send("Erro ao buscar configurações.");
    }
  }

  if (req.method === "POST") {
    const { id_usuario, configuracoes } = req.body;

    if (!id_usuario || !Array.isArray(configuracoes)) {
      return res.status(400).send("Dados inválidos.");
    }

    try {
      // Apaga as configurações existentes do usuário
      const todas = await fetch(BASE_CONFIG).then(r => r.json());
      const existentes = todas.items.filter(c => c.id_usuario == id_usuario);

      for (const existente of existentes) {
        await fetch(BASE_CONFIG + existente.id_distribuicao_config, {
          method: "DELETE"
        });
      }

      // Insere as novas configurações
      for (const config of configuracoes) {
        const nova = {
          id_usuario,
          nome_categoria: config.nome_categoria,
          porcentagem: config.porcentagem
        };

        await fetch(BASE_CONFIG, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nova)
        });
      }

      return res.status(201).send("Configurações salvas.");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      return res.status(500).send("Erro ao salvar configurações.");
    }
  }

  res.status(405).send("Método não permitido.");
}
