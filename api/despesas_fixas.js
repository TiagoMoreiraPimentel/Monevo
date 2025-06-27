export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesas_fixa/";

  if (req.method === "GET") {
    const { id_usuario } = req.query;
    if (!id_usuario) return res.status(400).json({ erro: "ID do usuário é obrigatório" });
    const url = `${BASE}?q={"ID_USUARIO":${id_usuario}}`;
    const r = await fetch(url);
    const json = await r.json();
    return res.status(200).json(json.items || []);
  }

  if (req.method === "POST") {
    const novaDespesa = req.body;

    const bodyLimpo = {
      id_usuario: novaDespesa.id_usuario,
      valor: novaDespesa.valor,
      categoria: novaDespesa.categoria,
      descricao: novaDespesa.descricao,
      parcelas: novaDespesa.parcelas,
      pagas: novaDespesa.pagas || 0,
      data_lancamento: novaDespesa.data_lancamento,
      vencimento: novaDespesa.vencimento,
      valor_total: novaDespesa.parcelas > 1 ? novaDespesa.valor * novaDespesa.parcelas : null
    };

    console.log("➡️ Enviando ao ORDS:", JSON.stringify(bodyLimpo, null, 2));

    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyLimpo)
    });

    if (r.ok) {
      const json = await r.json();
      return res.status(201).json(json);
    } else {
      const erro = await r.text();
      console.error("❌ Erro ao registrar:", erro);
      return res.status(500).json({ erro: "Erro ao cadastrar despesa fixa", detalhes: erro });
    }
  }

  if (req.method === "PUT") {
    const despesa = req.body;
    if (!despesa.id_despesa_fixa) {
      return res.status(400).json({ erro: "ID da despesa é obrigatório para atualização." });
    }

    const bodyLimpo = {
      id_usuario: despesa.id_usuario,
      valor: despesa.valor,
      categoria: despesa.categoria,
      descricao: despesa.descricao,
      parcelas: despesa.parcelas,
      pagas: despesa.pagas,
      data_lancamento: despesa.data_lancamento,
      vencimento: despesa.vencimento,
      valor_total: despesa.parcelas > 1 ? despesa.valor * despesa.parcelas : null
    };

    console.log("➡️ Atualizando ORDS:", JSON.stringify(bodyLimpo, null, 2));

    const r = await fetch(BASE + despesa.id_despesa_fixa, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyLimpo)
    });

    if (r.ok) {
      const json = await r.json();
      return res.status(200).json(json);
    } else {
      const erro = await r.text();
      console.error("❌ Erro ao atualizar:", erro);
      return res.status(500).json({ erro: "Erro ao atualizar despesa", detalhes: erro });
    }
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ erro: "ID obrigatório para exclusão." });

    const r = await fetch(BASE + id, { method: "DELETE" });
    return res.status(r.status).end();
  }

  res.status(405).send("Método não permitido.");
}
