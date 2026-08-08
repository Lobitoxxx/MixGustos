import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

function useMutar(path, { onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metodo = 'post', body, params }) => api[metodo](path, body),
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
  });
}

export function useLista(key, path) {
  return useQuery({ queryKey: [key], queryFn: () => api.get(path) });
}

export function useOperacion(path, opts) {
  const qc = useQueryClient();
  const mutate = useMutation({
    mutationFn: (body) => api.post(path, body),
    ...opts,
  });
  return mutate;
}

export function invalidar(qc, keys) {
  keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export { useMutar };
