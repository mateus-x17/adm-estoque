// arquivo responsável por configurar o armazenamento e filtragem segura de uploads locais usando Multer, path, fs e crypto.
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { AppError } from "../utils/errorHandler.js";

const uploadsDir = path.resolve("uploads");
const usuariosDir = path.join(uploadsDir, "usuarios");
const produtosDir = path.join(uploadsDir, "produtos");
const comprovantesDir = path.join(uploadsDir, "comprovantes");

[uploadsDir, usuariosDir, produtosDir, comprovantesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

// Configura armazenamento em disco segregado por módulo e com nomes sanitizados para evitar sobrescrita e Path Traversal.
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

// função responsável por construir filtros Multer validando extensão ancorada e MIME type permitido.
//
// 1 - recebe allowedExtRegex (RegExp), allowedMimes (Set<string>) e errorMessage (string).
// 2 - retorna um middleware de filtragem para o Multer que valida extensão e mimetype do arquivo enviado.
function createUploadFilter(allowedExtRegex, allowedMimes, errorMessage) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();

    if (allowedExtRegex.test(ext) && allowedMimes.has(mime)) {
      cb(null, true);
    } else {
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

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadComprovante = multer({
  storage,
  fileFilter: comprovanteFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
