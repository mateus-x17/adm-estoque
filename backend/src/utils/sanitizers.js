// arquivo responsável por utilitários de sanitização de dados sensíveis, validação de URLs seguras, remoção segura de arquivos locais e normalização de flags booleanas.
// atua na camada de utilitários de higienização de dados e segurança do backend.
// tecnologias principais: Node.js fs e path nativos.
// usado por: controllers, services e middlewares para proteção contra vazamento de senhas, CSV injection, SSRF e path traversal.

// importações de arquivos: fs valida e exclui arquivos do disco local com segurança.
import fs from "fs";
// importações de caminhos: path resolve e restringe caminhos no sistema de arquivos.
import path from "path";

// diretório raiz absoluto dos uploads da aplicação para validação contra travessia de pastas
const UPLOADS_ROOT_DIR = path.resolve("uploads");

// função responsável por limpar dados sensíveis (remover senha) de um objeto de usuário antes do retorno pela API.
//
// contexto: invocada por authService, userService e controladores de autenticação para evitar exposição de hashes bcrypt.
//
// parâmetros:
//   - user (objeto|null, obrigatório): registro do usuário retornado pelo Prisma ou sessão.
//
// retorno: novo objeto com todos os campos do usuário exceto a chave senha, ou null se a entrada for nula.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura de transformação).
//
// passo a passo:
// 1 - recebe o objeto user.
// 2 - retorna null caso user seja nulo ou indefinido.
// 3 - desestrutura o objeto separando a propriedade senha dos demais atributos seguros.
// 4 - retorna o novo objeto sem o campo senha.
export function sanitizeUser(user) {
  // 2 - trata entrada nula
  if (!user) return null;
  // 3 e 4 - remove senha e retorna
  const { senha, ...safe } = user;
  return safe;
}

// função responsável por limpar dados sensíveis de uma coleção de usuários.
//
// contexto: utilizada na listagem de usuários e equipes para remover o campo de senha de todos os itens do array.
//
// parâmetros:
//   - users (array, obrigatório): lista de objetos de usuário.
//
// retorno: novo array contendo os usuários sanitizados sem a propriedade senha.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe a lista users.
// 2 - itera sobre o array aplicando a função sanitizeUser em cada item.
// 3 - retorna a nova coleção tratada.
export function sanitizeUsers(users) {
  // 2 e 3 - mapeia a coleção aplicando sanitizeUser
  return users.map(sanitizeUser);
}

// função responsável por converter valores dinâmicos vindos de JSON, query string ou FormData em booleano estrito.
//
// contexto: utilizada para normalizar parâmetros como ativo, restrictToUserStore e filtros de status.
//
// parâmetros:
//   - value (boolean|string|number|null|undefined, obrigatório): dado a ser convertido.
//
// retorno: booleano estrito (true ou false).
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe o valor value.
// 2 - retorna o próprio valor caso já seja do tipo booleano.
// 3 - se for string, remove espaços e converte para minúsculas.
// 4 - se for 'false', '0', 'nao', 'não', 'inativo', 'no' ou vazia, retorna false.
// 5 - se for 'true', '1', 'sim', 'ativo' ou 'yes', retorna true.
// 6 - para outros tipos, retorna Boolean(value).
export function parseBooleanFlag(value) {
  // 2 - retorno direto se já booleano
  if (typeof value === "boolean") return value;
  // 3 a 5 - tratamento de strings textuais
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "nao", "não", "inativo", "no", ""].includes(normalized)) {
      return false;
    }
    if (["true", "1", "sim", "ativo", "yes"].includes(normalized)) {
      return true;
    }
  }
  // 6 - fallback para conversão padrão
  return Boolean(value);
}

// função responsável por validar se uma URL de mídia ou comprovante utiliza protocolo permitido (HTTP, HTTPS ou /uploads local).
//
// contexto: invocada antes de gravar URLs de imagens ou emitir links públicos para impedir XSS via javascript: ou data: URIs.
//
// parâmetros:
//   - rawUrl (string|null, obrigatório): endereço da mídia informado.
//   - allowRelativeUploads (boolean, opcional, padrão true): flag que autoriza caminhos relativos locais iniciados por /uploads/.
//
// retorno: string da URL validada ou null caso viole os protocolos seguros.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe rawUrl e allowRelativeUploads.
// 2 - retorna null se rawUrl for nulo ou vazio após trim().
// 3 - aceita e retorna a string caso inicie com https:// ou http://.
// 4 - caso allowRelativeUploads seja true e o endereço inicie por /uploads/ sem caracteres de travessia ('..' ou '\\'), aceita e retorna.
// 5 - caso contrário, rejeita retornando null.
export function sanitizeSafeUrl(rawUrl, allowRelativeUploads = true) {
  // 2 - valida presença do dado
  if (rawUrl === undefined || rawUrl === null) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  // 3 - valida protocolo web
  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return trimmed;
  }

  // 4 - valida caminho local seguro
  if (
    allowRelativeUploads &&
    trimmed.startsWith("/uploads/") &&
    !trimmed.includes("..") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }

  // 5 - rejeita protocolos inseguros
  return null;
}

// função responsável por excluir de forma segura um arquivo local garantindo que pertença estritamente ao diretório uploads.
//
// contexto: invocada durante a atualização ou deleção de produtos e avatares para apagar a foto antiga do disco local sem risco de Path Traversal.
//
// parâmetros:
//   - imagePath (string, obrigatório): caminho relativo do arquivo salvo no banco (ex.: '/uploads/produtos/foto.png').
//
// retorno: nenhum (função de efeito colateral com tratamento de falhas silencioso).
// erros: nenhum (erros de exclusão de arquivos transitórios são suprimidos).
// efeitos colaterais: remove o arquivo do sistema de arquivos através de fs.unlinkSync.
//
// passo a passo:
// 1 - recebe o caminho imagePath.
// 2 - retorna sem ação se o caminho for vazio, não for string ou for uma URL remota (http/https).
// 3 - resolve o caminho absoluto do arquivo no disco.
// 4 - valida se o caminho absoluto inicia estritamente com o prefixo UPLOADS_ROOT_DIR para impedir Path Traversal.
// 5 - se o arquivo existir, executa fs.unlinkSync dentro de um bloco try/catch para remoção definitiva.
export function removeLocalUploadIfSafe(imagePath) {
  // 2 - encerra se for vazio ou link remoto
  if (!imagePath || typeof imagePath !== "string") return;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return;

  // 3 e 4 - valida restrição dentro de UPLOADS_ROOT_DIR
  const relativePath = imagePath.replace(/^\/+/, "");
  const resolvedTarget = path.resolve(relativePath);
  const allowedPrefix = `${UPLOADS_ROOT_DIR}${path.sep}`;

  if (!resolvedTarget.startsWith(allowedPrefix)) return;

  // 5 - apaga o arquivo físico
  if (fs.existsSync(resolvedTarget)) {
    try {
      fs.unlinkSync(resolvedTarget);
    } catch {
      /* ignora erro ao remover arquivo local temporário */
    }
  }
}

// função responsável por neutralizar caracteres de injeção de fórmulas (CSV/Excel Formula Injection) em células exportadas.
//
// contexto: invocada por productSpreadsheetService e geradores de relatórios antes de preencher células do ExcelJS.
//
// parâmetros:
//   - value (string|number|null|undefined, obrigatório): dado a ser inserido na célula da planilha.
//
// retorno: string segura (prefixada com apóstrofo caso inicie com operadores executáveis do Excel).
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe value.
// 2 - retorna string vazia se o valor for nulo ou indefinido.
// 3 - converte o valor para string.
// 4 - verifica se o primeiro caractere é '=', '+', '-', '@', tabulação ou quebra de linha.
// 5 - se positivo, prefixa com apóstrofo (') para forçar interpretação textual no Excel.
// 6 - caso contrário, retorna a string original inalterada.
export function sanitizeSpreadsheetCell(value) {
  // 2 - trata valores vazios
  if (value === undefined || value === null) return "";
  // 3 - converte para string
  const str = String(value);
  // 4 a 6 - neutraliza operadores de fórmula
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
