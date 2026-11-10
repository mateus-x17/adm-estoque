import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

// arquivo responsável por configurar a integração e pastas hierárquicas no Cloudinary por Organização e Loja
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// função auxiliar para sanitizar segmentos de diretório para o Cloudinary
// 1 - Converte caracteres inválidos em underscore garantindo caminho limpo em CDN
function sanitizeSegment(value, fallback = "geral") {
  const cleaned = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");
  return cleaned || fallback;
}

// função para montar o caminho hierárquico dedicado no Cloudinary por Organização e Loja
// 1 - Recebe o slug da organização, o slug da loja (ou 'corporativo' quando ADMIN da rede) e a subpasta ('produtos' ou 'usuarios')
// 2 - Retorna a rota estruturada em 'estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>'
export function getTenantFolder(orgIdentifier, lojaIdentifier = "corporativo", subfolder = "geral") {
  const safeOrg = sanitizeSegment(orgIdentifier, "default");
  const safeStore = sanitizeSegment(lojaIdentifier, "corporativo");
  const safeSub = sanitizeSegment(subfolder, "geral");
  return `estoque-os/organizacoes/${safeOrg}/lojas/${safeStore}/${safeSub}`;
}

// função responsável por fazer o upload de um arquivo local para o Cloudinary com proteção de timeout
// 1 - Configura Promise.race com timeout padrão de 10 segundos para evitar bloqueio de socket
// 2 - Envia o arquivo para a pasta isolada no Cloudinary
// 3 - No bloco finally, remove imediatamente o arquivo temporário salvo pelo Multer no disco local
export async function uploadToCloudinary(filePath, folder = "general", timeoutMs = 10000) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao enviar imagem para o Cloudinary (excedeu 10s)")), timeoutMs)
    );

    const uploadPromise = cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result.secure_url;
  } finally {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Erro ao apagar arquivo temporário local:", err);
      }
    });
  }
}

// função responsável por deletar uma imagem do Cloudinary a partir da URL completa ou publicId
// 1 - Extrai o publicId removendo domínio, prefixo /upload/ e versão
// 2 - Invoca cloudinary.uploader.destroy para limpar a mídia órfã na nuvem
export async function deleteFromCloudinary(imageUrlOrPublicId) {
  if (!imageUrlOrPublicId) return;
  try {
    let publicId = imageUrlOrPublicId;
    if (imageUrlOrPublicId.startsWith("http://") || imageUrlOrPublicId.startsWith("https://")) {
      const parts = imageUrlOrPublicId.split("/upload/");
      if (parts.length > 1) {
        const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
        publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf("."));
      }
    }
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary destroy result:", publicId, result);
    return result;
  } catch (error) {
    console.error("Erro ao deletar imagem do Cloudinary:", error);
  }
}

export default cloudinary;
