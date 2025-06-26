import fetch from "node-fetch";

export default async function handler(req, res) {
  const baseURL = "https://g46a44e87f53b88-pm1g7tnjgm8lrmpr.adb.sa-saopaulo-1.oraclecloudapps.com/ords/admin/monevo_despesas_fixa";

  try {
    if (req.method === "GET") {
      const response = await fetch(baseURL);
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return res.status(200).json(data);
      } else {
        const texto = await response.text();
        console.error("Resposta bruta do ORDS (POST):", text);
        return res.status(500).json({ erro: "Resposta inesperada do ORDS", detalhes: text });
      }
    }

    else if (req.method === "POST") {
      try {
        const rawBody = req.body;
        const body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

        const corpoLimpo = { ...body };
        delete corpoLimpo.id_despesa_fixa;

        console.log("Enviando ao ORDS:", JSON.stringify(corpoLimpo, null, 2));

        const response = await fetch(baseURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpoLimpo)
        });

        const text = await response.text();

        try {
          const json = JSON.parse(text);
          if (!response.ok) {
            return res.status(response.status).json({ erro: "Erro ao cadastrar despesa", detalhes: json });
          }
          return res.status(201).json(json);
        } catch (e) {
          return res.status(500).json({ erro: "Resposta inesperada do ORDS", detalhes: text });
        }

      } catch (erro) {
        console.error("Erro no handler de despesas fixas:", erro);
        return res.status(500).json({ erro: "Erro interno no servidor", detalhes: erro.message });
      }
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

      return res.status(204).end();
    }

    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).end(`Método ${req.method} não permitido`);
    }

  } catch (erro) {
    console.error("Erro no handler de despesas fixas:", erro);
    return res.status(500).json({ erro: "Erro interno no servidor", detalhes: erro.message });
  }
}
