import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken, getApiErrorMessage, authDebug } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async () => {
    const t = localStorage.getItem("cax_token");
    if (!t) {
      setUser(null);
      setError(null);
      setReady(true);
      authDebug("loadMe: no token");
      return { user: null };
    }
    setAuthToken(t);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setError(null);
      authDebug("loadMe: /auth/me OK", { email: data.user?.email });
      return { user: data.user };
    } catch (e) {
      authDebug("loadMe: /auth/me failed", {
        status: e.response?.status,
        message: e.message,
      });
      setAuthToken(null);
      setUser(null);
      setError(getApiErrorMessage(e, "Session expired or invalid. Please sign in again."));
      return { user: null };
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      authDebug("login response received", { hasToken: !!data.token, user: data.user?.email });
      setAuthToken(data.token);
      setUser(data.user);
      authDebug("login: user state updated");
      return data;
    } catch (e) {
      const message = getApiErrorMessage(e, "Login failed");
      setError(message);
      authDebug("login failed", message);
      throw e;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      authDebug("register response received", { hasToken: !!data.token });
      setAuthToken(data.token);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = getApiErrorMessage(e, "Registration failed");
      setError(message);
      authDebug("register failed", message);
      throw e;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        loading: !ready,
        error,
        setError,
        login,
        register,
        logout,
        loadMe,
        refreshUser: loadMe,
      }}
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
