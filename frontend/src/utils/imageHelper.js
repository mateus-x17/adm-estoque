// arquivo responsável por formatar e validar URLs seguras de imagens e comprovantes na camada utilitária do frontend.

// função responsável por resolver URLs remotas ou caminhos relativos de upload bloqueando protocolos inseguros (javascript:, data:, etc.).
//
// 1 - recebe url (string|null) retornada pelo backend.
// 2 - retorna null caso url seja vazia ou não seja string.
// 3 - aceita diretamente URLs iniciadas com http:// ou https://.
// 4 - rejeita caminhos com '//' (protocol-relative) ou esquemas desconhecidos e anexa VITE_API_BASE_URL apenas a caminhos relativos seguros iniciados com '/uploads/'.
// 5 - retorna a URL segura resolvida ou null.
export const formatImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed;
  }

  // Bloqueia redirecionamentos protocol-relative (//evil.com) e esquemas como javascript:/data:.
  if (trimmed.startsWith("//") || !trimmed.startsWith("/uploads/")) {
    return null;
  }

  const baseUrl = import.meta.env?.VITE_API_BASE_URL || "";
  return `${baseUrl.replace(/\/+$/, "")}${trimmed}`;
};
