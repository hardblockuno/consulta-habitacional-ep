import axios from "axios";

export const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servidor local en el puerto 8000. Asegúrate de que el backend esté iniciado.";

export function isConnectionOrNetworkError(error) {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toUpperCase();
  return (
    code === "ERR_NETWORK" ||
    code === "ECONNREFUSED" ||
    code === "ERR_CONNECTION_REFUSED" ||
    code === "ENOTFOUND" ||
    msg.includes("network error") ||
    msg.includes("connection refused") ||
    msg.includes("failed to fetch") ||
    (!error.response && Boolean(error.request) && code !== "ECONNABORTED" && !msg.includes("timeout"))
  );
}

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "/api" : "http://127.0.0.1:8000/api"),
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sigep_auth_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    if (config.headers["Content-Type"] === "multipart/form-data") {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isConnectionOrNetworkError(error)) {
      error.isConnectionError = true;
      error.userFriendlyMessage = CONNECTION_ERROR_MESSAGE;
      error.message = CONNECTION_ERROR_MESSAGE;
    }
    return Promise.reject(error);
  }
);


/* ==========================================================================
   DEDUPLICACIÓN DE PETICIONES IN-FLIGHT Y CACHÉ EN MEMORIA PARA LECTURAS (GET)
   ========================================================================== */
const inFlightRequests = new Map();
const memoryCache = new Map();
const CACHE_TTL_MS = 15000;

export async function cachedGet(url, options = {}) {
  const cacheKey = `${url}?${JSON.stringify(options.params || {})}`;

  // 1. Verificar si existe en caché vigente
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Si ya hay una solicitud idéntica en vuelo, reutilizarla
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Crear nueva promesa y registrarla
  const promise = api
    .get(url, options)
    .then((response) => {
      memoryCache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export function invalidateApiCache(urlPrefix = "") {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}

export function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

export function money(value) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return `${Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} UF`;
}

export function percent(value) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return `${Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}
