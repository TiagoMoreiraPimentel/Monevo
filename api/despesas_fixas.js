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

    if (!id_usuario || !data || !valor || !categoria || !vencimento) {
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

    console.log("Enviando para ORDS:", JSON.stringify(novaDespesa, null, 2));

    try {
      const resposta = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDespesa)
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        console.error("Erro ORDS:", erroTexto);
        return res.status(500).send("Erro ao salvar despesa.");
      }

      return res.status(201).send("Despesa registrada com sucesso.");
    } catch (erro) {
      console.error("Erro ao registrar despesa:", erro);
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
      const despesas = json.items.filter(d => d.id_usuario == id_usuario);

      return res.status(200).json(despesas);
    } catch (erro) {
      console.error("Erro ao buscar despesas:", erro);
      return res.status(500).send("Erro ao buscar despesas.");
    }
  }

  res.status(405).send("Método não permitido.");
}
