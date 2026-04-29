import axios from "axios";

/**
 * Central API origin: Vercel must set VITE_API_ORIGIN=https://your-backend.example.com
 * (no trailing slash, no /api path — that segment is added below for the Express mount).
 */
const VITE_API_ORIGIN = import.meta.env.VITE_API_ORIGIN;

function resolveBaseUrl() {
  if (VITE_API_ORIGIN != null && String(VITE_API_ORIGIN).trim() !== "") {
    return String(VITE_API_ORIGIN).trim().replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  return "";
}

/** Backend origin only — all API traffic must use this + `/api` on the server, never same-origin `/api` on Vercel. */
export const BASE_URL = resolveBaseUrl();

/** @deprecated Use BASE_URL */
export const API_BASE_ORIGIN = BASE_URL;

if (import.meta.env.PROD && !BASE_URL) {
  console.error(
    "[CodeArena] Missing VITE_API_ORIGIN. Set it in Vercel to your backend URL (e.g. https://codearena-api.onrender.com)."
  );
}

/** Express mounts routes at `/api`; full axios base is backend origin + that mount — always absolute in production when env is set. */
const API_MOUNT = "/api";
const apiRoot =
  BASE_URL !== ""
    ? `${BASE_URL}${API_MOUNT}`
    : import.meta.env.DEV
      ? `http://localhost:5000${API_MOUNT}`
      : `https://configure-env-vite-api-origin.invalid${API_MOUNT}`;

const apiH = axios.create({
  baseURL: apiRoot,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Absolute URL for a backend path under `/api` (e.g. `apiUrl("/auth/login")`). Prefer the default `api` client. */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiRoot}${p}`;
}

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
    return "Cannot reach the API. Check VITE_API_ORIGIN on Vercel, that the server is up, and open GET /api/health on your backend host (not the Vercel URL).";
  }
  return fallback;
}

export function setAuthToken(token) {
  if (token) {
    apiH.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("cax_token", token);
    authDebug("Token stored (length)", token.length);
  } else {
    delete apiH.defaults.headers.common.Authorization;
    localStorage.removeItem("cax_token");
    authDebug("Token cleared");
  }
}

apiH.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === "true") {
      const url =
        err.config?.baseURL && err.config?.url ? `${err.config.baseURL}${err.config.url}` : err.config?.url;
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

export default apiH;
