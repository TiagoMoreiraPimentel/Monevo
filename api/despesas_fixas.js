export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).json({ erro: "ID do usuário é obrigatório." });
    }

    try {
      const resposta = await fetch(BASE_URL);
      const json = await resposta.json();
      const dadosUsuario = json.items.filter(d => d.id_usuario == id_usuario);
      return res.status(200).json(dadosUsuario);
    } catch (error) {
      console.error("Erro ao buscar despesas fixas:", error);
      return res.status(500).json({ erro: "Erro ao buscar despesas fixas." });
    }
  }

  if (req.method === "POST") {
    const {
      id_usuario,
      valor,
      categoria,
      descricao,
      data_vencimento,
      ciclo_total
    } = req.body;

    if (!id_usuario || !valor || !categoria || !data_vencimento) {
      return res.status(400).json({ erro: "Campos obrigatórios não informados." });
    }

    const payload = {
      id_usuario,
      valor,
      categoria,
      descricao: descricao || "",
      data_registro: new Date().toISOString().split("T")[0],
      data_vencimento,
      ciclo_total: ciclo_total || 1,
      ciclo_pago: 0,
      concluido: "N"
    };

    try {
      const resposta = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto);
      }

      return res.status(201).json({ mensagem: "Despesa fixa registrada com sucesso." });
    } catch (error) {
      console.error("Erro ao registrar despesa fixa:", error);
      return res.status(500).json({ erro: "Erro ao registrar despesa fixa." });
    }
  }

  return res.status(405).send("Método não permitido.");
}
