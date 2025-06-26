export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesas_fixa/";

  if (req.method === "GET") {
    const r = await fetch(BASE);
    const json = await r.json();
    return res.status(200).json(json.items);
  }

  if (req.method === "POST") {
    const dados = req.body;
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const resp = await r.json();
    if (r.ok || r.status === 201) return res.status(201).json(resp);

    console.error("Erro ORDS:", resp);
    return res.status(500).json({ erro: "Resposta inesperada do ORDS", detalhes: resp });
  }

  res.status(405).send("Método não permitido.");
}
