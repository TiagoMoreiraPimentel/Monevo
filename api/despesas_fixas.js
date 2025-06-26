import fetch from "node-fetch";

export default async function handler(req, res) {
  const baseURL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesas_fixa";

  try {
    if (req.method === "GET") {
      const response = await fetch(baseURL);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const corpo = {
        id_usuario: body.id_usuario,
        valor: body.valor,
        categoria: body.categoria,
        descricao: body.descricao,
        ciclo: body.ciclo
      };

      console.log("➡️ Enviando ao ORDS:", JSON.stringify(corpo, null, 2));

      const response = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return response.ok
          ? res.status(201).json(json)
          : res.status(response.status).json({ erro: "Erro ao salvar", detalhes: json });
      } catch {
        return res.status(500).json({ erro: "Resposta inesperada do ORDS", detalhes: text });
      }
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      const response = await fetch(`${baseURL}/${id}`, { method: "DELETE" });
      return response.ok
        ? res.status(204).end()
        : res.status(response.status).json({ erro: "Erro ao excluir", detalhes: await response.text() });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Método ${req.method} não permitido`);
  } catch (erro) {
    console.error("Erro geral:", erro);
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
