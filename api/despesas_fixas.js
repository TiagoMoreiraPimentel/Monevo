import fetch from "node-fetch";

export default async function handler(req, res) {
  const baseURL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa";

  try {
    if (req.method === "GET") {
      const response = await fetch(baseURL);
      const data = await response.json();
      res.status(200).json(data);
    }

    else if (req.method === "POST") {
      const body = req.body;

      // Remover ID, caso venha no body por erro
      delete body.id_despesa_fixa;

      const response = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ erro: "Erro ao cadastrar despesa", detalhes: data });
      }

      res.status(201).json(data);
    }

    else if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ erro: "ID não informado para exclusão" });

      const response = await fetch(`${baseURL}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ erro: "Erro ao excluir despesa", detalhes: error });
      }

      res.status(204).end();
    }

    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      res.status(405).end(`Método ${req.method} não permitido`);
    }
  } catch (erro) {
    console.error("Erro no handler de despesas fixas:", erro);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
