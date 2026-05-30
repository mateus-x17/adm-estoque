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
