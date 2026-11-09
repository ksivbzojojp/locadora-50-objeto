// =============================================================
//  TESTES AUTOMÁTICOS — NÃO ALTERE ESTE ARQUIVO
//  Os resultados aparecem no Console do p5.js Web Editor
//  e o placar aparece no canvas (chamado pelo setup() do sketch.js).
// =============================================================
function rodarTestes() {
  const linhas = [];
  const resultado = { ok: 0, total: 0 };
  const escrever = (texto) => { linhas.push(texto); console.log(texto); };
  const quase = (a, b) => typeof a === "number" && Math.abs(a - b) < 0.005;

  function checar(descricao, condicao) {
    resultado.total++;
    if (condicao) { resultado.ok++; escrever(`  OK    ${descricao}`); }
    else escrever(`  FALHA ${descricao}`);
  }

  function geraErro(funcao, TipoErro) {
    try { funcao(); } catch (e) { return e instanceof TipoErro; }
    return false;
  }

  const objetos = () => [
    new Carro("ABC1D23", "Chevrolet Onix", 2022, 120),
    new Moto("MOT0A12", "Honda CB 650", 2021, 90, 650),
    new Caminhao("CAM1B23", "Mercedes Accelo", 2019, 300, 5),
  ];

  function bloco1() {
    checar("Veiculo é abstrata (new Veiculo(...) gera TypeError)",
      geraErro(() => new Veiculo("ABC1D23", "X", 2022, 100), TypeError));
    const [carro, moto, caminhao] = objetos();
    checar("Carro, Moto e Caminhao herdam de Veiculo",
      [carro, moto, caminhao].every((v) => v instanceof Veiculo));
    checar("tipo() devolve 'Carro', 'Moto' e 'Caminhão'",
      carro.tipo() === "Carro" && moto.tipo() === "Moto" && caminhao.tipo() === "Caminhão");
  }

  function bloco2() {
    const [carro, moto, caminhao] = objetos();
    checar("Carro com ar: 120 + 15 = 135.00", quase(carro.calcularDiaria(), 135));
    checar("Carro sem ar: 90.00", quase(new Carro("BRA2E19", "Fiat Mobi", 2020, 90, 4, false).calcularDiaria(), 90));
    checar("Moto acima de 500 cc: 90 x 1.2 = 108.00", quase(moto.calcularDiaria(), 108));
    checar("Moto até 500 cc: 50.00", quase(new Moto("BIZ3C45", "Honda Biz", 2023, 50, 125).calcularDiaria(), 50));
    checar("Caminhão 5 t: 300 + 10 x 5 = 350.00", quase(caminhao.calcularDiaria(), 350));
  }

  function bloco3() {
    const [carro, moto, caminhao] = objetos();
    checar("Moto, 3 dias, sem desconto: 324.00", quase(moto.calcularValor(3), 324));
    checar("Carro, 7 dias, 10% de desconto: 850.50", quase(carro.calcularValor(7), 850.5));
    checar("Caminhão, 15 dias, 15% de desconto: 4462.50", quase(caminhao.calcularValor(15), 4462.5));
    checar("0 dias gera DadoInvalidoError", geraErro(() => carro.calcularValor(0), DadoInvalidoError));
    checar("31 dias gera DadoInvalidoError", geraErro(() => carro.calcularValor(31), DadoInvalidoError));
  }

  function bloco4() {
    const [carro] = objetos();
    checar("Placa inválida gera DadoInvalidoError",
      geraErro(() => new Carro("12ABC", "X", 2022, 100), DadoInvalidoError));
    checar("Placa 'abc-1d23' é aceita e vira 'ABC1D23'",
      new Carro("abc-1d23", "X", 2022, 100).placa === "ABC1D23");
    checar("Ano 1990 gera DadoInvalidoError",
      geraErro(() => new Carro("ABC1D23", "X", 1990, 100), DadoInvalidoError));
    checar("Diária negativa gera DadoInvalidoError",
      geraErro(() => new Carro("ABC1D23", "X", 2022, -5), DadoInvalidoError));
    try { carro.disponivel = false; } catch (e) { /* getter sem setter */ }
    checar("disponivel é somente leitura (getter sem setter)", carro.disponivel === true);
    checar("A placa fica em campo privado (#placa), não em atributo público",
      !Object.keys(carro).some((k) => k.toLowerCase().includes("placa")));
    checar("CPF com 10 dígitos é inválido", Cliente.validarCpf("1234567890") === false);
    checar("CPF com todos os dígitos iguais é inválido", Cliente.validarCpf("11111111111") === false);
    checar("CPF formatado 529.982.247-25 é válido", Cliente.validarCpf("529.982.247-25") === true);
    checar("Categoria de CNH 'Z' gera DadoInvalidoError",
      geraErro(() => new Cliente("Ana", "52998224725", "Z"), DadoInvalidoError));
  }

  function bloco5() {
    const [carro, moto, caminhao] = objetos();
    const ana = new Cliente("Ana Souza", "529.982.247-25", "B");
    const diego = new Cliente("Diego Rocha", "168.995.350-09", "A");
    const carla = new Cliente("Carla Mendes", "390.533.447-05", "D");
    checar("CNH B dirige carro", ana.podeDirigir(carro) === true);
    checar("CNH B não dirige moto", ana.podeDirigir(moto) === false);
    checar("CNH A dirige moto e não dirige carro", diego.podeDirigir(moto) && !diego.podeDirigir(carro));
    checar("CNH D dirige caminhão e carro", carla.podeDirigir(caminhao) && carla.podeDirigir(carro));
  }

  function lojaTeste() {
    const [carro, moto, caminhao] = objetos();
    const loja = new Locadora("Teste");
    [carro, moto, caminhao].forEach((v) => loja.cadastrarVeiculo(v));
    const ana = new Cliente("Ana Souza", "529.982.247-25", "B");
    [ana, new Cliente("Diego Rocha", "168.995.350-09", "A"),
     new Cliente("Carla Mendes", "390.533.447-05", "D")].forEach((c) => loja.cadastrarCliente(c));
    return { loja, carro, moto, ana };
  }

  function bloco6() {
    const { loja, carro, moto } = lojaTeste();
    checar("totalVeiculos devolve o número de veículos (3)", loja.totalVeiculos === 3);
    checar("Placa repetida gera CadastroDuplicadoError",
      geraErro(() => loja.cadastrarVeiculo(new Carro("ABC1D23", "Outro", 2022, 100)), CadastroDuplicadoError));
    checar("CPF repetido gera CadastroDuplicadoError",
      geraErro(() => loja.cadastrarCliente(new Cliente("Outra Ana", "52998224725", "B")), CadastroDuplicadoError));
    checar("buscarVeiculo('abc1d23') encontra o Onix", loja.buscarVeiculo("abc1d23") === carro);
    checar("Placa inexistente gera VeiculoNaoEncontradoError",
      geraErro(() => loja.buscarVeiculo("ZZZ9Z99"), VeiculoNaoEncontradoError));
    checar("CPF inexistente gera ClienteNaoEncontradoError",
      geraErro(() => loja.buscarCliente("11144477735"), ClienteNaoEncontradoError));
    const motos = loja.listarVeiculos({ tipo: "moto" });
    checar("listarVeiculos({ tipo: 'moto' }) devolve só a moto", motos.length === 1 && motos[0] === moto);
  }

  function bloco7() {
    const { loja, carro, ana } = lojaTeste();
    const loc = loja.alugar("52998224725", "ABC1D23", 7);
    checar("alugar() devolve um objeto Locacao", loc instanceof Locacao);
    checar("Valor previsto da locação: 850.50", quase(loc.valorPrevisto, 850.5));
    checar("Veículo alugado fica indisponível", carro.disponivel === false);
    checar("listarVeiculos({ apenasDisponiveis: true }) não mostra o carro alugado",
      !loja.listarVeiculos({ apenasDisponiveis: true }).includes(carro));
    checar("Alugar veículo já alugado gera VeiculoIndisponivelError",
      geraErro(() => loja.alugar("39053344705", "ABC1D23", 2), VeiculoIndisponivelError));
    checar("CNH B tentando alugar moto gera CNHIncompativelError",
      geraErro(() => loja.alugar("52998224725", "MOT0A12", 2), CNHIncompativelError));
    loja.cadastrarVeiculo(new Carro("BRA2E19", "Fiat Mobi", 2020, 90, 4, false));
    loja.cadastrarVeiculo(new Carro("QWE5R67", "Hyundai HB20", 2023, 110));
    loja.alugar("52998224725", "BRA2E19", 2);
    checar("Terceira locação ativa do mesmo cliente gera LimiteLocacoesError",
      geraErro(() => loja.alugar("52998224725", "QWE5R67", 2), LimiteLocacoesError));
    checar("Cliente guarda o histórico (2 locações)", ana.historico.length === 2);
    const valor = loja.devolver("ABC1D23", 800, 9);
    checar("Devolução com 2 dias de atraso: 850.50 + 2 x 135 x 1.5 = 1255.50", quase(valor, 1255.5));
    checar("Depois da devolução o carro volta a ficar disponível", carro.disponivel === true);
    checar("Quilometragem do carro atualizada para 800", carro.quilometragem === 800);
    checar("Devolver carro sem locação ativa gera LocadoraError",
      geraErro(() => loja.devolver("ABC1D23", 900, 1), LocadoraError));
    checar("faturamentoTotal() soma só as finalizadas: 1255.50", quase(loja.faturamentoTotal(), 1255.5));
    loja.alugar("39053344705", "ABC1D23", 1);
    const top = loja.veiculosMaisAlugados(1);
    checar("veiculosMaisAlugados(1) devolve [[carro, 2]]",
      top.length === 1 && top[0][0] === carro && top[0][1] === 2);
  }

  function bloco8() {
    checar("Todas as exceções herdam de LocadoraError",
      [DadoInvalidoError, CadastroDuplicadoError, VeiculoNaoEncontradoError, ClienteNaoEncontradoError,
       VeiculoIndisponivelError, CNHIncompativelError, LimiteLocacoesError]
        .every((E) => E.prototype instanceof LocadoraError));
    checar("LocadoraError herda de Error", LocadoraError.prototype instanceof Error);
  }

  const blocos = [
    ["1. Herança e classe abstrata", bloco1, 3],
    ["2. Polimorfismo: calcularDiaria()", bloco2, 5],
    ["3. calcularValor(dias) com desconto", bloco3, 5],
    ["4. Encapsulamento e validações", bloco4, 10],
    ["5. Regras da CNH", bloco5, 4],
    ["6. Locadora: cadastros e buscas", bloco6, 7],
    ["7. Locadora: aluguel e devolução", bloco7, 14],
    ["8. Exceções personalizadas", bloco8, 2],
  ];
  const TOTAL = blocos.reduce((s, b) => s + b[2], 0);

  for (const [nome, funcao, qtd] of blocos) {
    escrever(`=== ${nome} ===`);
    const antes = resultado.total;
    try {
      funcao();
    } catch (erro) {
      const faltam = qtd - (resultado.total - antes);
      escrever(`  ERRO  o bloco parou: ${erro.name}: ${erro.message}`);
      escrever(`        ${faltam} teste(s) deste bloco contados como FALHA`);
      resultado.total += faltam;
    }
  }
  escrever(`\nRESULTADO: ${resultado.ok} de ${TOTAL} testes aprovados`);

  return [resultado.ok, TOTAL];
}

// Este arquivo só define rodarTestes(). Quem chama é o setup() do sketch.js.
