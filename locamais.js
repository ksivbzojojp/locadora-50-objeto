// =============================================================
//  LocaMais — Sistema de Locadora de Veículos
//  Prova Prática de POO em JavaScript — 2º ano
//  Aluno(a): ______________________   Turma: ______
// =============================================================
//  Aqui ficam as CLASSES do sistema. A interface fica no sketch.js.
//  Aperte Play no p5.js Web Editor: o placar dos testes aparece no canvas.
//  Respeite os nomes de classes e métodos do enunciado!
// =============================================================

// ---------- função auxiliar: arredonda para 2 casas (já pronta) ----------
function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

// =============================================================
// PARTE 1 — EXCEÇÕES PERSONALIZADAS
// =============================================================
// Estas exceções permitem identificar separadamente cada tipo de erro da locadora.
class LocadoraError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = this.constructor.name;
  }
}

// Cada erro especializado herda a estrutura da exceção geral da locadora.
class DadoInvalidoError extends LocadoraError {}
class CadastroDuplicadoError extends LocadoraError {}
class VeiculoNaoEncontradoError extends LocadoraError {}
class ClienteNaoEncontradoError extends LocadoraError {}
class VeiculoIndisponivelError extends LocadoraError {}
class CNHIncompativelError extends LocadoraError {}
class LimiteLocacoesError extends LocadoraError {}


// =============================================================
// PARTE 2 — CLASSE ABSTRATA VEICULO
// =============================================================
// A classe-base protege seus dados e centraliza as regras comuns a todo veículo.
class Veiculo {
  #placa;
  #modelo;
  #ano;
  #valorDiariaBase;
  #disponivel;
  #quilometragem;

  constructor(placa, modelo, ano, valorDiariaBase) {
    // Uma classe abstrata não deve ser instanciada diretamente.
    if (new.target === Veiculo) {
      throw new TypeError("Veiculo é uma classe abstrata e não pode ser instanciada diretamente.");
    }

    // Atribuir pelos setters faz com que os valores sejam validados.
    this.placa = placa;
    this.modelo = modelo;
    this.ano = ano;
    this.valorDiariaBase = valorDiariaBase;
    this.#disponivel = true;
    this.#quilometragem = 0;
  }

  // Os setters validam os dados antes de guardá-los nos campos privados.
  get placa() { return this.#placa; }
  set placa(valor) {
    if (typeof valor !== "string" || valor.trim() === "") {
      throw new DadoInvalidoError("A placa deve ser um texto não vazio.");
    }
    const normalizada = valor.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizada)) {
      throw new DadoInvalidoError("A placa deve estar no formato ABC1D23.");
    }
    this.#placa = normalizada;
  }

  get modelo() { return this.#modelo; }
  set modelo(valor) {
    if (typeof valor !== "string" || valor.trim() === "") {
      throw new DadoInvalidoError("O modelo deve ser um texto não vazio.");
    }
    this.#modelo = valor.trim();
  }

  get ano() { return this.#ano; }
  set ano(valor) {
    const anoAtual = new Date().getFullYear();
    if (!Number.isInteger(valor) || valor < 2000 || valor > anoAtual) {
      throw new DadoInvalidoError(`O ano deve ser um número inteiro entre 2000 e ${anoAtual}.`);
    }
    this.#ano = valor;
  }

  get valorDiariaBase() { return this.#valorDiariaBase; }
  set valorDiariaBase(valor) {
    if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
      throw new DadoInvalidoError("O valor da diária deve ser um número positivo.");
    }
    this.#valorDiariaBase = arredondar(valor);
  }

  // Disponibilidade e quilometragem são consultáveis, mas só mudam por métodos controlados.
  get disponivel() { return this.#disponivel; }
  get quilometragem() { return this.#quilometragem; }

  // Estes métodos controlam a disponibilidade do veículo durante a locação.
  marcarAlugado() {
    if (!this.#disponivel) {
      throw new VeiculoIndisponivelError(`O veículo ${this.#placa} já está alugado.`);
    }
    this.#disponivel = false;
  }

  marcarDisponivel() {
    this.#disponivel = true;
  }

  // A quilometragem final nunca pode ser menor do que a quilometragem já registrada.
  registrarKm(kmFinal) {
    if (typeof kmFinal !== "number" || !Number.isFinite(kmFinal) || kmFinal < this.#quilometragem) {
      throw new DadoInvalidoError("A quilometragem final deve ser válida e não pode diminuir.");
    }
    this.#quilometragem = kmFinal;
    return this.#quilometragem;
  }

  // Subclasses devem informar o tipo e a diária específica de cada categoria.
  tipo() {
    throw new TypeError("O método tipo() deve ser implementado pela subclasse.");
  }

  calcularDiaria() {
    throw new TypeError("O método calcularDiaria() deve ser implementado pela subclasse.");
  }

  // O desconto é progressivo: 10% a partir de 7 dias e 15% a partir de 15 dias.
  calcularValor(dias) {
    if (!Number.isInteger(dias) || dias <= 0 || dias > 30) {
      throw new DadoInvalidoError("A quantidade de dias deve ser um inteiro entre 1 e 30.");
    }
    let desconto = 0;
    if (dias >= 15) desconto = 0.15;
    else if (dias >= 7) desconto = 0.10;
    return arredondar(this.calcularDiaria() * dias * (1 - desconto));
  }

  // Dois veículos são considerados iguais quando possuem a mesma placa.
  equals(outro) {
    return outro instanceof Veiculo && this.#placa === outro.placa;
  }

  // A representação textual reúne as informações principais do veículo.
  toString() {
    const situacao = this.#disponivel ? "disponível" : "alugado";
    return `${this.tipo()} ${this.#modelo} (${this.#ano}) — placa ${this.#placa}, diária R$ ${this.calcularDiaria().toFixed(2)}, ${situacao}, ${this.#quilometragem} km`;
  }
}


// =============================================================
// PARTE 3 — SUBCLASSES
// =============================================================
// Carro acrescenta portas e ar-condicionado, mantendo os dados comuns na classe-base.
class Carro extends Veiculo {
  constructor(placa, modelo, ano, valorDiariaBase, portas = 4, arCondicionado = true) {
    super(placa, modelo, ano, valorDiariaBase);
    if (!Number.isInteger(portas) || portas < 2 || portas > 5) {
      throw new DadoInvalidoError("A quantidade de portas deve ser um inteiro entre 2 e 5.");
    }
    if (typeof arCondicionado !== "boolean") {
      throw new DadoInvalidoError("A informação de ar-condicionado deve ser true ou false.");
    }
    this.portas = portas;
    this.arCondicionado = arCondicionado;
  }

  tipo() { return "Carro"; }
  calcularDiaria() { return arredondar(this.valorDiariaBase + (this.arCondicionado ? 15 : 0)); }
}

// Moto guarda a cilindrada e aplica um adicional proporcional à diária base.
class Moto extends Veiculo {
  constructor(placa, modelo, ano, valorDiariaBase, cilindradas) {
    super(placa, modelo, ano, valorDiariaBase);
    if (!Number.isInteger(cilindradas) || cilindradas <= 0) {
      throw new DadoInvalidoError("As cilindradas devem ser um número inteiro positivo.");
    }
    this.cilindradas = cilindradas;
  }

  tipo() { return "Moto"; }
  calcularDiaria() { return arredondar(this.valorDiariaBase * (this.cilindradas > 500 ? 1.20 : 1)); }
}

// Caminhão guarda sua capacidade e aplica um adicional proporcional à diária base.
class Caminhao extends Veiculo {
  constructor(placa, modelo, ano, valorDiariaBase, capacidadeToneladas) {
    super(placa, modelo, ano, valorDiariaBase);
    if (typeof capacidadeToneladas !== "number" || !Number.isFinite(capacidadeToneladas) || capacidadeToneladas <= 0) {
      throw new DadoInvalidoError("A capacidade deve ser um número positivo de toneladas.");
    }
    this.capacidadeToneladas = capacidadeToneladas;
  }

  tipo() { return "Caminhão"; }
  calcularDiaria() { return arredondar(this.valorDiariaBase + this.capacidadeToneladas * 10); }
}


// =============================================================
// PARTE 4 — CLIENTE
// =============================================================
// Cliente guarda seus dados essenciais e mantém um histórico privado de locações.
class Cliente {
  static CATEGORIAS = ["A", "B", "AB", "C", "D", "E"];
  #nome;
  #cpf;
  #categoriaCnh;
  #historico;

  constructor(nome, cpf, categoriaCnh) {
    if (typeof nome !== "string" || nome.trim() === "") {
      throw new DadoInvalidoError("O nome do cliente não pode ser vazio.");
    }
    if (!Cliente.validarCpf(cpf)) {
      throw new DadoInvalidoError("O CPF deve conter 11 dígitos e não pode ser formado por números iguais.");
    }
    const categoria = typeof categoriaCnh === "string" ? categoriaCnh.trim().toUpperCase() : "";
    if (!Cliente.CATEGORIAS.includes(categoria)) {
      throw new DadoInvalidoError("Categoria de CNH inválida.");
    }
    this.#nome = nome.trim();
    this.#cpf = String(cpf).replace(/\D/g, "");
    this.#categoriaCnh = categoria;
    this.#historico = [];
  }

  // A validação normaliza pontos, traços e espaços antes de conferir os dígitos.
  static validarCpf(cpf) {
    if (typeof cpf !== "string" && typeof cpf !== "number") return false;
    const somenteNumeros = String(cpf).replace(/\D/g, "");
    return /^\d{11}$/.test(somenteNumeros) && !/^([0-9])\1{10}$/.test(somenteNumeros);
  }

  // O histórico é devolvido como cópia para impedir alterações externas no array interno.
  get nome() { return this.#nome; }
  get cpf() { return this.#cpf; }
  get categoriaCnh() { return this.#categoriaCnh; }
  get historico() { return [...this.#historico]; }

  // As categorias A/AB conduzem motos, B/AB/D conduzem carros e C/D/E conduzem caminhões.
  podeDirigir(veiculo) {
    if (veiculo instanceof Carro) return ["B", "AB", "D"].includes(this.#categoriaCnh);
    if (veiculo instanceof Moto) return ["A", "AB"].includes(this.#categoriaCnh);
    if (veiculo instanceof Caminhao) return ["C", "D", "E"].includes(this.#categoriaCnh);
    return false;
  }

  // Uma locação só entra no histórico quando é uma instância válida de Locacao.
  adicionarLocacao(locacao) {
    if (!(locacao instanceof Locacao)) {
      throw new DadoInvalidoError("O histórico aceita apenas objetos de locação válidos.");
    }
    this.#historico.push(locacao);
  }

  // A lista de locações ativas também é nova, sem expor o array interno.
  locacoesAtivas() {
    return this.#historico.filter((locacao) => locacao.ativa);
  }

  // A representação textual mostra nome, CPF e categoria da CNH.
  toString() {
    return `${this.#nome} — CPF ${this.#cpf} — CNH ${this.#categoriaCnh}`;
  }
}


// =============================================================
// PARTE 5 — LOCACAO
// =============================================================
// Locacao registra o estado de um aluguel e controla sua finalização.
class Locacao {
  static #contador = 0; // atributo estático: gera os ids 1, 2, 3...
  #id;
  #cliente;
  #veiculo;
  #dias;
  #dataInicio;
  #kmInicial;
  #valorPrevisto;
  #valorFinal;
  #ativa;

  constructor(cliente, veiculo, dias) {
    if (!(cliente instanceof Cliente) || !(veiculo instanceof Veiculo)) {
      throw new DadoInvalidoError("A locação precisa de um cliente e um veículo válidos.");
    }
    if (!Number.isInteger(dias) || dias <= 0) {
      throw new DadoInvalidoError("A quantidade de dias deve ser um número inteiro positivo.");
    }
    this.#id = ++Locacao.#contador;
    this.#cliente = cliente;
    this.#veiculo = veiculo;
    this.#dias = dias;
    this.#dataInicio = new Date();
    this.#kmInicial = veiculo.quilometragem;
    this.#valorPrevisto = veiculo.calcularValor(dias);
    this.#valorFinal = null;
    this.#ativa = true;
  }

  // Getters oferecem acesso controlado aos dados registrados na locação.
  get id() { return this.#id; }
  get cliente() { return this.#cliente; }
  get veiculo() { return this.#veiculo; }
  get dias() { return this.#dias; }
  get dataInicio() { return new Date(this.#dataInicio); }
  get kmInicial() { return this.#kmInicial; }
  get ativa() { return this.#ativa; }
  get valorPrevisto() { return this.#valorPrevisto; }
  get valorFinal() { return this.#valorFinal; }

  // Finalizar atualiza a quilometragem, calcula o preço e libera o veículo.
  finalizar(kmFinal, diasReais) {
    if (!this.#ativa) {
      throw new DadoInvalidoError("Esta locação já foi finalizada.");
    }
    if (!Number.isInteger(diasReais) || diasReais <= 0 || diasReais > 30) {
      throw new DadoInvalidoError("Os dias reais devem ser um inteiro entre 1 e 30.");
    }
    if (typeof kmFinal !== "number" || !Number.isFinite(kmFinal) || kmFinal < this.#kmInicial) {
      throw new DadoInvalidoError("A quilometragem final deve ser válida e não inferior à inicial.");
    }
    this.#veiculo.registrarKm(kmFinal);
    const valorPrevisto = this.#veiculo.calcularValor(this.#dias);
    const diasAtraso = Math.max(0, diasReais - this.#dias);
    const multaAtraso = diasAtraso * this.#veiculo.calcularDiaria() * 1.5;
    this.#valorFinal = arredondar(valorPrevisto + multaAtraso);
    this.#ativa = false;
    this.#veiculo.marcarDisponivel();
    return this.#valorFinal;
  }

  // A descrição mostra identificação, cliente, veículo e situação da locação.
  toString() {
    const situacao = this.#ativa ? "ativa" : "finalizada";
    return `Locação #${this.#id} — ${this.#cliente.nome} — ${this.#veiculo.placa} — ${this.#dias} dia(s) — R$ ${this.#valorPrevisto.toFixed(2)} previsto — ${situacao}`;
  }
}


// =============================================================
// PARTE 6 — LOCADORA
// =============================================================
// Locadora reúne os cadastros e coordena as operações do sistema.
class Locadora {
  static LIMITE_ATIVAS = 2;

  constructor(nome) {
    if (typeof nome !== "string" || nome.trim() === "") {
      throw new DadoInvalidoError("O nome da locadora não pode ser vazio.");
    }
    this._nome = nome.trim();
    this._veiculos = [];
    this._clientes = [];
    this._locacoes = [];
  }

  // Getters retornam o nome e a quantidade cadastrada de veículos.
  get nome() { return this._nome; }
  get totalVeiculos() { return this._veiculos.length; }

  // O cadastro impede duplicidade usando placa para veículos e CPF para clientes.
  cadastrarVeiculo(veiculo) {
    if (!(veiculo instanceof Veiculo)) {
      throw new DadoInvalidoError("Cadastre uma instância válida de Veiculo.");
    }
    if (this._veiculos.some((item) => item.placa === veiculo.placa)) {
      throw new CadastroDuplicadoError(`Já existe um veículo com a placa ${veiculo.placa}.`);
    }
    this._veiculos.push(veiculo);
    return veiculo;
  }

  cadastrarCliente(cliente) {
    if (!(cliente instanceof Cliente)) {
      throw new DadoInvalidoError("Cadastre uma instância válida de Cliente.");
    }
    if (this._clientes.some((item) => item.cpf === cliente.cpf)) {
      throw new CadastroDuplicadoError(`Já existe um cliente com o CPF ${cliente.cpf}.`);
    }
    this._clientes.push(cliente);
    return cliente;
  }

  // As buscas retornam o cadastro correspondente ou lançam uma exceção específica.
  buscarVeiculo(placa) {
    const chave = String(placa).trim().toUpperCase();
    const veiculo = this._veiculos.find((item) => item.placa === chave);
    if (!veiculo) throw new VeiculoNaoEncontradoError(`Veículo ${chave} não encontrado.`);
    return veiculo;
  }

  buscarCliente(cpf) {
    const chave = String(cpf).replace(/\D/g, "");
    const cliente = this._clientes.find((item) => item.cpf === chave);
    if (!cliente) throw new ClienteNaoEncontradoError(`Cliente com CPF ${chave} não encontrado.`);
    return cliente;
  }

  // Filtros opcionais permitem listar somente disponíveis e/ou uma categoria de veículo.
  listarVeiculos({ apenasDisponiveis = false, tipo = null } = {}) {
    return this._veiculos.filter((veiculo) => {
      const disponibilidadeOk = !apenasDisponiveis || veiculo.disponivel;
      const tipoOk = tipo === null || veiculo.tipo().toLowerCase() === String(tipo).toLowerCase();
      return disponibilidadeOk && tipoOk;
    });
  }

  listarClientes() {
    return [...this._clientes];
  }

  // Alugar valida os cadastros, a CNH, a disponibilidade e o limite de locações ativas.
  alugar(cpf, placa, dias) {
    if (!Number.isInteger(dias) || dias <= 0 || dias > 30) {
      throw new DadoInvalidoError("A quantidade de dias deve ser um inteiro entre 1 e 30.");
    }
    const cliente = this.buscarCliente(cpf);
    const veiculo = this.buscarVeiculo(placa);
    if (!veiculo.disponivel) {
      throw new VeiculoIndisponivelError(`O veículo ${veiculo.placa} não está disponível.`);
    }
    if (!cliente.podeDirigir(veiculo)) {
      throw new CNHIncompativelError(`A CNH ${cliente.categoriaCnh} não permite dirigir este veículo.`);
    }
    if (cliente.locacoesAtivas().length >= Locadora.LIMITE_ATIVAS) {
      throw new LimiteLocacoesError(`O cliente já atingiu o limite de ${Locadora.LIMITE_ATIVAS} locações ativas.`);
    }
    const locacao = new Locacao(cliente, veiculo, dias);
    veiculo.marcarAlugado();
    cliente.adicionarLocacao(locacao);
    this._locacoes.push(locacao);
    return locacao;
  }

  // Devolver finaliza a locação ativa do veículo informado e retorna o valor cobrado.
  devolver(placa, kmFinal, diasReais) {
    const veiculo = this.buscarVeiculo(placa);
    const locacao = this._locacoes.find((item) => item.veiculo.equals(veiculo) && item.ativa);
    if (!locacao) {
      throw new VeiculoIndisponivelError(`Não há locação ativa para o veículo ${veiculo.placa}.`);
    }
    return locacao.finalizar(kmFinal, diasReais);
  }

  // As consultas financeiras consideram somente locações já finalizadas.
  locacoesAtivas() {
    return this._locacoes.filter((locacao) => locacao.ativa);
  }

  faturamentoTotal() {
    return arredondar(this._locacoes.reduce((total, locacao) => total + (locacao.valorFinal ?? 0), 0));
  }

  // Retorna pares [veículo, quantidade], ordenados por locações em ordem decrescente.
  veiculosMaisAlugados(n = 3) {
    if (!Number.isInteger(n) || n < 0) {
      throw new DadoInvalidoError("O número de resultados deve ser um inteiro não negativo.");
    }
    return this._veiculos
      .map((veiculo, ordem) => ({
        veiculo,
        ordem,
        quantidade: this._locacoes.filter((locacao) => locacao.veiculo.equals(veiculo)).length
      }))
      .filter((item) => item.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade || a.ordem - b.ordem)
      .slice(0, n)
      .map((item) => [item.veiculo, item.quantidade]);
  }

  // A descrição resume o tamanho da frota, os clientes e as locações ainda abertas.
  toString() {
    return `${this._nome} — ${this.totalVeiculos} veículo(s), ${this._clientes.length} cliente(s), ${this.locacoesAtivas().length} locação(ões) ativa(s)`;
  }
}


// =============================================================
// PARTE 7 — DADOS INICIAIS
// =============================================================
// Como os dados específicos citados no enunciado não vieram junto, estes são exemplos editáveis.
function popularDadosIniciais(locadora) {
  if (!(locadora instanceof Locadora)) {
    throw new DadoInvalidoError("Informe uma instância válida de Locadora.");
  }

  // A frota exemplo contém seis veículos distribuídos entre carros, motos e caminhões.
  const veiculos = [
    new Carro("ABC1D23", "Fiat Argo", 2022, 150, 4, true),
    new Carro("EFG4H56", "Chevrolet Onix", 2023, 170, 4, true),
    new Carro("IJK7L89", "Toyota Corolla", 2021, 230, 4, true),
    new Moto("MNO1P23", "Honda CG 160", 2022, 85, 160),
    new Moto("QRS4T56", "Yamaha MT-07", 2023, 180, 689),
    new Caminhao("UVW7X89", "Volvo VM", 2020, 520, 12)
  ];
  veiculos.forEach((veiculo) => locadora.cadastrarVeiculo(veiculo));

  // Os quatro clientes de exemplo usam CPFs com formato válido para a regra solicitada.
  const clientes = [
    new Cliente("Ana Souza", "529.982.247-25", "B"),
    new Cliente("Bruno Lima", "111.444.777-35", "AB"),
    new Cliente("Carla Mendes", "935.411.347-80", "A"),
    new Cliente("Diego Santos", "153.509.460-56", "C")
  ];
  clientes.forEach((cliente) => locadora.cadastrarCliente(cliente));

  return locadora;
}
