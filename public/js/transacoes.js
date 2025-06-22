document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) {
    alert("Acesso negado. Faça login.");
    window.location.href = "../telas/login.html";
    return;
  }

  const BASE_URL = "/api/transacoes";
  const BASE_TAGS = "/api/distribuicao_valor";

  const form = document.getElementById("form-transacao");
  const btnVoltar = document.getElementById("btn-voltar");
  const btnToggleForm = document.getElementById("btn-toggle-form");
  const btnToggleFiltros = document.getElementById("btn-toggle-filtros");
  const btnAplicarFiltro = document.getElementById("btn-aplicar-filtro");
  const campoTag = document.getElementById("campo-tag");
  const selectTag = document.getElementById("tagDistribuicao");

  const tabela = document.getElementById("tabela-transacoes");
  const listaMobile = document.getElementById("lista-transacoes-mobile");

  btnVoltar.addEventListener("click", () => {
    window.location.href = "/telas/dashboard.html";
  });

  btnToggleForm.addEventListener("click", () => {
    form.classList.toggle("hidden");
  });

  btnToggleFiltros.addEventListener("click", () => {
    document.getElementById("filtros-container").classList.toggle("hidden");
  });

  document.getElementById("tipo").addEventListener("change", async (e) => {
    if (e.target.value === "Despesa") {
      campoTag.classList.remove("hidden");
      await carregarTagsDistribuicao(); // <-- chama aqui
    } else {
      campoTag.classList.add("hidden");
      selectTag.innerHTML = '<option value="">Selecione a tag</option>';
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const tagSelecionada = !campoTag.classList.contains("hidden")
      ? document.getElementById("tagDistribuicao").value
      : null;

    const payload = {
      id_usuario: usuario.id,
      id_conta: parseInt(document.getElementById("conta").value),
      tipo,
      valor: parseFloat(document.getElementById("valor").value),
      data: document.getElementById("data").value,
      categoria: document.getElementById("categoria").value,
      descricao: document.getElementById("descricao").value,
      tag_distribuicao: tipo === "Despesa" ? tagSelecionada : null
    };

    if (tipo === "Despesa" && (!tagSelecionada || tagSelecionada.trim() === "")) {
      alert("Selecione uma tag de distribuição.");
      return;
    }

    try {
      const r = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const erro = await r.text();
        console.error("Erro ORDS:", erro);
        alert(erro);
        return;
      }

      alert("Transação registrada com sucesso!");
      form.reset();
      campoTag.classList.add("hidden");
      await atualizarListaTransacoes();
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
      alert("Erro ao registrar transação.");
    }
  });

  async function carregarContas() {
    const res = await fetch("/api/contas");
    const contas = await res.json();
    const selectConta = document.getElementById("conta");
    const selectFiltro = document.getElementById("filtro-conta");
    selectConta.innerHTML = "";
    selectFiltro.innerHTML = "<option value=''>Todas</option>";

    contas.forEach(conta => {
      const opt1 = document.createElement("option");
      opt1.value = conta.id_conta;
      opt1.textContent = conta.nome_conta;
      selectConta.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = conta.id_conta;
      opt2.textContent = conta.nome_conta;
      selectFiltro.appendChild(opt2);
    });
  }

  async function carregarTagsDistribuicao() {
    try {
      const res = await fetch(`${BASE_TAGS}?id_usuario=${usuario.id}`);
      const json = await res.json();
      const tags = json || [];

      const nomesUnicos = [...new Set(tags.map(t => t.TAG_DISTRIBUICAO).filter(Boolean))];
      selectTag.innerHTML = '<option value="">Selecione a tag</option>';

      nomesUnicos.forEach(tag => {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        selectTag.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar tags:", err);
    }
  }

  async function atualizarListaTransacoes() {
    const params = new URLSearchParams({
      id_usuario: usuario.id
    });

    const r = await fetch(`${BASE_URL}?${params}`);
    const transacoes = await r.json();

    // Desktop
    tabela.innerHTML = "";
    transacoes.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.data?.split("T")[0]}</td>
        <td>${t.nome_conta || "-"}</td>
        <td>${t.tipo}</td>
        <td>R$ ${parseFloat(t.valor).toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td>${t.descricao || "-"}</td>
        <td><button class="btn-excluir" onclick="excluirTransacao(${t.id_transacao})">Excluir</button></td>
      `;
      tabela.appendChild(tr);
    });

    // Mobile
    listaMobile.innerHTML = "";
    transacoes.forEach(t => {
      const div = document.createElement("div");
      div.classList.add("card-transacao");
      div.innerHTML = `
        <p><strong>Data:</strong> ${t.data?.split("T")[0]}</p>
        <p><strong>Conta:</strong> ${t.nome_conta || "-"}</p>
        <p><strong>Tipo:</strong> ${t.tipo}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(t.valor).toFixed(2)}</p>
        <p><strong>Categoria:</strong> ${t.categoria}</p>
        <p><strong>Descrição:</strong> ${t.descricao || "-"}</p>
        <button class="btn-excluir" onclick="excluirTransacao(${t.id_transacao})">Excluir</button>
      `;
      listaMobile.appendChild(div);
    });
  }

  window.excluirTransacao = async function (id) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const r = await fetch(`${BASE_URL}?id=${id}`, {
        method: "DELETE"
      });
      if (!r.ok) throw new Error(await r.text());

      alert("Transação excluída com sucesso.");
      atualizarListaTransacoes();
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
      alert("Erro ao excluir transação.");
    }
  };

  btnAplicarFiltro.addEventListener("click", async () => {
    const filtroData = document.getElementById("filtro-data").value;
    const filtroConta = document.getElementById("filtro-conta").value;
    const filtroTipo = document.getElementById("filtro-tipo").value;
    const filtroCategoria = document.getElementById("filtro-categoria").value;

    const r = await fetch(`${BASE_URL}?id_usuario=${usuario.id}`);
    const transacoes = await r.json();

    const filtradas = transacoes.filter(t => {
      const dataOk = filtroData ? t.data?.startsWith(filtroData) : true;
      const contaOk = filtroConta ? String(t.id_conta) === filtroConta : true;
      const tipoOk = filtroTipo ? t.tipo === filtroTipo : true;
      const catOk = filtroCategoria ? t.categoria === filtroCategoria : true;
      return dataOk && contaOk && tipoOk && catOk;
    });

    tabela.innerHTML = "";
    listaMobile.innerHTML = "";

    filtradas.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.data?.split("T")[0]}</td>
        <td>${t.nome_conta || "-"}</td>
        <td>${t.tipo}</td>
        <td>R$ ${parseFloat(t.valor).toFixed(2)}</td>
        <td>${t.categoria}</td>
        <td>${t.descricao || "-"}</td>
        <td><button class="btn-excluir" onclick="excluirTransacao(${t.id_transacao})">Excluir</button></td>
      `;
      tabela.appendChild(tr);

      const div = document.createElement("div");
      div.classList.add("card-transacao");
      div.innerHTML = `
        <p><strong>Data:</strong> ${t.data?.split("T")[0]}</p>
        <p><strong>Conta:</strong> ${t.nome_conta || "-"}</p>
        <p><strong>Tipo:</strong> ${t.tipo}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(t.valor).toFixed(2)}</p>
        <p><strong>Categoria:</strong> ${t.categoria}</p>
        <p><strong>Descrição:</strong> ${t.descricao || "-"}</p>
        <button class="btn-excluir" onclick="excluirTransacao(${t.id_transacao})">Excluir</button>
      `;
      listaMobile.appendChild(div);
    });
  });

  // Inicialização
  carregarContas();
  carregarTagsDistribuicao();
  atualizarListaTransacoes();
});
