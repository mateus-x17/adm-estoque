/**
 * Formats image URLs so that full remote URLs (like Cloudinary) are used directly,
 * while local relative paths (like /uploads/...) prepend the backend server origin.
 * 
 * @param {string|null} url - Image path or URL from backend
 * @returns {string|null}
 */
export const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
