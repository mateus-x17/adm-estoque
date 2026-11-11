// arquivo responsável por validadores de formulários e sanitização HTML contra XSS no frontend.

// função responsável por escapar caracteres especiais HTML antes de inserir texto dinâmico em documentos ou popups de impressão.
//
// 1 - recebe value (string|number|null|undefined).
// 2 - retorna string vazia se value for nulo ou indefinido.
// 3 - substitui &, <, >, " e ' pelas entidades HTML seguras correspondentes.
// 4 - retorna o texto sanitizado pronto para interpolação segura.
export const escapeHtml = (value) => {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const validators = {
  required: (value, name) => {
    if (value === undefined || value === null || value === '') {
      return `${name} é obrigatório`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return 'Email é obrigatório';
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) ? null : 'Email inválido';
  },

  minLength: (value, length, name) => {
    if (!value || value.length < length) {
      return `${name} deve ter no mínimo ${length} caracteres`;
    }
    return null;
  },

  number: (value, name) => {
    if (value === undefined || value === null || value === '') {
      return `${name} é obrigatório`;
    }
    return Number.isNaN(Number(value)) ? `${name} deve ser um número válido` : null;
  },
};
