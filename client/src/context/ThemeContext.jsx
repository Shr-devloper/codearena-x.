import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const KEY = "cax_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(KEY) || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const toggle = () => setThemeState((x) => (x === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme outside ThemeProvider");
  return v;
}
