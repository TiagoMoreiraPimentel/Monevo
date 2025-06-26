export default async function handler(req, res) {
  const BASE_URL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa/";

  if (req.method === "POST") {
    const {
      id_usuario,
      data,
      valor,
      categoria,
      descricao,
      vencimento,
      ciclo
    } = req.body;

    console.log("📩 Requisição POST recebida:");
    console.log("Body recebido:", JSON.stringify(req.body, null, 2));

    if (!id_usuario || !data || !valor || !categoria || !vencimento) {
      return res.status(400).send("Campos obrigatórios ausentes.");
    }

    const payload = {
      ID_USUARIO: id_usuario,
      DATA_REGISTRO: data,
      VALOR: valor,
      CATEGORIA: categoria,
      DESCRICAO: descricao?.trim() || null,
      DATA_VENCIMENTO: vencimento,
      CICLO_TOTAL: ciclo || 1,
      CICLO_PAGO: 0,
      CONCLUIDO: "N"
    };

    console.log("📤 Enviando para ORDS:", JSON.stringify(payload, null, 2));

    try {
      const resposta = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        console.error("❌ Erro do ORDS:\nStatus:", resposta.status, "\nDetalhes:", erroTexto);
        return res.status(500).send("Erro ao salvar despesa.");
      }

      return res.status(201).send("Despesa registrada com sucesso.");
    } catch (erro) {
      console.error("❌ Erro na requisição ORDS:", erro);
      return res.status(500).send("Erro ao salvar despesa.");
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
      console.error("Erro ao buscar despesas:", erro);
      return res.status(500).send("Erro ao buscar despesas.");
    }
  }

  return res.status(405).send("Método não permitido.");
}
