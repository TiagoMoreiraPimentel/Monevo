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
      const raw = req.body;

      // Garantir formato correto
      const body = {
        id_usuario: parseInt(raw.id_usuario),
        valor: parseFloat(raw.valor),
        categoria: raw.categoria,
        descricao: raw.descricao || "",
        data_lancamento: raw.data_lancamento.includes("T") ? raw.data_lancamento : raw.data_lancamento + "T00:00:00Z",
        vencimento: raw.vencimento.includes("T") ? raw.vencimento : raw.vencimento + "T00:00:00Z",
        ciclo: parseInt(raw.ciclo || 1)
      };

      const response = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        return res.status(response.status).json({ erro: "Erro ao cadastrar despesa", detalhes: data });
      }

      res.status(201).json(data);
    }

    else if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ erro: "ID não informado para exclusão" });

      const response = await fetch(`${baseURL}/${id}`, { method: "DELETE" });

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
