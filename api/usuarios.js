export default async function handler(req, res) {
  const BASE = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_usuario/";
  const { method, url } = req;

  // Extrai o ID da URL, se existir
  const idMatch = url.match(/\/api\/usuarios\/(\d+)/);
  const id = idMatch ? idMatch[1] : null;

  try {
    if (method === "GET") {
      const r = await fetch(BASE);
      const json = await r.json();
      return res.status(200).json(json.items);
    }

    if (method === "POST") {
      const r = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      return res.status(r.status).end();
    }

    if (method === "PUT" && id) {
      const r = await fetch(BASE + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      return res.status(r.status).end();
    }

    if (method === "DELETE" && id) {
      const r = await fetch(BASE + id, {
        method: "DELETE",
      });
      return res.status(r.status).end();
    }

    return res.status(405).send("Método não permitido ou ID ausente.");
  } catch (err) {
    console.error("Erro na API /usuarios:", err);
    return res.status(500).send("Erro interno.");
  }
}
