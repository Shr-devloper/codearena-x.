import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

if (import.meta.env.PROD && !String(import.meta.env.VITE_API_ORIGIN || "").trim()) {
  console.error(
    "[CodeArena] VITE_API_ORIGIN is not set. The app cannot reach your API until you add it in Vercel → Settings → Environment Variables."
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
