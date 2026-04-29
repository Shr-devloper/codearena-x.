import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    // API calls use absolute BASE_URL from client/src/services/api.js (VITE_API_ORIGIN or http://localhost:5000 in dev).
    // No dev proxy to /api — avoids same-origin /api resembling production Vercel.
  },
});
