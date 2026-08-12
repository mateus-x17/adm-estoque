import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

// arquivo responsável por configurar a integração e funções do Cloudinary (serviço de hospedagem de imagens)
// 1 - Carrega as variáveis de ambiente com o dotenv
dotenv.config();

// 2 - Configura as credenciais de acesso (nome da cloud, chave e secret) pegando os dados das variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// função responsável por fazer o upload de um arquivo local para o Cloudinary
// 1 - Recebe o caminho local do arquivo (gerado previamente pelo multer) e opcionalmente o nome da pasta de destino na nuvem
// 2 - Chama o método upload do uploader do Cloudinary passando o caminho local e a pasta destino
// 3 - Retorna a URL segura (https) da imagem salva (secure_url)
// 4 - Usa o bloco finally para apagar o arquivo temporário do disco local com fs.unlink independentemente do upload ter dado certo ou não, liberando espaço
export async function uploadToCloudinary(filePath, folder = "general") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
    });
    return result.secure_url;
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erro ao apagar arquivo temporário local:", err);
    });
  }
}

// função responsável por deletar uma imagem do Cloudinary
// 1 - Recebe a URL completa da imagem ou o seu ID público
// 2 - Se a string não for informada, retorna precocemente
// 3 - Se a string for uma URL HTTP(s), tenta extrair apenas o "publicId" fazendo split na URL e limpando prefixos de versão
// 4 - Chama a função destroy do uploader do Cloudinary passando o publicId
// 5 - Retorna o resultado da exclusão. Em caso de erro, cai no bloco catch registrando a falha
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
