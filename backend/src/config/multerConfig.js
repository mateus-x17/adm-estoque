import multer from "multer";
import path from "path";
import fs from "fs";

// arquivo responsável por configurar o upload de arquivos local usando Multer
// 1 - Define os caminhos absolutos das pastas de destino dos uploads (pasta base, usuários e produtos)
const uploadsDir = path.resolve("uploads");
const usuariosDir = path.join(uploadsDir, "usuarios");
const produtosDir = path.join(uploadsDir, "produtos");

// 2 - Itera sobre a lista de diretórios e verifica se existem, criando-os (com a flag recursive) caso não existam
[uploadsDir, usuariosDir, produtosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 3 - Configura o motor de armazenamento (diskStorage) do multer
const storage = multer.diskStorage({
  // função para determinar a pasta de destino do arquivo
  // 1 - Lê a URL original da requisição
  // 2 - Se a rota incluir "/users", envia para a pasta usuariosDir
  // 3 - Se a rota incluir "/products", envia para a pasta produtosDir
  // 4 - Caso contrário, usa a pasta genérica uploadsDir
  destination: function (req, file, cb) {
    const url = req.originalUrl || req.url || "";
    if (url.includes("/users")) {
      cb(null, usuariosDir);
    } else if (url.includes("/products")) {
      cb(null, produtosDir);
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
  const extensoesPermitidas = /jpeg|jpg|webp|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (extensoesPermitidas.test(ext)) cb(null, true);
  else cb(new Error("Tipo de arquivo inválido. Apenas jpg, jpeg, png, webp."));
}

// 4 - Exporta o objeto de upload do Multer, juntando as configurações de armazenamento, o filtro de tipo e o limite de tamanho (5MB)
export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
