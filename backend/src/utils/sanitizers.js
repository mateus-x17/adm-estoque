import fs from "fs";
import path from "path";

// arquivo responsável por utilitários de sanitização de dados sensíveis, URLs seguras, arquivos locais e normalização de flags booleanas, atuando na camada utilitária com Node.js nativo.

const UPLOADS_ROOT_DIR = path.resolve("uploads");

// função responsável por limpar dados sensíveis de um usuário antes de retornar pela API.
//
// 1 - recebe o objeto de usuário (object|null).
// 2 - verifica se o usuário é nulo ou indefinido.
// 3 - remove a propriedade senha por desestruturação.
// 4 - retorna o objeto seguro ou null.
export function sanitizeUser(user) {
  if (!user) return null;
  const { senha, ...safe } = user;
  return safe;
}

// função responsável por limpar dados sensíveis de uma lista de usuários.
//
// 1 - recebe um array de objetos de usuários (Array).
// 2 - aplica sanitizeUser em cada elemento da coleção.
// 3 - retorna o novo array apenas com dados públicos seguros.
export function sanitizeUsers(users) {
  return users.map(sanitizeUser);
}

// função responsável por converter valores booleanos vindos de JSON, query strings ou FormData de forma segura.
//
// 1 - recebe um valor de entrada de tipo dinâmico (boolean|string|number).
// 2 - retorna diretamente se já for booleano.
// 3 - normaliza strings comuns ('false', '0', 'nao', 'true', '1', 'sim') sem cair na armadilha de Boolean('false').
// 4 - retorna o valor booleano equivalente.
export function parseBooleanFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "nao", "não", "inativo", "no", ""].includes(normalized)) {
      return false;
    }
    if (["true", "1", "sim", "ativo", "yes"].includes(normalized)) {
      return true;
    }
  }
  return Boolean(value);
}

// função responsável por validar se uma URL de mídia/comprovante usa protocolo seguro (http, https ou /uploads).
//
// 1 - recebe rawUrl (string|null) e allowRelativeUploads (boolean opcional, padrão true).
// 2 - normaliza espaços e retorna null caso esteja vazio.
// 3 - aceita apenas URLs http://, https:// ou caminhos locais iniciados por /uploads/ sem sequências de travessia ('..').
// 4 - retorna a string validada ou null se o protocolo for inválido (ex.: javascript: ou data:).
export function sanitizeSafeUrl(rawUrl, allowRelativeUploads = true) {
  if (rawUrl === undefined || rawUrl === null) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return trimmed;
  }

  if (
    allowRelativeUploads &&
    trimmed.startsWith("/uploads/") &&
    !trimmed.includes("..") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }

  return null;
}

// função responsável por apagar com segurança um arquivo local armazenado estritamente dentro da pasta uploads.
//
// 1 - recebe imagePath (string) contendo o caminho relativo salvo no banco (ex.: /uploads/produtos/foto.png).
// 2 - valida se o caminho não é remoto (http/https) e resolve seu caminho absoluto no sistema de arquivos.
// 3 - garante que o alvo esteja contido estritamente dentro de UPLOADS_ROOT_DIR para prevenir Path Traversal.
// 4 - executa fs.unlinkSync quando existente ignorando falhas transitórias e não retorna valor.
export function removeLocalUploadIfSafe(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return;

  const relativePath = imagePath.replace(/^\/+/, "");
  const resolvedTarget = path.resolve(relativePath);
  const allowedPrefix = `${UPLOADS_ROOT_DIR}${path.sep}`;

  if (!resolvedTarget.startsWith(allowedPrefix)) return;

  if (fs.existsSync(resolvedTarget)) {
    try {
      fs.unlinkSync(resolvedTarget);
    } catch {
      /* ignora erro ao remover arquivo local temporário */
    }
  }
}

// função responsável por neutralizar células de planilhas exportadas contra CSV/Excel Formula Injection.
//
// 1 - recebe value (string|number|null) representando o conteúdo da célula.
// 2 - retorna string vazia se for nulo ou indefinido.
// 3 - prefixa com apóstrofo (') caso o texto comece com '=', '+', '-', '@', tabulação ou quebra de linha.
// 4 - retorna o texto seguro para gravação na planilha.
export function sanitizeSpreadsheetCell(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
