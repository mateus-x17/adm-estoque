import multer from "multer";
import path from "path";
import fs from "fs";

// arquivo responsável por configurar o upload de arquivos local usando Multer
// 1 - Define os caminhos absolutos das pastas de destino dos uploads (pasta base, usuários, produtos e comprovantes)
const uploadsDir = path.resolve("uploads");
const usuariosDir = path.join(uploadsDir, "usuarios");
const produtosDir = path.join(uploadsDir, "produtos");
const comprovantesDir = path.join(uploadsDir, "comprovantes");

// 2 - Itera sobre a lista de diretórios e verifica se existem, criando-os (com a flag recursive) caso não existam
[uploadsDir, usuariosDir, produtosDir, comprovantesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 3 - Configura o motor de armazenamento (diskStorage) do multer
const storage = multer.diskStorage({
  // função para determinar a pasta de destino do arquivo
  // 1 - Lê a URL original da requisição
  // 2 - Se a rota incluir "/users", envia para a pasta usuariosDir
  // 3 - Se a rota incluir "/products", envia para a pasta produtosDir
  // 4 - Se a rota incluir "/orders", envia para a pasta comprovantesDir
  // 5 - Caso contrário, usa a pasta genérica uploadsDir
  destination: function (req, file, cb) {
    const url = req.originalUrl || req.url || "";
    if (url.includes("/users")) {
      cb(null, usuariosDir);
    } else if (url.includes("/products")) {
      cb(null, produtosDir);
    } else if (url.includes("/orders")) {
      cb(null, comprovantesDir);
    } else {
      cb(null, uploadsDir); // fallback
    }
  },
  // função para gerar um nome único para o arquivo salvo
  // 1 - Extrai a extensão original do arquivo
  // 2 - Pega o nome base do arquivo removendo espaços (substituindo por hífen)
  // 3 - Chama o callback concatenando o timestamp atual (Date.now) com o nome base e a extensão, garantindo unicidade
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// função para filtrar quais tipos de arquivos são permitidos no upload
// 1 - Define uma expressão regular com as extensões permitidas (jpeg, jpg, webp, png)
// 2 - Extrai e converte a extensão do arquivo enviado para letras minúsculas
// 3 - Se a extensão for válida, permite o upload (cb(null, true)), caso contrário, retorna um erro
function fileFilter(req, file, cb) {
  const extensoesPermitidas = /jpeg|jpg|webp|jfif|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (extensoesPermitidas.test(ext)) cb(null, true);
  else cb(new Error("Tipo de arquivo inválido. Apenas jpg, jpeg, jfif, png, webp."));
}

// função para filtrar arquivos de comprovante de pedido (imagens ou PDF)
// 1 - Permite imagens padrão e arquivos PDF como recibo/comprovante até 5MB
function comprovanteFileFilter(req, file, cb) {
  const extensoesPermitidas = /jpeg|jpg|webp|jfif|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (extensoesPermitidas.test(ext)) cb(null, true);
  else cb(new Error("Comprovante inválido. Apenas imagens (jpg, png, webp) ou PDF."));
}

// 4 - Exporta os objetos de upload do Multer com limite de 5MB
export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
export const uploadComprovante = multer({
  storage,
  fileFilter: comprovanteFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
