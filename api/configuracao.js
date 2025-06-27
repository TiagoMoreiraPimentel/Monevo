export default async function handler(req, res) {
  const BASE_CONFIG = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).send("ID do usuário não informado.");

    try {
      const resposta = await fetch(BASE_CONFIG);
      const json = await resposta.json();
      const configuracoes = (json.items || []).filter(c => c.ID_USUARIO == id_usuario);

      console.log(`🔍 GET: Encontradas ${configuracoes.length} configurações para ID_USUARIO=${id_usuario}`);
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
      console.log(`📡 POST: Buscando todas as configurações no ORDS para ID_USUARIO=${id_usuario}...`);
      const resposta = await fetch(BASE_CONFIG);
      const jsonTodas = await resposta.json();

      console.log(`📋 Total retornado do ORDS: ${jsonTodas.items?.length || 0}`);
      console.log("🧾 Todos os registros:", JSON.stringify(jsonTodas.items, null, 2));

      // Filtra todas as configurações do usuário para exclusão
      const antigas = (jsonTodas.items || []).filter(c => c.ID_USUARIO == id_usuario);

      if (antigas.length === 0) {
        console.warn("⚠️ Nenhuma configuração antiga encontrada para exclusão.");
      } else {
        console.log(`🔍 ${antigas.length} configurações encontradas para exclusão.`);
      }

      for (const existente of antigas) {
        const deleteUrl = BASE_CONFIG + existente.ID_DISTRIBUICAO;
        console.log(`🧨 Tentando remover ID_DISTRIBUICAO=${existente.ID_DISTRIBUICAO} → ${deleteUrl}`);

        try {
          const rDelete = await fetch(deleteUrl, { method: "DELETE" });
          console.log(`✅ DELETE status para ID ${existente.ID_DISTRIBUICAO}: ${rDelete.status}`);

          if (!rDelete.ok) {
            const erroTexto = await rDelete.text();
            console.error(`❌ Falha no DELETE ID ${existente.ID_DISTRIBUICAO}: ${rDelete.status} - ${erroTexto}`);
          }
        } catch (err) {
          console.error(`🔥 Erro inesperado no DELETE ID ${existente.ID_DISTRIBUICAO}:`, err);
        }
      }

      for (const config of configuracoes) {
        const nova = {
          ID_USUARIO: id_usuario,
          NOME_CATEGORIA: config.nome_categoria,
          PORCENTAGEM: config.porcentagem,
          DIA_RENOVACAO: config.dia_renovacao || null
        };

        console.log("💾 Inserindo nova configuração:", nova);

        const rPost = await fetch(BASE_CONFIG, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nova)
        });

        console.log(`✅ POST status para categoria ${nova.NOME_CATEGORIA}: ${rPost.status}`);

        if (!rPost.ok) {
          const erro = await rPost.text();
          console.error(`❌ Erro no POST para categoria ${nova.NOME_CATEGORIA}: ${erro}`);
        }
      }

      return res.status(201).send("Configurações salvas.");
    } catch (error) {
      console.error("❌ Erro geral no POST:", error);
      return res.status(500).send("Erro ao salvar configurações.");
    }
  }

  res.status(405).send("Método não permitido.");
}
