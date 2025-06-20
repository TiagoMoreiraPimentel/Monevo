export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_usuario/";

  if (req.method === "GET") {
    const r = await fetch(BASE);
    const json = await r.json();
    return res.status(200).json(json.items);
  }

  if (req.method === "POST") {
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    return res.status(r.status).end();
  }

  const id = req.query.id;
  if (!id) return res.status(400).send("ID obrigatório.");

  if (req.method === "PUT") {
    const r = await fetch(BASE + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return res.status(r.status).end();
  }

  if (req.method === "DELETE") {
    const r = await fetch(BASE + id, {
      method: "DELETE"
    });
    return res.status(r.status).end();
  }

  res.status(405).send("Método não permitido.");
}
