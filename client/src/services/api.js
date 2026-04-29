import axios from "axios";

/**
 * Public API origin only (no path). Vercel: set VITE_API_ORIGIN=https://your-api.onrender.com
 * Dev without env: http://localhost:5000 (matches typical API port; ensure CLIENT_URL includes http://localhost:5173 on the server).
 */
function resolveApiOrigin() {
  const raw = import.meta.env.VITE_API_ORIGIN;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).trim().replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  return "";
}

export const API_BASE_ORIGIN = resolveApiOrigin();

if (import.meta.env.PROD && !API_BASE_ORIGIN) {
  console.error(
    "[CodeArena] Missing VITE_API_ORIGIN. Set it in Vercel to your backend URL (e.g. https://codearena-api.onrender.com)."
  );
}

const apiRoot =
  API_BASE_ORIGIN !== ""
    ? `${API_BASE_ORIGIN}/api`
    : import.meta.env.DEV
      ? `http://localhost:5000/api`
      : "https://configure-env-vite-api-origin.invalid/api";

const api = axios.create({
  baseURL: apiRoot,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Dev or VITE_DEBUG_AUTH=true: auth integration logs */
export function authDebug(label, detail) {
  if (!import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH !== "true") return;
  if (detail !== undefined) console.info(`[CodeArena auth] ${label}`, detail);
  else console.info(`[CodeArena auth] ${label}`);
}

export function getApiErrorMessage(err, fallback = "Something went wrong") {
  const serverMsg = err?.response?.data?.error;
  if (typeof serverMsg === "string" && serverMsg.trim()) return serverMsg;
  const code = err?.code;
  const msg = err?.message || "";
  if (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    msg === "Network Error" ||
    !err?.response
  ) {
    return "Cannot reach the API. Check VITE_API_ORIGIN on Vercel, that the server is up, and GET /api/health in a browser.";
  }
  return fallback;
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("cax_token", token);
    authDebug("Token stored (length)", token.length);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("cax_token");
    authDebug("Token cleared");
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === "true") {
      const url = err.config?.baseURL && err.config?.url ? `${err.config.baseURL}${err.config.url}` : err.config?.url;
      authDebug("API error", {
        url,
        status: err.response?.status,
        message: err.message,
      });
    }
    return Promise.reject(err);
  }
);

const existing = localStorage.getItem("cax_token");
if (existing) setAuthToken(existing);

export default api;
