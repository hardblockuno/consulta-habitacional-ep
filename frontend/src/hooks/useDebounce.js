import { useEffect, useState } from "react";

/**
 * Hook para debouncing de valores que disparan búsquedas o peticiones de red
 * @param {any} value - Valor de entrada inmediato
 * @param {number} delay - Milisegundos de espera antes de actualizar (default: 350ms)
 * @returns {any} Valor retrasado estable
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
