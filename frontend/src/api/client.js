import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 30000,
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

export function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

export function money(value) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return `${Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} UF`;
}

export function percent(value) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return `${Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}%`;
}
