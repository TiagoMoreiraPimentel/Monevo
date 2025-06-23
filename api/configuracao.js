export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_distribuicao_config/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).send("id_usuario obrigatório.");

    try {
      const r = await fetch(BASE);
      const json = await r.json();
      const filtradas = (json.items || []).filter(c => c.id_usuario == id_usuario);
      return res.status(200).json(filtradas);
    } catch (err) {
      console.error("Erro GET:", err);
      return res.status(500).send("Erro ao buscar configurações.");
    }
  }

  if (req.method === "POST") {
    try {
      const { id_usuario, configuracoes } = req.body;

      if (!id_usuario || !Array.isArray(configuracoes)) {
        return res.status(400).send("Formato inválido.");
      }

      // Buscar todas as configs
      const todas = await fetch(BASE).then(r => r.json());
      const existentes = todas.items.filter(c => c.id_usuario == id_usuario);

      // Deleta configs antigas
      for (const item of existentes) {
        await fetch(`${BASE}${item.id_distribuicao_config}`, { method: "DELETE" });
      }

      // Insere novas configs
      for (const conf of configuracoes) {
        await fetch(BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_usuario,
            nome_categoria: conf.nome_categoria,
            porcentagem: conf.porcentagem
          })
        });
      }

      return res.status(201).send("Configuração atualizada.");
    } catch (err) {
      console.error("Erro POST:", err);
      return res.status(500).send("Erro ao salvar configuração.");
    }
  }

  res.status(405).send("Método não permitido.");
}
