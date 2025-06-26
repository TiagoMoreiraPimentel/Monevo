export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa/";

  if (req.method === "POST") {
    try {
      console.log("📩 Requisição POST recebida:");
      console.log("Body recebido:", req.body);

      const {
        id_usuario,
        data,
        valor,
        categoria,
        descricao,
        vencimento,
        ciclo
      } = req.body;

      if (!id_usuario || !data || !valor || !categoria || !vencimento) {
        return res.status(400).send("Campos obrigatórios ausentes.");
      }

      const bodyLimpo = {
        ID_USUARIO: id_usuario,
        DATA_REGISTRO: data,
        VALOR: parseFloat(valor),
        CATEGORIA: categoria,
        DESCRICAO: descricao || null,
        DATA_VENCIMENTO: vencimento,
        CICLO_TOTAL: ciclo || 1,
        CICLO_PAGO: 0,
        CONCLUIDO: "N"
      };

      console.log("🔁 Enviando para ORDS:", JSON.stringify(bodyLimpo, null, 2));

      const resposta = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyLimpo)
      });

      const textoResposta = await resposta.text();

      if (!resposta.ok) {
        console.error("❌ Erro do ORDS:\nStatus:", resposta.status);
        console.error("Corpo da resposta:", textoResposta);
        return res.status(500).send("Erro ao salvar despesa.");
      }

      console.log("✅ Despesa registrada com sucesso.");
      return res.status(201).json({ mensagem: "Despesa fixa registrada com sucesso." });

    } catch (erro) {
      console.error("❌ Erro inesperado:", erro);
      return res.status(500).send("Erro interno.");
    }
  }

  if (req.method === "GET") {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).send("ID do usuário não informado.");
    }

    try {
      const resposta = await fetch(BASE_URL);
      const json = await resposta.json();
      const despesas = json.items.filter(d => d.ID_USUARIO == id_usuario);
      return res.status(200).json(despesas);
    } catch (erro) {
      console.error("Erro ao buscar despesas fixas:", erro);
      return res.status(500).send("Erro ao buscar despesas.");
    }
  }

  res.status(405).send("Método não permitido.");
}
