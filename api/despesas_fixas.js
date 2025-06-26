export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesas_fixa/";

  if (req.method === "GET") {
    const r = await fetch(BASE);
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
      ciclo: novaDespesa.ciclo,
      data_lancamento: novaDespesa.data_lancamento,
      vencimento: novaDespesa.vencimento
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
      return res.status(500).json({ erro: "Resposta inesperada do ORDS", detalhes: erro });
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
