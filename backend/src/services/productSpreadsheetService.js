// arquivo responsável por importar e exportar produtos em planilhas (.xlsx e .csv) com proteção contra Formula Injection.
// atua na camada de serviços (services) do backend.
// tecnologias principais: ExcelJS, Node.js Streams, Prisma Client, JavaScript ES Modules.
// usado por: productController.js para gerar modelo de planilha, exportar catálogo e importar lotes de produtos.

// importações de bibliotecas de manipulação de planilhas e streams:
// ExcelJS lê e escreve arquivos Excel/CSV formatados; Readable cria stream em memória para parsing de CSV; path resolve extensões de arquivos.
import ExcelJS from "exceljs";
import { Readable } from "stream";
import path from "path";

// importações de infraestrutura e persistência:
// prisma provê comunicação transacional com o banco de dados relacional.
import { prisma } from "../config/prismaClient.js";

// importações de utilitários do sistema:
// AppError padroniza lançamento de erros com status HTTP; sanitizeSpreadsheetCell neutraliza fórmulas maliciosas de planilhas.
import { AppError } from "../utils/errorHandler.js";
import { sanitizeSpreadsheetCell } from "../utils/sanitizers.js";

// limite máximo de linhas de dados permitidas em uma única importação (5000 itens):
// protege o consumo de memória do servidor e evita transações excessivamente longas no banco de dados.
const MAX_IMPORT_ROWS = 5000;

// função responsável por normalizar cabeçalhos de planilhas removendo acentuação, espaços e caracteres especiais.
//
// contexto: invocada internamente por mapHeaderColumns e parseStatusCell para padronizar comparação de colunas.
//
// parâmetros:
//   - value (qualquer tipo, opcional): texto bruto ou valor da célula lida na linha de cabeçalho.
//
// retorno: string limpa em minúsculas sem diacríticos e com espaçamento simples padronizado.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe value (qualquer tipo opcional).
// 2 - converte o valor para string tratando nulos ou indefinidos como vazio.
// 3 - normaliza decompondo caracteres acentuados via Unicode NFD.
// 4 - remove marcas diacríticas via expressão regular.
// 5 - converte todo o texto para minúsculas e remove espaços repetidos.
// 6 - retorna a string normalizada.
function normalizeHeader(value) {
  // 1 - recebe value (qualquer tipo opcional).
  // 2 - converte o valor para string tratando nulos ou indefinidos como vazio.
  // 3 - normaliza decompondo caracteres acentuados via Unicode NFD.
  // 4 - remove marcas diacríticas via expressão regular.
  // 5 - converte todo o texto para minúsculas e remove espaços repetidos.
  // 6 - retorna a string normalizada.
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// função responsável por extrair o valor primitivo de células lidas pelo ExcelJS tratando formatos complexos.
//
// contexto: invocada internamente durante o processamento de linhas para ler células simples, richText ou fórmulas.
//
// parâmetros:
//   - cellValue (qualquer tipo, opcional): conteúdo retornado pelo leitor de células do ExcelJS.
//
// retorno: string, número ou valor primitivo correspondente ao texto visível da célula.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe cellValue (qualquer tipo opcional).
// 2 - retorna string vazia se o valor for nulo ou indefinido.
// 3 - avalia se o valor é um objeto do ExcelJS (richText, result de fórmula ou text).
// 4 - extrai e concatena fragmentos de texto se for richText.
// 5 - extrai o resultado calculado da fórmula se a propriedade result estiver presente.
// 6 - extrai a propriedade text caso exista no objeto.
// 7 - retorna o valor primitivo extraído.
function extractCellValue(cellValue) {
  // 1 - recebe cellValue (qualquer tipo opcional).
  // 2 - retorna string vazia se o valor for nulo ou indefinido.
  if (cellValue === null || cellValue === undefined) return "";

  // 3 - avalia se o valor é um objeto do ExcelJS (richText, result de fórmula ou text).
  if (typeof cellValue === "object") {
    // 4 - extrai e concatena fragmentos de texto se for richText.
    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => part.text || "").join("");
    }
    // 5 - extrai o resultado calculado da fórmula se a propriedade result estiver presente.
    if ("result" in cellValue && cellValue.result !== undefined) {
      return cellValue.result;
    }
    // 6 - extrai a propriedade text caso exista no objeto.
    if ("text" in cellValue && cellValue.text !== undefined) {
      return cellValue.text;
    }
  }

  // 7 - retorna o valor primitivo extraído.
  return cellValue;
}

// função responsável por converter representações textuais ou numéricas de preços e quantidades em valores numéricos float seguros.
//
// contexto: invocada internamente durante a leitura de preços e saldos para aceitar formatos brasileiros (R$, vírgulas) e internacionais.
//
// parâmetros:
//   - rawValue (qualquer tipo, opcional): valor lido da célula da planilha.
//
// retorno: número de ponto flutuante válido ou NaN se a conversão for impossível.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe rawValue (qualquer tipo opcional).
// 2 - verifica se o valor já é do tipo número retornando o próprio valor se finito.
// 3 - converte o dado para string e remove símbolos monetários e espaços em branco.
// 4 - analisa a presença conjunta de ponto e vírgula resolvendo separador de milhar versus separador decimal.
// 5 - converte vírgula decimal isolada para ponto flutuante padrão JavaScript.
// 6 - converte a string resultante em número via Number.
// 7 - retorna o número finito validado ou NaN.
function parseNumberValue(rawValue) {
  // 1 - recebe rawValue (qualquer tipo opcional).
  // 2 - verifica se o valor já é do tipo número retornando o próprio valor se finito.
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : NaN;
  }

  // 3 - converte o dado para string e remove símbolos monetários e espaços em branco.
  let str = String(rawValue ?? "").trim();
  if (!str) return NaN;

  str = str.replace(/[R$\s]/gi, "");

  // 4 - analisa a presença conjunta de ponto e vírgula resolvendo separador de milhar versus separador decimal.
  if (str.includes(",") && str.includes(".")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    // 5 - converte vírgula decimal isolada para ponto flutuante padrão JavaScript.
    str = str.replace(",", ".");
  }

  // 6 - converte a string resultante em número via Number.
  const parsed = Number(str);

  // 7 - retorna o número finito validado ou NaN.
  return Number.isFinite(parsed) ? parsed : NaN;
}

// função responsável por interpretar o status booleano ativo de uma linha de produto importada.
//
// contexto: invocada internamente por importProductsSpreadsheet para converter expressões afirmativas ou negativas em booleano.
//
// parâmetros:
//   - rawValue (qualquer tipo, opcional): valor da coluna de status lido da célula.
//
// retorno: booleano true se ativo, false se inativo, ou null caso o valor não corresponda a nenhum padrão reconhecido.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe rawValue (qualquer tipo opcional).
// 2 - extrai o texto da célula e normaliza o cabeçalho para comparação uniforme.
// 3 - se o valor for vazio, assume true por padrão para produtos novos.
// 4 - avalia sinônimos afirmativos (sim, s, true, 1, ativo, ativa, yes) retornando true.
// 5 - avalia sinônimos negativos (nao, n, false, 0, inativo, inativa, no) retornando false.
// 6 - retorna null se o valor for inválido ou desconhecido.
function parseStatusCell(rawValue) {
  // 1 - recebe rawValue (qualquer tipo opcional).
  // 2 - extrai o texto da célula e normaliza o cabeçalho para comparação uniforme.
  const val = normalizeHeader(extractCellValue(rawValue));

  // 3 - se o valor for vazio, assume true por padrão para produtos novos.
  if (val === "") return true;

  // 4 - avalia sinônimos afirmativos (sim, s, true, 1, ativo, ativa, yes) retornando true.
  if (["sim", "s", "true", "1", "ativo", "ativa", "yes"].includes(val)) return true;

  // 5 - avalia sinônimos negativos (nao, n, false, 0, inativo, inativa, no) retornando false.
  if (["nao", "n", "false", "0", "inativo", "inativa", "no"].includes(val)) return false;

  // 6 - retorna null se o valor for inválido ou desconhecido.
  return null;
}

// função responsável por mapear as colunas do cabeçalho da planilha para as propriedades da entidade Produto.
//
// contexto: invocada internamente por importProductsSpreadsheet para tolerar variações de nomes de colunas na primeira linha.
//
// parâmetros:
//   - headerRow (objeto ExcelJS Row, obrigatório): primeira linha lida da planilha com os nomes de colunas.
//
// retorno: objeto mapeando chaves técnicas (nome, preco, quantidade, etc.) para o índice numérico da coluna na planilha.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe headerRow (objeto ExcelJS Row obrigatório).
// 2 - inicializa objeto vazio columnMap para armazenar índices encontrados.
// 3 - itera pelas células não vazias da linha de cabeçalho.
// 4 - normaliza o nome da coluna e identifica correspondência para nome, descricao, preco, quantidade, categoria, fornecedor e ativo.
// 5 - registra a posição da coluna no mapa indexado pelo identificador técnico.
// 6 - retorna o mapa de correspondência de colunas.
function mapHeaderColumns(headerRow) {
  // 1 - recebe headerRow (objeto ExcelJS Row obrigatório).
  // 2 - inicializa objeto vazio columnMap para armazenar índices encontrados.
  const columnMap = {};

  // 3 - itera pelas células não vazias da linha de cabeçalho.
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    // 4 - normaliza o nome da coluna e identifica correspondência para nome, descricao, preco, quantidade, categoria, fornecedor e ativo.
    const key = normalizeHeader(extractCellValue(cell.value));

    // 5 - registra a posição da coluna no mapa indexado pelo identificador técnico.
    if (["nome", "produto", "nome do produto", "titulo"].includes(key)) {
      columnMap.nome = colNumber;
    } else if (["descricao", "detalhes", "obs", "observacao"].includes(key)) {
      columnMap.descricao = colNumber;
    } else if (["preco", "valor", "preco unitario", "valor unitario"].includes(key)) {
      columnMap.preco = colNumber;
    } else if (["quantidade", "qtd", "estoque", "saldo"].includes(key)) {
      columnMap.quantidade = colNumber;
    } else if (["categoria", "grupo"].includes(key)) {
      columnMap.categoria = colNumber;
    } else if (["fornecedor", "parceiro", "fabricante"].includes(key)) {
      columnMap.fornecedor = colNumber;
    } else if (["ativo", "status", "disponivel"].includes(key)) {
      columnMap.ativo = colNumber;
    }
  });

  // 6 - retorna o mapa de correspondência de colunas.
  return columnMap;
}

// função responsável por gerar a planilha modelo oficial (.xlsx ou .csv) para importação de produtos.
//
// contexto: invocada por productController.js na rota GET /api/products/import/template para download pelo usuário.
//
// parâmetros:
//   - format (string, opcional, padrão 'xlsx'): extensão desejada ('xlsx' ou 'csv').
//
// retorno: objeto contendo buffer (dados binários com BOM para CSV), filename (nome do arquivo) e contentType (MIME type).
// erros: nenhum.
// efeitos colaterais: nenhum (gera arquivo em memória).
//
// passo a passo:
// 1 - recebe format (string opcional com padrão 'xlsx').
// 2 - sanitiza o formato garantindo que seja csv ou xlsx.
// 3 - inicializa uma nova pasta de trabalho ExcelJS e adiciona a aba Modelo Produtos.
// 4 - define as colunas estruturais com larguras adequadas e insere linhas de exemplo representativas.
// 5 - se o formato for csv, exporta o buffer anexando marcador UTF-8 BOM e retorna o arquivo.
// 6 - se o formato for xlsx, estiliza a linha de cabeçalho com cores institucionais e formatação monetária.
// 7 - retorna o arquivo gerado em buffer com seu respectivo MIME type.
export async function generateImportTemplate(format = "xlsx") {
  // 1 - recebe format (string opcional com padrão 'xlsx').
  // 2 - sanitiza o formato garantindo que seja csv ou xlsx.
  const safeFormat = String(format).toLowerCase() === "csv" ? "csv" : "xlsx";

  // 3 - inicializa uma nova pasta de trabalho ExcelJS e adiciona a aba Modelo Produtos.
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Estoque.OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Modelo Produtos");

  // 4 - define as colunas estruturais com larguras adequadas e insere linhas de exemplo representativas.
  sheet.columns = [
    { header: "nome", key: "nome", width: 32 },
    { header: "descricao", key: "descricao", width: 38 },
    { header: "preco", key: "preco", width: 14 },
    { header: "quantidade", key: "quantidade", width: 14 },
    { header: "categoria", key: "categoria", width: 22 },
    { header: "fornecedor", key: "fornecedor", width: 26 },
    { header: "ativo", key: "ativo", width: 12 },
  ];

  sheet.addRow({
    nome: "Teclado Mecânico RGB",
    descricao: "Switch Blue layout ABNT2 com iluminação LED",
    preco: 249.9,
    quantidade: 25,
    categoria: "Periféricos",
    fornecedor: "TechDistribuidora Ltda",
    ativo: "Sim",
  });
  sheet.addRow({
    nome: "Monitor Gamer 24 Polegadas",
    descricao: "Painel IPS Full HD 144Hz 1ms",
    preco: 899.0,
    quantidade: 10,
    categoria: "Monitores",
    fornecedor: "Vision Imports",
    ativo: "Sim",
  });

  // 5 - se o formato for csv, exporta o buffer anexando marcador UTF-8 BOM e retorna o arquivo.
  if (safeFormat === "csv") {
    const csvBuffer = await workbook.csv.writeBuffer();
    const withBom = Buffer.concat([Buffer.from("\uFEFF", "utf8"), Buffer.from(csvBuffer)]);
    return {
      buffer: withBom,
      filename: "modelo-importacao-produtos.csv",
      contentType: "text/csv; charset=utf-8",
    };
  }

  // 6 - se o formato for xlsx, estiliza a linha de cabeçalho com cores institucionais e formatação monetária.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getColumn("preco").numFmt = "#,##0.00";

  // 7 - retorna o arquivo gerado em buffer com seu respectivo MIME type.
  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsxBuffer),
    filename: "modelo-importacao-produtos.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

// função responsável por exportar produtos cadastrados no escopo atual em planilha protegida contra Formula Injection.
//
// contexto: invocada por productController.js na rota GET /api/products/export para download do catálogo.
//
// parâmetros:
//   - scope (objeto, obrigatório): escopo de consulta com organizacaoId, lojaId e lojaSlug opcionais.
//   - orgSlug (string, opcional, padrão 'rede'): slug da organização para compor o nome do arquivo.
//   - format (string, opcional, padrão 'xlsx'): formato de saída ('xlsx' ou 'csv').
//   - status (string, opcional, padrão 'ativos'): filtro de situação ('ativos', 'inativos' ou 'todos').
//
// retorno: objeto contendo buffer, filename, contentType e totalExported.
// erros: AppError (400) se scope.organizacaoId não for fornecido.
// efeitos colaterais: realiza consulta de leitura na tabela Produto do banco de dados.
//
// passo a passo:
// 1 - recebe scope (objeto obrigatório), orgSlug (string opcional), format (string opcional) e status (string opcional).
// 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
// 3 - consulta produtos no banco respeitando o escopo e filtro de status com ordenação por ativo e nome.
// 4 - inicializa a planilha no ExcelJS configurando colunas e adicionando coluna de loja se a consulta for global da rede.
// 5 - preenche as linhas da planilha sanitizando todas as células de texto com sanitizeSpreadsheetCell.
// 6 - se o formato for csv, gera o buffer com codificação UTF-8 e marcação BOM.
// 7 - se o formato for xlsx, estiliza cabeçalhos e máscaras numéricas.
// 8 - retorna o arquivo estruturado com contagem total de produtos exportados.
export async function exportProductsSpreadsheet(
  scope,
  orgSlug = "rede",
  format = "xlsx",
  status = "ativos"
) {
  // 1 - recebe scope (objeto obrigatório), orgSlug (string opcional), format (string opcional) e status (string opcional).
  // 2 - valida a presença de organizacaoId no escopo lançando AppError (400) se ausente.
  if (!scope?.organizacaoId) throw new AppError("Organização não identificada", 400);

  const safeFormat = String(format).toLowerCase() === "csv" ? "csv" : "xlsx";
  const statusFilter =
    status === "ativos" ? { ativo: true } : status === "inativos" ? { ativo: false } : {};

  // 3 - consulta produtos no banco respeitando o escopo e filtro de status com ordenação por ativo e nome.
  const products = await prisma.produto.findMany({
    where: {
      organizacaoId: Number(scope.organizacaoId),
      ...(scope.lojaId ? { lojaId: Number(scope.lojaId) } : {}),
      ...statusFilter,
    },
    include: {
      categoria: { select: { nome: true } },
      fornecedor: { select: { nome: true } },
      loja: { select: { nome: true } },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  // 4 - inicializa a planilha no ExcelJS configurando colunas e adicionando coluna de loja se a consulta for global da rede.
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Estoque.OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Produtos");
  const columns = [
    { header: "nome", key: "nome", width: 32 },
    { header: "descricao", key: "descricao", width: 38 },
    { header: "preco", key: "preco", width: 14 },
    { header: "quantidade", key: "quantidade", width: 14 },
    { header: "categoria", key: "categoria", width: 22 },
    { header: "fornecedor", key: "fornecedor", width: 26 },
    { header: "ativo", key: "ativo", width: 12 },
  ];

  if (!scope.lojaId) {
    columns.push({ header: "loja", key: "loja", width: 24 });
  }
  sheet.columns = columns;

  // 5 - preenche as linhas da planilha sanitizando todas as células de texto com sanitizeSpreadsheetCell.
  for (const prod of products) {
    const rowData = {
      nome: sanitizeSpreadsheetCell(prod.nome),
      descricao: sanitizeSpreadsheetCell(prod.descricao || ""),
      preco: Number(prod.preco || 0),
      quantidade: Number(prod.quantidade || 0),
      categoria: sanitizeSpreadsheetCell(prod.categoria?.nome || ""),
      fornecedor: sanitizeSpreadsheetCell(prod.fornecedor?.nome || ""),
      ativo: prod.ativo ? "Sim" : "Não",
    };
    if (!scope.lojaId) {
      rowData.loja = sanitizeSpreadsheetCell(prod.loja?.nome || "");
    }
    sheet.addRow(rowData);
  }

  const labelSlug = String(scope.lojaSlug || `${orgSlug}-todas-lojas`).replace(
    /[^a-z0-9_-]/gi,
    "-"
  );

  // 6 - se o formato for csv, gera o buffer com codificação UTF-8 e marcação BOM.
  if (safeFormat === "csv") {
    const csvBuffer = await workbook.csv.writeBuffer();
    const withBom = Buffer.concat([Buffer.from("\uFEFF", "utf8"), Buffer.from(csvBuffer)]);
    return {
      buffer: withBom,
      filename: `produtos-${labelSlug}.csv`,
      contentType: "text/csv; charset=utf-8",
      totalExported: products.length,
    };
  }

  // 7 - se o formato for xlsx, estiliza cabeçalhos e máscaras numéricas.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.getColumn("preco").numFmt = "#,##0.00";

  // 8 - retorna o arquivo estruturado com contagem total de produtos exportados.
  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsxBuffer),
    filename: `produtos-${labelSlug}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    totalExported: products.length,
  };
}

// função responsável por importar catálogo em lote (.xlsx ou .csv) para uma loja específica nos modos preview ou commit.
//
// contexto: invocada por productController.js na rota POST /api/products/import para validação ou persistência atômica de planilhas.
//
// parâmetros:
//   - fileBuffer (Buffer, obrigatório): conteúdo binário bruto do arquivo enviado.
//   - originalName (string, obrigatório): nome original do arquivo com extensão .xlsx ou .csv.
//   - storeScope (objeto, obrigatório): escopo de destino contendo organizacaoId, lojaId e lojaNome.
//   - mode (string, opcional, padrão 'commit'): modalidade de execução ('preview' para validação sem gravação ou 'commit' para gravação atômica).
//
// retorno: objeto contendo modo de execução, status de erro, lista de erros de validação e resumo quantitativo de entidades importadas ou criadas.
// erros: AppError (400) se loja/organização não for fornecida, arquivo for vazio/inválido ou não contiver linhas de dados.
// efeitos colaterais: insere categorias, fornecedores e produtos na loja informada quando executado em modo commit.
//
// passo a passo:
// 1 - recebe fileBuffer, originalName, storeScope e mode.
// 2 - valida a presença de organizacaoId, lojaId e do buffer do arquivo lançando AppError (400) se inválidos.
// 3 - carrega e analisa a planilha no ExcelJS de acordo com a extensão .xlsx ou .csv identificando o delimitador.
// 4 - valida a presença de linhas de dados e a existência das colunas obrigatórias 'nome' e 'preco'.
// 5 - itera pelas linhas da planilha validando nomes, preços positivos, quantidades inteiras e status lógicos até o limite de 5000 linhas.
// 6 - consulta categorias e fornecedores já existentes na loja identificando novas entidades a serem cadastradas.
// 7 - se o modo for preview, retorna o relatório de validação com prévias e listas de novos cadastros sem alterar o banco.
// 8 - se houver erros de validação em modo commit, bloqueia a importação e retorna a lista detalhada para correção do usuário.
// 9 - executa transação no banco criando automaticamente novas categorias e fornecedores e inserindo os produtos em lote via createMany.
// 10 - retorna o resumo de importação com sucesso indicando total de produtos, categorias e fornecedores criados.
export async function importProductsSpreadsheet(
  fileBuffer,
  originalName,
  storeScope,
  mode = "commit"
) {
  // 1 - recebe fileBuffer, originalName, storeScope e mode.
  // 2 - valida a presença de organizacaoId, lojaId e do buffer do arquivo lançando AppError (400) se inválidos.
  if (!storeScope?.organizacaoId || !storeScope?.lojaId) {
    throw new AppError("Selecione uma loja válida antes de importar produtos", 400);
  }
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError("Arquivo de planilha vazio ou não enviado", 400);
  }

  const orgId = Number(storeScope.organizacaoId);
  const lojaId = Number(storeScope.lojaId);
  const normalizedMode = String(mode).toLowerCase() === "preview" ? "preview" : "commit";
  const ext = path.extname(originalName || "").toLowerCase();

  if (![".xlsx", ".csv"].includes(ext)) {
    throw new AppError("Formato inválido. Envie apenas arquivos .xlsx ou .csv", 400);
  }

  // 3 - carrega e analisa a planilha no ExcelJS de acordo com a extensão .xlsx ou .csv identificando o delimitador.
  const workbook = new ExcelJS.Workbook();
  try {
    if (ext === ".xlsx") {
      await workbook.xlsx.load(fileBuffer);
    } else {
      const csvText = fileBuffer.toString("utf8").replace(/^\uFEFF/, "");
      const firstNonEmptyLine = csvText.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
      const semiCount = (firstNonEmptyLine.match(/;/g) || []).length;
      const commaCount = (firstNonEmptyLine.match(/,/g) || []).length;
      const delimiter = semiCount > commaCount ? ";" : ",";
      await workbook.csv.read(Readable.from([csvText]), {
        parserOptions: { delimiter },
      });
    }
  } catch {
    throw new AppError(
      "Não foi possível ler a planilha. Verifique se o arquivo não está corrompido.",
      400
    );
  }

  // 4 - valida a presença de linhas de dados e a existência das colunas obrigatórias 'nome' e 'preco'.
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    throw new AppError(
      "A planilha está vazia ou não possui linhas de dados abaixo do cabeçalho",
      400
    );
  }

  const colMap = mapHeaderColumns(sheet.getRow(1));
  if (!colMap.nome || !colMap.preco) {
    throw new AppError(
      'Cabeçalho inválido. A planilha deve conter obrigatoriamente as colunas "nome" e "preco".',
      400
    );
  }

  const validRows = [];
  const errors = [];
  let dataRowCount = 0;

  // 5 - itera pelas linhas da planilha validando nomes, preços positivos, quantidades inteiras e status lógicos até o limite de 5000 linhas.
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const nomeRaw = extractCellValue(row.getCell(colMap.nome).value);
    const descRaw = colMap.descricao ? extractCellValue(row.getCell(colMap.descricao).value) : "";
    const precoRaw = extractCellValue(row.getCell(colMap.preco).value);
    const qtdRaw = colMap.quantidade ? extractCellValue(row.getCell(colMap.quantidade).value) : "";
    const catRaw = colMap.categoria ? extractCellValue(row.getCell(colMap.categoria).value) : "";
    const supRaw = colMap.fornecedor ? extractCellValue(row.getCell(colMap.fornecedor).value) : "";
    const ativoRaw = colMap.ativo ? extractCellValue(row.getCell(colMap.ativo).value) : "";

    const nome = String(nomeRaw ?? "").trim();
    const descricao = String(descRaw ?? "").trim();
    const categoriaNome = String(catRaw ?? "").trim();
    const fornecedorNome = String(supRaw ?? "").trim();

    const isRowBlank =
      !nome &&
      !descricao &&
      String(precoRaw ?? "").trim() === "" &&
      String(qtdRaw ?? "").trim() === "" &&
      !categoriaNome &&
      !fornecedorNome;
    if (isRowBlank) return;

    dataRowCount += 1;
    if (dataRowCount > MAX_IMPORT_ROWS) {
      if (dataRowCount === MAX_IMPORT_ROWS + 1) {
        errors.push({
          line: rowNumber,
          message: `Limite máximo de ${MAX_IMPORT_ROWS} produtos por importação excedido.`,
        });
      }
      return;
    }

    const rowErrors = [];
    if (!nome) rowErrors.push("Nome do produto é obrigatório");

    const preco = parseNumberValue(precoRaw);
    if (isNaN(preco) || preco < 0) {
      rowErrors.push("Preço inválido (informe um número maior ou igual a 0)");
    }

    let quantidade = 0;
    if (String(qtdRaw ?? "").trim() !== "") {
      const parsedQtd = parseNumberValue(qtdRaw);
      if (isNaN(parsedQtd) || parsedQtd < 0 || !Number.isInteger(parsedQtd)) {
        rowErrors.push("Quantidade inválida (informe um número inteiro >= 0)");
      } else {
        quantidade = parsedQtd;
      }
    }

    const ativo = parseStatusCell(ativoRaw);
    if (ativo === null) {
      rowErrors.push("Valor inválido na coluna ativo (use Sim/Não ou true/false)");
    }

    if (rowErrors.length > 0) {
      errors.push({
        line: rowNumber,
        nome: nome || "(Sem nome)",
        message: rowErrors.join("; "),
      });
      return;
    }

    validRows.push({
      line: rowNumber,
      nome,
      descricao: descricao || null,
      preco: Number(preco.toFixed(2)),
      quantidade,
      categoriaNome: categoriaNome || null,
      fornecedorNome: fornecedorNome || null,
      ativo,
    });
  });

  if (dataRowCount === 0 && errors.length === 0) {
    throw new AppError("Nenhum produto encontrado para importar na planilha", 400);
  }

  // 6 - consulta categorias e fornecedores já existentes na loja identificando novas entidades a serem cadastradas.
  const [existingCategories, existingSuppliers] = await Promise.all([
    prisma.categoria.findMany({
      where: { lojaId },
      select: { id: true, nome: true },
    }),
    prisma.fornecedor.findMany({
      where: { lojaId },
      select: { id: true, nome: true },
    }),
  ]);

  const catMap = new Map(existingCategories.map((c) => [c.nome.trim().toLowerCase(), c.id]));
  const supMap = new Map(existingSuppliers.map((s) => [s.nome.trim().toLowerCase(), s.id]));

  const newCategories = [];
  const seenNewCats = new Set();
  const newSuppliers = [];
  const seenNewSups = new Set();

  for (const r of validRows) {
    if (r.categoriaNome) {
      const key = r.categoriaNome.toLowerCase();
      if (!catMap.has(key) && !seenNewCats.has(key)) {
        seenNewCats.add(key);
        newCategories.push(r.categoriaNome);
      }
    }
    if (r.fornecedorNome) {
      const key = r.fornecedorNome.toLowerCase();
      if (!supMap.has(key) && !seenNewSups.has(key)) {
        seenNewSups.add(key);
        newSuppliers.push(r.fornecedorNome);
      }
    }
  }

  // 7 - se o modo for preview, retorna o relatório de validação com prévias e listas de novos cadastros sem alterar o banco.
  if (normalizedMode === "preview") {
    return {
      mode: "preview",
      lojaNome: storeScope.lojaNome,
      hasErrors: errors.length > 0,
      totalRows: dataRowCount,
      validCount: validRows.length,
      invalidCount: errors.length,
      errors: errors.slice(0, 100),
      previewRows: validRows.slice(0, 50),
      newCategories,
      newSuppliers,
    };
  }

  // 8 - se houver erros de validação em modo commit, bloqueia a importação e retorna a lista detalhada para correção do usuário.
  if (errors.length > 0) {
    return {
      mode: "commit",
      hasErrors: true,
      message: `Foram encontrados ${errors.length} erro(s) na planilha. Corrija as linhas indicadas antes de importar.`,
      totalRows: dataRowCount,
      validCount: validRows.length,
      invalidCount: errors.length,
      errors: errors.slice(0, 100),
      newCategories,
      newSuppliers,
    };
  }

  if (validRows.length === 0) {
    throw new AppError("Nenhum produto válido encontrado na planilha para importação", 400);
  }

  // 9 - executa transação no banco criando automaticamente novas categorias e fornecedores e inserindo os produtos em lote via createMany.
  const commitResult = await prisma.$transaction(async (tx) => {
    let createdCategoriesCount = 0;
    let createdSuppliersCount = 0;

    for (const catName of newCategories) {
      const createdCat = await tx.categoria.create({
        data: {
          nome: catName,
          ativo: true,
          organizacaoId: orgId,
          lojaId,
        },
      });
      catMap.set(catName.toLowerCase(), createdCat.id);
      createdCategoriesCount += 1;
    }

    for (const supName of newSuppliers) {
      const createdSup = await tx.fornecedor.create({
        data: {
          nome: supName,
          ativo: true,
          organizacaoId: orgId,
          lojaId,
        },
      });
      supMap.set(supName.toLowerCase(), createdSup.id);
      createdSuppliersCount += 1;
    }

    const productsPayload = validRows.map((row) => ({
      nome: row.nome,
      descricao: row.descricao,
      preco: row.preco,
      quantidade: row.quantidade,
      ativo: row.ativo,
      organizacaoId: orgId,
      lojaId,
      categoriaId: row.categoriaNome ? catMap.get(row.categoriaNome.toLowerCase()) || null : null,
      fornecedorId: row.fornecedorNome ? supMap.get(row.fornecedorNome.toLowerCase()) || null : null,
    }));

    const batch = await tx.produto.createMany({ data: productsPayload });
    return {
      createdCount: batch.count,
      createdCategoriesCount,
      createdSuppliersCount,
    };
  });

  // 10 - retorna o resumo de importação com sucesso indicando total de produtos, categorias e fornecedores criados.
  return {
    mode: "commit",
    hasErrors: false,
    message: `${commitResult.createdCount} produto(s) importado(s) com sucesso para a loja "${storeScope.lojaNome}".`,
    totalRows: dataRowCount,
    ...commitResult,
  };
}
