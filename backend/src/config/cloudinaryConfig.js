// arquivo responsável por configurar o cliente Cloudinary e gerenciar uploads, remoções e caminhos isolados por Organização e Loja.
// atua na camada de configuração e armazenamento de mídia em nuvem do backend.
// tecnologias principais: Cloudinary SDK v2, fs (Node.js nativo) e dotenv.
// usado por: controllers de produtos e usuários e rotas de comprovantes para persistência segura de imagens.

// importações da biblioteca Cloudinary: v2 provê os clientes de configuração e API de upload/destroy na nuvem.
import { v2 as cloudinary } from "cloudinary";
// importações de variáveis de ambiente: dotenv carrega as credenciais do arquivo .env.
import dotenv from "dotenv";
// importações do sistema de arquivos: fs é utilizado para apagar arquivos locais temporários após o envio à nuvem.
import fs from "fs";
// importações de utilitários internos: removeLocalUploadIfSafe valida e exclui com segurança arquivos da pasta uploads.
import { removeLocalUploadIfSafe } from "../utils/sanitizers.js";

// inicializa variáveis de ambiente
dotenv.config();

// configura credenciais da conta Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// função responsável por sanitizar segmentos de texto para montagem de diretórios seguros na CDN do Cloudinary.
//
// contexto: função utilitária interna utilizada em getTenantFolder para evitar injeção de caracteres inválidos em URLs de armazenamento.
//
// parâmetros:
//   - value (string|null, opcional): string original a ser sanitizada.
//   - fallback (string, opcional, padrão "geral"): valor substituto caso o valor seja vazio ou resulte em string vazia.
//
// retorno: string contendo apenas caracteres alfanuméricos minúsculos, hífens e underscores.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura).
//
// passo a passo:
// 1 - recebe value e fallback.
// 2 - converte value para string e aplica fallback se nulo ou indefinido.
// 3 - normaliza acentuações Unicode (NFD) e remove diacríticos.
// 4 - converte para minúsculas e substitui qualquer caractere fora de [a-z0-9_-] por underscore.
// 5 - retorna a string limpa ou o fallback.
function sanitizeSegment(value, fallback = "geral") {
  // 2 e 3 - normaliza texto e remove acentuações
  const cleaned = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");
  // 4 e 5 - retorna resultado final seguro
  return cleaned || fallback;
}

// função responsável por montar o caminho hierárquico isolado no Cloudinary para cada organização e loja.
//
// contexto: invocada antes de uploadToCloudinary para determinar a pasta exata da mídia no storage remoto.
//
// parâmetros:
//   - orgIdentifier (string|number, obrigatório): slug ou identificador da organização locatária.
//   - lojaIdentifier (string|number, opcional, padrão "corporativo"): slug da loja ou texto 'corporativo' para uploads da matriz/rede.
//   - subfolder (string, opcional, padrão "geral"): subpasta temática (ex.: 'produtos', 'usuarios', 'comprovantes').
//
// retorno: string estruturada no padrão 'estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>'.
// erros: nenhum.
// efeitos colaterais: nenhum (função pura de interpolação textual).
//
// passo a passo:
// 1 - recebe orgIdentifier, lojaIdentifier e subfolder.
// 2 - sanitiza orgIdentifier utilizando sanitizeSegment com fallback "default".
// 3 - sanitiza lojaIdentifier utilizando sanitizeSegment com fallback "corporativo".
// 4 - sanitiza subfolder utilizando sanitizeSegment com fallback "geral".
// 5 - retorna o caminho hierárquico montado no Cloudinary.
export function getTenantFolder(orgIdentifier, lojaIdentifier = "corporativo", subfolder = "geral") {
  // 2 a 4 - sanitiza cada segmento individualmente
  const safeOrg = sanitizeSegment(orgIdentifier, "default");
  const safeStore = sanitizeSegment(lojaIdentifier, "corporativo");
  const safeSub = sanitizeSegment(subfolder, "geral");
  // 5 - monta o caminho hierárquico seguro
  return `estoque-os/organizacoes/${safeOrg}/lojas/${safeStore}/${safeSub}`;
}

// função responsável por enviar um arquivo do disco local para o Cloudinary com controle rígido de timeout e limpeza do arquivo temporário.
//
// contexto: chamada pelos controllers de produtos e usuários logo após o upload intermediário realizado pelo Multer.
//
// parâmetros:
//   - filePath (string, obrigatório): caminho absoluto ou relativo do arquivo local temporário.
//   - folder (string, opcional, padrão "general"): pasta de destino no Cloudinary.
//   - timeoutMs (number, opcional, padrão 10000): tempo limite em milissegundos para abortar a requisição de upload.
//
// retorno: string contendo a URL pública segura (HTTPS) da imagem hospedada no Cloudinary.
// erros: lança Error caso a requisição ultrapasse timeoutMs ou o Cloudinary retorne falha de autenticação/processamento.
// efeitos colaterais: transfere o arquivo para o Cloudinary e apaga o arquivo temporário local no bloco finally.
//
// passo a passo:
// 1 - recebe filePath, folder e timeoutMs.
// 2 - cria uma Promise de timeout rejeitada após timeoutMs milissegundos.
// 3 - invoca cloudinary.uploader.upload enviando o arquivo para a pasta especificada com resource_type auto.
// 4 - executa Promise.race entre o upload e o timeout para evitar sockets pendentes.
// 5 - no bloco finally, invoca fs.unlink para deletar o arquivo temporário local do disco.
// 6 - retorna a URL segura (secure_url) do arquivo processado.
export async function uploadToCloudinary(filePath, folder = "general", timeoutMs = 10000) {
  try {
    // 2 - define promise com timeout de contingência
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao enviar imagem para o Cloudinary (excedeu 10s)")), timeoutMs)
    );

    // 3 - despacha o upload ao Cloudinary
    const uploadPromise = cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // 4 - aguarda a primeira promise a liquidar
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    // 6 - devolve a URL pública segura
    return result.secure_url;
  } finally {
    // 5 - limpa o arquivo temporário gerado no disco pelo Multer
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Erro ao apagar arquivo temporário local:", err);
      }
    });
  }
}

// função responsável por deletar uma imagem no Cloudinary a partir da URL pública ou do identificador publicId.
//
// contexto: invocada durante a atualização ou exclusão de produtos e usuários para não deixar mídias órfãs na nuvem.
//
// parâmetros:
//   - imageUrlOrPublicId (string|null, opcional): URL completa da imagem ou o seu publicId no Cloudinary.
//
// retorno: objeto de resultado retornado pela API do Cloudinary ou undefined em caso de entrada vazia/erro.
// erros: nenhum (erros de rede são capturados e logados sem quebrar o fluxo principal).
// efeitos colaterais: remove permanentemente o ativo de mídia da conta Cloudinary.
//
// passo a passo:
// 1 - recebe imageUrlOrPublicId (string ou null).
// 2 - retorna imediatamente se o parâmetro for nulo ou vazio.
// 3 - extrai o publicId real caso seja fornecida uma URL HTTP/HTTPS (removendo domínio, /upload/ e versão v123).
// 4 - executa cloudinary.uploader.destroy passando o publicId identificado.
// 5 - retorna o resultado da operação de destruição.
export async function deleteFromCloudinary(imageUrlOrPublicId) {
  // 2 - encerra antecipadamente se vazio
  if (!imageUrlOrPublicId) return;
  try {
    let publicId = imageUrlOrPublicId;
    // 3 - extrai o publicId de URLs completas
    if (imageUrlOrPublicId.startsWith("http://") || imageUrlOrPublicId.startsWith("https://")) {
      const parts = imageUrlOrPublicId.split("/upload/");
      if (parts.length > 1) {
        const pathAfterUpload = parts[1].replace(/^v\d+\//, "");
        publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf("."));
      }
    }
    // 4 e 5 - deleta o ativo na nuvem e retorna resultado
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Erro ao deletar imagem do Cloudinary:", error);
  }
}

// função responsável por remover uma mídia antiga armazenada no Cloudinary ou localmente na pasta uploads de forma segura.
//
// contexto: chamada durante a substituição de fotos de usuários e produtos para limpar arquivos antigos.
//
// parâmetros:
//   - mediaUrlOrPath (string|null, opcional): URL remota no Cloudinary ou caminho relativo local.
//
// retorno: nenhum (função assíncrona de efeito colateral puro).
// erros: nenhum.
// efeitos colaterais: deleta o ativo no Cloudinary via deleteFromCloudinary ou apaga o arquivo em uploads via removeLocalUploadIfSafe.
//
// passo a passo:
// 1 - recebe mediaUrlOrPath (string ou null).
// 2 - retorna sem ação se mediaUrlOrPath for vazio ou não for string.
// 3 - se o endereço iniciar com http:// ou https://, aciona deleteFromCloudinary.
// 4 - caso contrário, remove o arquivo local validado através de removeLocalUploadIfSafe.
export async function cleanupStoredMedia(mediaUrlOrPath) {
  // 2 - valida existência
  if (!mediaUrlOrPath || typeof mediaUrlOrPath !== "string") return;
  // 3 - se for nuvem, aciona o Cloudinary
  if (mediaUrlOrPath.startsWith("http://") || mediaUrlOrPath.startsWith("https://")) {
    await deleteFromCloudinary(mediaUrlOrPath);
    return;
  }
  // 4 - se for local, valida path traversal e apaga
  removeLocalUploadIfSafe(mediaUrlOrPath);
}

export default cloudinary;
