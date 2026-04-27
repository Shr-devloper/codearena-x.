import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async () => {
    const t = localStorage.getItem("cax_token");
    if (!t) {
      setUser(null);
      setReady(true);
      return;
    }
    setAuthToken(t);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setError(null);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    setError(null);
    const { data } = await api.post("/auth/login", { email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    setError(null);
    const { data } = await api.post("/auth/register", { name, email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, error, setError, login, register, logout, loadMe, refreshUser: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
