import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.resolve("uploads");
const usuariosDir = path.join(uploadsDir, "usuarios");
const produtosDir = path.join(uploadsDir, "produtos");

// garante pastas de upload
[uploadsDir, usuariosDir, produtosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // detecta o destino correto com base na rota
    const url = req.originalUrl || req.url || "";
    if (url.includes("/users")) {
      cb(null, usuariosDir);
    } else if (url.includes("/products")) {
      cb(null, produtosDir);
    } else {
      cb(null, uploadsDir); // fallback
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const extensoesPermitidas = /jpeg|jpg|webp|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (extensoesPermitidas.test(ext)) cb(null, true);
  else cb(new Error("Tipo de arquivo inválido. Apenas jpg, jpeg, png, webp."));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
