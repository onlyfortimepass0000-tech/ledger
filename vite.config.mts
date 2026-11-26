import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` serves the UI; `npm run dev:api` serves /api on :3001 (same
// handlers Vercel runs). On Vercel the /api functions are built from /api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
  preview: {
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
});
