import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 30000
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
