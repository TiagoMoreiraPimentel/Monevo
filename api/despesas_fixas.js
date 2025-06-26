import fetch from "node-fetch";

export default async function handler(req, res) {
  const baseURL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesa_fixa";

  try {
    if (req.method === "GET") {
      const response = await fetch(baseURL);
      const contentType = response.headers.get("content-type");

      const data = contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      res.status(response.status).json(data);
    }

    else if (req.method === "POST") {
      const body = req.body;

      // Garantir tipos corretos
      const bodyLimpo = {
        id_usuario: parseInt(body.id_usuario),
        valor: parseFloat(body.valor),
        categoria: String(body.categoria || ""),
        descricao: String(body.descricao || ""),
        data_lancamento: String(body.data_lancamento),
        vencimento: String(body.vencimento),
        ciclo: parseInt(body.ciclo || 1)
      };

      console.log("Enviando para ORDS:", JSON.stringify(bodyLimpo, null, 2));

      const response = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyLimpo)
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const erro = contentType && contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        console.error("Erro ORDS:", erro);
        return res.status(response.status).json({ erro: "Erro ao cadastrar despesa", detalhes: erro });
      }

      const data = await response.json();
      res.status(201).json(data);
    }

    else if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ erro: "ID não informado para exclusão" });

      const response = await fetch(`${baseURL}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const erro = await response.text();
        return res.status(response.status).json({ erro: "Erro ao excluir despesa", detalhes: erro });
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
