import { useState, useCallback } from 'react';

export const useApi = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        setData(response);
        return response;
      } catch (err) {
        setError(err.message || 'Erro ao processar requisição');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return {
    data,
    error,
    loading,
    execute,
    ...options,
  };
};
