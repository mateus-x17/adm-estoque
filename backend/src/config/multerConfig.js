import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.resolve("uploads");

// garante pasta uploads
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
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
  else cb(new Error("Tipo de arquivo inválido. Apenas jpg, jpeg, png."));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
