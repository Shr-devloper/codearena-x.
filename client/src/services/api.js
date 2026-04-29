import axios from "axios";

/** Dev: unset → `/api` (Vite proxy). Production: public API origin, e.g. `https://codearena-api.onrender.com` */
const API_ORIGIN = String(import.meta.env.VITE_API_ORIGIN ?? "").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("cax_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("cax_token");
  }
}

const existing = localStorage.getItem("cax_token");
if (existing) setAuthToken(existing);

export default api;
