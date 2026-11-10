import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import path from 'path';
import { prisma } from '../config/prismaClient.js';
import { AppError } from '../utils/errorHandler.js';

// arquivo responsável pela importação e exportação nativa de planilhas de produtos (.xlsx e .csv) via ExcelJS por loja

const MAX_IMPORT_ROWS = 5000;

// função auxiliar para normalizar nomes de cabeçalhos removendo acentos, espaços extras e maiúsculas
// 1 - Converte entrada para texto minúsculo e remove diacríticos (acentos)
// 2 - Padroniza espaços internos para facilitar mapeamento flexível de colunas do Excel
function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// função auxiliar para extrair o valor textual real de uma célula do ExcelJS (tratando fórmulas e richText)
// 1 - Verifica se a célula contém objeto composto do ExcelJS (richText, result de fórmula ou text de hyperlink)
// 2 - Retorna o valor primitivo limpo para parsing seguro
function extractCellValue(cellValue) {
  if (cellValue === null || cellValue === undefined) return '';
  if (typeof cellValue === 'object') {
    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => part.text || '').join('');
    }
    if ('result' in cellValue && cellValue.result !== undefined) {
      return cellValue.result;
    }
    if ('text' in cellValue && cellValue.text !== undefined) {
      return cellValue.text;
    }
  }
  return cellValue;
}

// função auxiliar para converter strings monetárias e numéricas brasileiras (ex: "R$ 1.299,90") em Number
// 1 - Se já for number válido, devolve diretamente
// 2 - Remove símbolos de moeda e espaços; trata separador decimal vírgula vs ponto de milhar
// 3 - Retorna NaN caso não seja um número válido
function parseNumberValue(rawValue) {
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : NaN;
  }
  let str = String(rawValue ?? '').trim();
  if (!str) return NaN;

  // Remove prefixo monetário e espaços internos
  str = str.replace(/[R$\s]/gi, '');

  // Se houver vírgula e ponto (ex: 1.250,90), remove ponto de milhar e troca vírgula por ponto
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : NaN;
}

// função auxiliar para interpretar flags de status ativo/inativo na planilha
// 1 - Assume true quando a coluna ativo é omitida ou vazia
// 2 - Reconhece variantes em PT-BR e inglês ('sim', 's', 'true', '1', 'ativo' / 'nao', 'não', 'false', '0', 'inativo')
// 3 - Retorna null caso o valor seja irreconhecível para sinalizar erro de validação na linha
function parseStatusCell(rawValue) {
  const val = normalizeHeader(extractCellValue(rawValue));
  if (val === '') return true;
  if (['sim', 's', 'true', '1', 'ativo', 'ativa', 'yes'].includes(val)) return true;
  if (['nao', 'n', 'false', '0', 'inativo', 'inativa', 'no'].includes(val)) return false;
  return null;
}

// função auxiliar para mapear colunas do cabeçalho da planilha para campos internos do produto
// 1 - Percorre as células da linha 1 da worksheet
// 2 - Associa sinônimos aceitos ('nome'/'produto', 'preco'/'valor', 'quantidade'/'qtd'/'estoque', etc.)
// 3 - Retorna objeto com os índices de cada coluna encontrada (1-based)
function mapHeaderColumns(headerRow) {
  const columnMap = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(extractCellValue(cell.value));
    if (['nome', 'produto', 'nome do produto', 'titulo'].includes(key)) {
      columnMap.nome = colNumber;
    } else if (['descricao', 'detalhes', 'obs', 'observacao'].includes(key)) {
      columnMap.descricao = colNumber;
    } else if (['preco', 'valor', 'preco unitario', 'valor unitario'].includes(key)) {
      columnMap.preco = colNumber;
    } else if (['quantidade', 'qtd', 'estoque', 'saldo'].includes(key)) {
      columnMap.quantidade = colNumber;
    } else if (['categoria', 'grupo'].includes(key)) {
      columnMap.categoria = colNumber;
    } else if (['fornecedor', 'parceiro', 'fabricante'].includes(key)) {
      columnMap.fornecedor = colNumber;
    } else if (['ativo', 'status', 'disponivel'].includes(key)) {
      columnMap.ativo = colNumber;
    }
  });
  return columnMap;
}

// serviço para gerar planilha modelo pronta para preenchimento e importação (.xlsx ou .csv)
// 1 - Configura o workbook com as colunas oficiais do sistema e duas linhas de exemplo realistas
// 2 - Estiliza o cabeçalho em .xlsx para melhor experiência visual do lojista
// 3 - Gera CSV com BOM UTF-8 caso o formato solicitado seja 'csv', garantindo compatibilidade com Excel PT-BR
// 4 - Retorna Buffer, nome sugerido do arquivo e Content-Type adequado
export async function generateImportTemplate(format = 'xlsx') {
  const safeFormat = String(format).toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Estoque.OS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Modelo Produtos');
  sheet.columns = [
    { header: 'nome', key: 'nome', width: 32 },
    { header: 'descricao', key: 'descricao', width: 38 },
    { header: 'preco', key: 'preco', width: 14 },
    { header: 'quantidade', key: 'quantidade', width: 14 },
    { header: 'categoria', key: 'categoria', width: 22 },
    { header: 'fornecedor', key: 'fornecedor', width: 26 },
    { header: 'ativo', key: 'ativo', width: 12 },
  ];

  sheet.addRow({
    nome: 'Teclado Mecânico RGB',
    descricao: 'Switch Blue layout ABNT2 com iluminação LED',
    preco: 249.9,
    quantidade: 25,
    categoria: 'Periféricos',
    fornecedor: 'TechDistribuidora Ltda',
    ativo: 'Sim',
  });
  sheet.addRow({
    nome: 'Monitor Gamer 24 Polegadas',
    descricao: 'Painel IPS Full HD 144Hz 1ms',
    preco: 899.0,
    quantidade: 10,
    categoria: 'Monitores',
    fornecedor: 'Vision Imports',
    ativo: 'Sim',
  });

  if (safeFormat === 'csv') {
    const csvBuffer = await workbook.csv.writeBuffer();
    const withBom = Buffer.concat([Buffer.from('\uFEFF', 'utf8'), Buffer.from(csvBuffer)]);
    return {
      buffer: withBom,
      filename: 'modelo-importacao-produtos.csv',
      contentType: 'text/csv; charset=utf-8',
    };
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getColumn('preco').numFmt = '#,##0.00';

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsxBuffer),
    filename: 'modelo-importacao-produtos.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

// serviço para exportar o catálogo de produtos do estabelecimento para .xlsx ou .csv
// 1 - Valida empresaId e consulta produtos filtrando pelo status solicitado ('ativos', 'inativos' ou 'todos')
// 2 - Preenche planilha mantendo exatamente as mesmas colunas do modelo (permitindo edição e reimportação)
// 3 - Retorna Buffer pronto para download HTTP, nome do arquivo com slug da loja e total exportado
export async function exportProductsSpreadsheet(
  empresaId,
  empresaSlug = 'loja',
  format = 'xlsx',
  status = 'ativos'
) {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);

  const safeFormat = String(format).toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  const statusFilter =
    status === 'ativos' ? { ativo: true } : status === 'inativos' ? { ativo: false } : {};

  const products = await prisma.produto.findMany({
    where: {
      empresaId: Number(empresaId),
      ...statusFilter,
    },
    include: {
      categoria: { select: { nome: true } },
      fornecedor: { select: { nome: true } },
    },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Estoque.OS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Produtos');
  sheet.columns = [
    { header: 'nome', key: 'nome', width: 32 },
    { header: 'descricao', key: 'descricao', width: 38 },
    { header: 'preco', key: 'preco', width: 14 },
    { header: 'quantidade', key: 'quantidade', width: 14 },
    { header: 'categoria', key: 'categoria', width: 22 },
    { header: 'fornecedor', key: 'fornecedor', width: 26 },
    { header: 'ativo', key: 'ativo', width: 12 },
  ];

  for (const prod of products) {
    sheet.addRow({
      nome: prod.nome,
      descricao: prod.descricao || '',
      preco: Number(prod.preco || 0),
      quantidade: Number(prod.quantidade || 0),
      categoria: prod.categoria?.nome || '',
      fornecedor: prod.fornecedor?.nome || '',
      ativo: prod.ativo ? 'Sim' : 'Não',
    });
  }

  const safeSlug = String(empresaSlug || 'loja').replace(/[^a-z0-9_-]/gi, '-');

  if (safeFormat === 'csv') {
    const csvBuffer = await workbook.csv.writeBuffer();
    const withBom = Buffer.concat([Buffer.from('\uFEFF', 'utf8'), Buffer.from(csvBuffer)]);
    return {
      buffer: withBom,
      filename: `produtos-${safeSlug}.${safeFormat}`,
      contentType: 'text/csv; charset=utf-8',
      totalExported: products.length,
    };
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  };
  sheet.getColumn('preco').numFmt = '#,##0.00';

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsxBuffer),
    filename: `produtos-${safeSlug}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    totalExported: products.length,
  };
}

// serviço para importar produtos em lote via planilha (.xlsx ou .csv) com suporte a preview e transação atômica
// 1 - Valida presença e extensão do arquivo enviado (.xlsx ou .csv) e carrega via ExcelJS (auto-detectando ';' vs ',' em CSV)
// 2 - Mapeia as colunas do cabeçalho e verifica teto máximo de 5.000 linhas por segurança
// 3 - Valida linha por linha acumulando erros detalhados (nome, preço >= 0, quantidade inteira >= 0, status booleano)
// 4 - Identifica categorias e fornecedores novos que serão criados no estabelecimento atual
// 5 - Se mode === 'preview', devolve resumo completo sem gravar no banco
// 6 - Se mode === 'commit' e houver erros, aborta sem alterações; caso tudo válido, persiste em transação atômica
export async function importProductsSpreadsheet(fileBuffer, originalName, empresaId, mode = 'commit') {
  if (!empresaId) throw new AppError('Estabelecimento não identificado', 400);
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError('Arquivo de planilha vazio ou não enviado', 400);
  }

  const tenantId = Number(empresaId);
  const normalizedMode = String(mode).toLowerCase() === 'preview' ? 'preview' : 'commit';
  const ext = path.extname(originalName || '').toLowerCase();

  if (!['.xlsx', '.csv'].includes(ext)) {
    throw new AppError('Formato inválido. Envie apenas arquivos .xlsx ou .csv', 400);
  }

  const workbook = new ExcelJS.Workbook();
  try {
    if (ext === '.xlsx') {
      await workbook.xlsx.load(fileBuffer);
    } else {
      const csvText = fileBuffer.toString('utf8').replace(/^\uFEFF/, '');
      const firstNonEmptyLine = csvText.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
      const semiCount = (firstNonEmptyLine.match(/;/g) || []).length;
      const commaCount = (firstNonEmptyLine.match(/,/g) || []).length;
      const delimiter = semiCount > commaCount ? ';' : ',';
      await workbook.csv.read(Readable.from([csvText]), {
        parserOptions: { delimiter },
      });
    }
  } catch (err) {
    throw new AppError('Não foi possível ler a planilha. Verifique se o arquivo não está corrompido.', 400);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    throw new AppError('A planilha está vazia ou não possui linhas de dados abaixo do cabeçalho', 400);
  }

  const headerRow = sheet.getRow(1);
  const colMap = mapHeaderColumns(headerRow);

  if (!colMap.nome || !colMap.preco) {
    throw new AppError(
      'Cabeçalho inválido. A planilha deve conter obrigatoriamente as colunas "nome" e "preco".',
      400
    );
  }

  const validRows = [];
  const errors = [];
  let dataRowCount = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Pula cabeçalho

    const nomeRaw = extractCellValue(row.getCell(colMap.nome).value);
    const descRaw = colMap.descricao ? extractCellValue(row.getCell(colMap.descricao).value) : '';
    const precoRaw = extractCellValue(row.getCell(colMap.preco).value);
    const qtdRaw = colMap.quantidade ? extractCellValue(row.getCell(colMap.quantidade).value) : '';
    const catRaw = colMap.categoria ? extractCellValue(row.getCell(colMap.categoria).value) : '';
    const supRaw = colMap.fornecedor ? extractCellValue(row.getCell(colMap.fornecedor).value) : '';
    const ativoRaw = colMap.ativo ? extractCellValue(row.getCell(colMap.ativo).value) : '';

    const nome = String(nomeRaw ?? '').trim();
    const descricao = String(descRaw ?? '').trim();
    const categoriaNome = String(catRaw ?? '').trim();
    const fornecedorNome = String(supRaw ?? '').trim();

    // Ignora linhas completamente em branco
    const isRowBlank =
      !nome &&
      !descricao &&
      String(precoRaw ?? '').trim() === '' &&
      String(qtdRaw ?? '').trim() === '' &&
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

    if (!nome) {
      rowErrors.push('Nome do produto é obrigatório');
    }

    const preco = parseNumberValue(precoRaw);
    if (isNaN(preco) || preco < 0) {
      rowErrors.push('Preço inválido (informe um número maior ou igual a 0)');
    }

    let quantidade = 0;
    if (String(qtdRaw ?? '').trim() !== '') {
      const parsedQtd = parseNumberValue(qtdRaw);
      if (isNaN(parsedQtd) || parsedQtd < 0 || !Number.isInteger(parsedQtd)) {
        rowErrors.push('Quantidade inválida (informe um número inteiro >= 0)');
      } else {
        quantidade = parsedQtd;
      }
    }

    const ativo = parseStatusCell(ativoRaw);
    if (ativo === null) {
      rowErrors.push('Valor inválido na coluna ativo (use Sim/Não ou true/false)');
    }

    if (rowErrors.length > 0) {
      errors.push({
        line: rowNumber,
        nome: nome || '(Sem nome)',
        message: rowErrors.join('; '),
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
    throw new AppError('Nenhum produto encontrado para importar na planilha', 400);
  }

  // Verifica categorias e fornecedores existentes apenas dentro do tenant atual
  const [existingCategories, existingSuppliers] = await Promise.all([
    prisma.categoria.findMany({
      where: { empresaId: tenantId },
      select: { id: true, nome: true },
    }),
    prisma.fornecedor.findMany({
      where: { empresaId: tenantId },
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

  if (normalizedMode === 'preview') {
    return {
      mode: 'preview',
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

  // Modo commit: aborta atomicamente caso haja erros de validação ou nenhuma linha válida
  if (errors.length > 0) {
    return {
      mode: 'commit',
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
    throw new AppError('Nenhum produto válido encontrado na planilha para importação', 400);
  }

  const commitResult = await prisma.$transaction(async (tx) => {
    let createdCategoriesCount = 0;
    let createdSuppliersCount = 0;

    for (const catName of newCategories) {
      const createdCat = await tx.categoria.create({
        data: {
          nome: catName,
          ativo: true,
          empresaId: tenantId,
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
          empresaId: tenantId,
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
      empresaId: tenantId,
      categoriaId: row.categoriaNome ? catMap.get(row.categoriaNome.toLowerCase()) || null : null,
      fornecedorId: row.fornecedorNome ? supMap.get(row.fornecedorNome.toLowerCase()) || null : null,
    }));

    const batch = await tx.produto.createMany({
      data: productsPayload,
    });

    return {
      createdCount: batch.count,
      createdCategoriesCount,
      createdSuppliersCount,
    };
  });

  return {
    mode: 'commit',
    hasErrors: false,
    message: `${commitResult.createdCount} produto(s) importado(s) com sucesso para o estabelecimento.`,
    totalRows: dataRowCount,
    ...commitResult,
  };
}
