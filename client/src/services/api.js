import axios from "axios";

const api = axios.create({
  baseURL: "/api",
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
