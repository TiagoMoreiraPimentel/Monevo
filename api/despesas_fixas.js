export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa/";

  if (req.method === "POST") {
    console.log("📩 Requisição POST recebida:");
    console.log("Body recebido:", JSON.stringify(req.body, null, 2));

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
      console.warn("⚠️ Campos obrigatórios ausentes.");
      return res.status(400).send("Campos obrigatórios ausentes.");
    }

    const novaDespesa = {
      id_usuario,
      data_registro: data,
      valor,
      categoria,
      descricao: descricao?.trim() || null,
      data_vencimento: vencimento,
      ciclo_total: ciclo || 1,
      ciclo_pago: 0,
      concluido: "N"
    };

    console.log("🔁 Enviando para ORDS:", JSON.stringify(novaDespesa, null, 2));

    try {
      const resposta = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa)
      });

      const respostaTexto = await resposta.text();

      if (!resposta.ok) {
        console.error("❌ Erro do ORDS:");
        console.error("Status:", resposta.status);
        console.error("Body:", respostaTexto);
        return res.status(500).send(`Erro ao salvar despesa. ORDS retornou ${resposta.status}.`);
      }

      console.log("✅ Despesa registrada com sucesso.");
      return res.status(201).send("Despesa registrada com sucesso.");
    } catch (erro) {
      console.error("❌ Erro inesperado:", erro);
      return res.status(500).send("Erro inesperado ao salvar despesa.");
    }
  }

  if (req.method === "GET") {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      console.warn("⚠️ ID do usuário não informado.");
      return res.status(400).send("ID do usuário não informado.");
    }

    try {
      const resposta = await fetch(BASE_URL);
      const json = await resposta.json();
      const despesas = json.items.filter(d => d.id_usuario == id_usuario);

      console.log(`✅ ${despesas.length} despesas encontradas para usuário ${id_usuario}.`);
      return res.status(200).json(despesas);
    } catch (erro) {
      console.error("❌ Erro ao buscar despesas:", erro);
      return res.status(500).send("Erro ao buscar despesas.");
    }
  }

  res.status(405).send("Método não permitido.");
}
