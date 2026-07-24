import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary inside the specified folder.
 * @param {string} filePath - Path to local file saved by multer
 * @param {string} folder - Folder name on Cloudinary (e.g. 'produtos', 'usuarios')
 * @returns {Promise<string>} Secure URL of uploaded image
 */
// export async function uploadToCloudinary(filePath, folder = "general") {
//   const result = await cloudinary.uploader.upload(filePath, {
//     folder: folder,
//   });
//   return result.secure_url;
// }
export async function uploadToCloudinary(filePath, folder = "general") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
    });
    return result.secure_url;
  } finally {
    // O arquivo local só serve pra alimentar o upload;
    // uma vez enviado (ou mesmo se falhar), não precisamos mais dele em disco.
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erro ao apagar arquivo temporário local:", err);
    });
  }
}

/**
 * Deletes an image from Cloudinary using its public ID or full URL.
 * @param {string} imageUrlOrPublicId
 */
// export async function deleteFromCloudinary(imageUrlOrPublicId) {
//   if (!imageUrlOrPublicId) return;
//   try {
//     let publicId = imageUrlOrPublicId;
//     if (imageUrlOrPublicId.startsWith("http://") || imageUrlOrPublicId.startsWith("https://")) {
//       const parts = imageUrlOrPublicId.split("/upload/");
//       if (parts.length > 1) {
//         const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
//         publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf("."));
//       }
//     }
//     await cloudinary.uploader.destroy(publicId);
//   } catch (error) {
//     console.error("Erro ao deletar imagem do Cloudinary:", error);
//   }
// }
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
    console.log("Cloudinary destroy result:", publicId, result); // <- temporário, pra diagnosticar
    return result;
  } catch (error) {
    console.error("Erro ao deletar imagem do Cloudinary:", error);
  }
}

export default cloudinary;
