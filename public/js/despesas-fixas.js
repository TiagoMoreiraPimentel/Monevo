document.getElementById("form-despesa").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    id_usuario: parseInt(document.getElementById("id_usuario").value),
    valor: parseFloat(document.getElementById("valor").value),
    categoria: document.getElementById("categoria").value,
    descricao: document.getElementById("descricao").value,
    ciclo: parseInt(document.getElementById("ciclo").value)
  };

  console.log("➡️ Enviando ao ORDS:", JSON.stringify(data, null, 2));

  try {
    const res = await fetch("/api/despesas_fixas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok) throw json;

    alert("Despesa salva com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar: " + (err.detalhes || err.erro));
  }
});
