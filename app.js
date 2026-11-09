/* Interface web da LocaMais: usa as classes e regras definidas em locamais.js. */
"use strict";

let locadora;
let resultadoTestes = [0, 0];
let avisoTimer;

const porId = (id) => document.getElementById(id);
const dinheiro = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapar = (valor) =>
  String(valor).replace(
    /[&<>"']/g,
    (caractere) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caractere],
  );

function iniciarAplicacao() {
  try {
    resultadoTestes = rodarTestes();
  } catch (erro) {
    console.error("Não foi possível executar os testes automáticos:", erro);
    resultadoTestes = [0, 0];
  }
  mostrarResultadoTestes();

  try {
    locadora = popularDadosIniciais(new Locadora("LocaMais"));
    porId("today-label").textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    preencherClientes();
    conectarControles();
    atualizarPainel();
  } catch (erro) {
    console.error("Erro ao iniciar a LocaMais:", erro);
    mostrarAviso(`Não foi possível carregar o sistema: ${erro.message}`, true);
  }
}

function mostrarResultadoTestes() {
  const badge = porId("test-badge");
  const [ok, total] = resultadoTestes;
  badge.textContent = `Testes: ${ok} / ${total}`;
  badge.classList.toggle("fail", ok !== total);
  badge.title =
    ok === total
      ? "Todos os testes automáticos passaram."
      : "Alguns testes automáticos falharam. Consulte o console.";
}

function conectarControles() {
  porId("customer-select").addEventListener("change", atualizarOpcoesVeiculo);
  porId("vehicle-search").addEventListener("input", desenharFrota);
  porId("vehicle-filter").addEventListener("change", desenharFrota);
  porId("rental-form").addEventListener("submit", criarLocacao);
  porId("active-list").addEventListener("submit", finalizarLocacao);
}

function preencherClientes() {
  const select = porId("customer-select");
  const clientes = locadora.listarClientes();
  select.innerHTML =
    '<option value="">Selecione um cliente</option>' +
    clientes
      .map(
        (cliente) =>
          `<option value="${escapar(cliente.cpf)}">${escapar(cliente.nome)} · CNH ${escapar(cliente.categoriaCnh)}</option>`,
      )
      .join("");
  porId("client-count").textContent = clientes.length;
  desenharClientes();
  atualizarOpcoesVeiculo();
}

function atualizarOpcoesVeiculo() {
  const selectCliente = porId("customer-select");
  const selectVeiculo = porId("vehicle-select");
  const cliente = selectCliente.value
    ? locadora.buscarCliente(selectCliente.value)
    : null;
  const disponiveis = locadora.listarVeiculos({ apenasDisponiveis: true });
  const compativeis = cliente
    ? disponiveis.filter((veiculo) => cliente.podeDirigir(veiculo))
    : [];
  const anterior = selectVeiculo.value;

  if (!cliente) {
    selectVeiculo.innerHTML =
      '<option value="">Escolha um cliente primeiro</option>';
    selectVeiculo.disabled = true;
    porId("vehicle-hint").textContent =
      "Veículos compatíveis com a CNH do cliente serão listados.";
    return;
  }

  selectVeiculo.disabled = compativeis.length === 0;
  if (compativeis.length === 0) {
    selectVeiculo.innerHTML =
      '<option value="">Sem veículos compatíveis disponíveis</option>';
    porId("vehicle-hint").textContent =
      "No momento, não há veículos disponíveis para esta categoria de CNH.";
    return;
  }

  selectVeiculo.innerHTML =
    '<option value="">Selecione um veículo</option>' +
    compativeis
      .map(
        (veiculo) =>
          `<option value="${escapar(veiculo.placa)}">${escapar(veiculo.modelo)} · ${escapar(veiculo.placa)} · ${dinheiro(veiculo.calcularDiaria())}/dia</option>`,
      )
      .join("");
  if (compativeis.some((veiculo) => veiculo.placa === anterior))
    selectVeiculo.value = anterior;
  const resumoVeiculos =
    compativeis.length === 1
      ? "1 veículo disponível e compatível"
      : `${compativeis.length} veículos disponíveis e compatíveis`;
  porId("vehicle-hint").textContent =
    `${resumoVeiculos} com a CNH ${cliente.categoriaCnh}.`;
}

function criarLocacao(evento) {
  evento.preventDefault();
  try {
    const cpf = porId("customer-select").value;
    const placa = porId("vehicle-select").value;
    const dias = Number(porId("rental-days").value);
    const locacao = locadora.alugar(cpf, placa, dias);
    atualizarPainel();
    mostrarAviso(
      `Locação #${locacao.id} criada para ${locacao.cliente.nome}. Valor previsto: ${dinheiro(locacao.valorPrevisto)}.`,
      false,
    );
    porId("rental-form").reset();
    porId("rental-days").value = "3";
    atualizarOpcoesVeiculo();
  } catch (erro) {
    mostrarAviso(erro.message || "Não foi possível criar a locação.", true);
  }
}

function finalizarLocacao(evento) {
  const formulario = evento.target.closest("form[data-return-plate]");
  if (!formulario) return;
  evento.preventDefault();
  try {
    const placa = formulario.dataset.returnPlate;
    const kmFinal = Number(formulario.elements.kmFinal.value);
    const diasReais = Number(formulario.elements.diasReais.value);
    const valor = locadora.devolver(placa, kmFinal, diasReais);
    atualizarPainel();
    mostrarAviso(
      `Veículo ${placa} devolvido. Valor final: ${dinheiro(valor)}.`,
      false,
    );
  } catch (erro) {
    mostrarAviso(
      erro.message || "Não foi possível finalizar a devolução.",
      true,
    );
  }
}

function atualizarPainel() {
  const veiculos = locadora.listarVeiculos();
  const ativos = locadora.locacoesAtivas();
  porId("stat-fleet").textContent = veiculos.length;
  porId("stat-available").textContent = veiculos.filter(
    (veiculo) => veiculo.disponivel,
  ).length;
  porId("stat-active").textContent = ativos.length;
  porId("stat-revenue").textContent = dinheiro(locadora.faturamentoTotal());
  porId("fleet-count").textContent =
    `${veiculos.length} veículo${veiculos.length === 1 ? "" : "s"}`;
  porId("active-count").textContent =
    `${ativos.length} ativa${ativos.length === 1 ? "" : "s"}`;
  desenharFrota();
  desenharLocacoes(ativos);
  desenharMaisAlugados();
  desenharClientes();
  atualizarOpcoesVeiculo();
}

function desenharFrota() {
  if (!locadora) return;
  const termo = porId("vehicle-search").value.trim().toLocaleLowerCase("pt-BR");
  const tipo = porId("vehicle-filter").value;
  const veiculos = locadora.listarVeiculos().filter((veiculo) => {
    const combinaTipo =
      tipo === "all" || veiculo.tipo().toLocaleLowerCase("pt-BR") === tipo;
    const texto =
      `${veiculo.modelo} ${veiculo.placa} ${veiculo.tipo()}`.toLocaleLowerCase(
        "pt-BR",
      );
    return combinaTipo && texto.includes(termo);
  });
  porId("fleet-empty").hidden = veiculos.length > 0;
  porId("fleet-list").innerHTML = veiculos
    .map((veiculo) => {
      const tipoVeiculo = veiculo.tipo();
      const simbolo =
        tipoVeiculo === "Carro"
          ? "CAR"
          : tipoVeiculo === "Moto"
            ? "MOTO"
            : "VAN";
      const detalhes =
        veiculo instanceof Carro
          ? `${veiculo.ano} · ${veiculo.portas} portas · ar-condicionado ${veiculo.arCondicionado ? "sim" : "não"}`
          : veiculo instanceof Moto
            ? `${veiculo.ano} · ${veiculo.cilindradas} cc`
            : `${veiculo.ano} · ${veiculo.capacidadeToneladas} toneladas`;
      return `<article class="vehicle-card">
      <div class="vehicle-top"><div class="vehicle-type"><span class="vehicle-symbol">${simbolo}</span>${escapar(tipoVeiculo)}</div><span class="availability ${veiculo.disponivel ? "" : "busy"}">${veiculo.disponivel ? "Disponível" : "Alugado"}</span></div>
      <h3>${escapar(veiculo.modelo)}</h3><p class="vehicle-meta">${escapar(detalhes)}</p>
      <div class="vehicle-bottom"><span class="plate">${escapar(veiculo.placa)}</span><span class="daily-price">diária<strong>${dinheiro(veiculo.calcularDiaria())}</strong></span></div>
    </article>`;
    })
    .join("");
}

function desenharLocacoes(ativas) {
  porId("active-empty").hidden = ativas.length > 0;
  porId("active-list").innerHTML = ativas
    .map((locacao) => {
      const veiculo = locacao.veiculo;
      const cliente = locacao.cliente;
      return `<article class="active-card">
      <div class="active-main">
        <div class="active-title"><strong>${escapar(veiculo.modelo)}</strong><span class="availability">Ativa · #${locacao.id}</span></div>
        <p class="active-sub">${escapar(cliente.nome)} · ${escapar(veiculo.placa)} · ${locacao.dias} dia${locacao.dias === 1 ? "" : "s"} contratado${locacao.dias === 1 ? "" : "s"}</p>
        <div class="active-value">Valor previsto <strong>${dinheiro(locacao.valorPrevisto)}</strong> · km inicial ${locacao.kmInicial.toLocaleString("pt-BR")}</div>
      </div>
      <form class="return-form" data-return-plate="${escapar(veiculo.placa)}">
        <div class="return-field"><label for="km-${locacao.id}">KM final</label><input id="km-${locacao.id}" name="kmFinal" type="number" min="${locacao.kmInicial}" step="1" value="${locacao.kmInicial}" required /></div>
        <div class="return-field"><label for="days-${locacao.id}">Dias reais</label><input id="days-${locacao.id}" name="diasReais" type="number" min="1" max="30" step="1" value="${locacao.dias}" required /></div>
        <button class="return-button" type="submit">Devolver</button>
      </form>
    </article>`;
    })
    .join("");
}

function desenharMaisAlugados() {
  const ranking = locadora.veiculosMaisAlugados(locadora.totalVeiculos);
  porId("popular-list").innerHTML = ranking.length
    ? ranking
        .map(
          ([veiculo, quantidade], indice) =>
            `<div class="rank-row"><span class="rank-number ${indice === 0 ? "first" : ""}">${indice + 1}</span><div class="rank-info"><strong>${escapar(veiculo.modelo)}</strong><span>${escapar(veiculo.placa)} · ${escapar(veiculo.tipo())}</span></div><span class="rank-count">${quantidade} aluguel${quantidade === 1 ? "" : "s"}</span></div>`,
        )
        .join("")
    : '<div class="empty-state">O ranking aparece após a primeira locação.</div>';
}

function desenharClientes() {
  if (!locadora) return;
  const clientes = locadora.listarClientes();
  porId("client-count").textContent = clientes.length;
  porId("client-list").innerHTML = clientes
    .map((cliente) => {
      const iniciais = cliente.nome
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toLocaleUpperCase("pt-BR");
      const historico = cliente.historico.length;
      const textoHistorico =
        historico === 1 ? "1 locação" : `${historico} locações`;
      return `<div class="client-row"><span class="client-avatar">${escapar(iniciais)}</span><div class="client-info"><strong>${escapar(cliente.nome)}</strong><span>${textoHistorico} no histórico</span></div><span class="license-tag">CNH ${escapar(cliente.categoriaCnh)}</span></div>`;
    })
    .join("");
}

function mostrarAviso(texto, erro) {
  const notice = porId("notice");
  notice.textContent = texto;
  notice.classList.toggle("error", erro);
  notice.hidden = false;
  window.clearTimeout(avisoTimer);
  avisoTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, 6500);
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

document.addEventListener("DOMContentLoaded", iniciarAplicacao);
