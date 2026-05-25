// src/hooks/useFetch.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch(fetchFn, deps)
 * Executa fetchFn() quando deps mudam.
 * Retorna { data, loading, error, refetch }
 */
export function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

/**
 * useMutation(mutateFn)
 * Retorna { mutate, loading, error }
 */
export function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutateFn(...args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { mutate, loading, error };
}
