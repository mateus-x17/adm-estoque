// arquivo responsável por configurar o armazenamento em disco e filtros de segurança de uploads locais com Multer.
// atua na camada de configuração e middleware de uploads do backend.
// tecnologias principais: Multer, Node.js path, fs e crypto.
// usado por: rotas de produtos, usuários e pedidos para processamento multipart/form-data de imagens e comprovantes.

// importações da biblioteca Multer: multer provê os middlewares de interceptação e manipulação de formulários multipart.
import multer from "multer";
// importações do sistema de caminhos: path resolve e normaliza diretórios de arquivos no sistema operacional.
import path from "path";
// importações de arquivos: fs cria e verifica a existência das pastas de upload em tempo de execução.
import fs from "fs";
// importações de criptografia: crypto gera sufixos aleatórios seguros para os nomes dos arquivos salvos.
import crypto from "crypto";
// importações de erros operacionais: AppError formata mensagens de erro HTTP 400 em caso de extensão inválida.
import { AppError } from "../utils/errorHandler.js";

// caminhos absolutos dos diretórios de upload locais segregados por domínio funcional
const uploadsDir = path.resolve("uploads");
const usuariosDir = path.join(uploadsDir, "usuarios");
const produtosDir = path.join(uploadsDir, "produtos");
const comprovantesDir = path.join(uploadsDir, "comprovantes");

// garante a existência física dos diretórios no disco local na inicialização da aplicação
[uploadsDir, usuariosDir, produtosDir, comprovantesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// expressões regulares e conjuntos permitidos para validação estrita de fotos e comprovantes
const ALLOWED_IMAGE_EXT = /^\.(jpeg|jpg|webp|jfif|png)$/i;
const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_PROOF_EXT = /^\.(jpeg|jpg|webp|jfif|png|pdf)$/i;
const ALLOWED_PROOF_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  "application/pdf",
]);

// estratégia de armazenamento em disco segregando pastas por rota e gerando nomes únicos e imutáveis
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const url = req.originalUrl || req.url || "";
    if (url.includes("/users")) {
      cb(null, usuariosDir);
    } else if (url.includes("/products")) {
      cb(null, produtosDir);
    } else if (url.includes("/orders")) {
      cb(null, comprovantesDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
    const rawBase = path.basename(file.originalname || "arquivo", ext);
    const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "arquivo";
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    cb(null, `${Date.now()}-${randomSuffix}-${safeBase}${ext}`);
  },
});

// função responsável por criar middlewares de filtragem do Multer validando extensão e MIME type permitidos.
//
// contexto: utilizada internamente para instanciar os filtros de validação fileFilter e comprovanteFileFilter.
//
// parâmetros:
//   - allowedExtRegex (RegExp, obrigatório): expressão regular que valida a extensão do arquivo (ex.: /^\.(jpeg|jpg|png)$/i).
//   - allowedMimes (Set<string>, obrigatório): conjunto contendo os MIME types oficiais aceitos.
//   - errorMessage (string, obrigatório): mensagem de erro clara repassada ao usuário via AppError caso o arquivo seja recusado.
//
// retorno: função callback no padrão Multer (req, file, cb) => void.
// erros: repassa AppError(400) ao callback cb caso a extensão ou o mimetype não correspondam aos critérios permitidos.
// efeitos colaterais: nenhum (validação de metadados do arquivo em memória).
//
// passo a passo:
// 1 - recebe allowedExtRegex, allowedMimes e errorMessage.
// 2 - extrai a extensão e o MIME type do arquivo enviado em letras minúsculas.
// 3 - valida se a extensão passa no regex e se o mimetype está contido no conjunto allowedMimes.
// 4 - em caso de sucesso, chama cb(null, true) autorizando o upload.
// 5 - se inválido, chama cb(new AppError(errorMessage, 400)) bloqueando o upload.
function createUploadFilter(allowedExtRegex, allowedMimes, errorMessage) {
  return (req, file, cb) => {
    // 2 - normaliza extensão e mime
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();

    // 3 e 4 - valida critérios de segurança
    if (allowedExtRegex.test(ext) && allowedMimes.has(mime)) {
      cb(null, true);
    } else {
      // 5 - rejeita upload com erro HTTP 400
      cb(new AppError(errorMessage, 400));
    }
  };
}

const fileFilter = createUploadFilter(
  ALLOWED_IMAGE_EXT,
  ALLOWED_IMAGE_MIMES,
  "Tipo de arquivo inválido. Apenas imagens jpg, jpeg, jfif, png ou webp são permitidas."
);

const comprovanteFileFilter = createUploadFilter(
  ALLOWED_PROOF_EXT,
  ALLOWED_PROOF_MIMES,
  "Comprovante inválido. Apenas imagens (jpg, png, webp) ou PDF são aceitos."
);

// middleware Multer configurado para upload de fotos de produtos e avatares (limite de 5MB)
export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// middleware Multer configurado para upload de comprovantes de pagamento de pedidos (limite de 5MB com suporte a PDF)
export const uploadComprovante = multer({
  storage,
  fileFilter: comprovanteFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
