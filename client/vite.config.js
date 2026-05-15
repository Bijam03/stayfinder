import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Enables Tailwind CSS
  ],
  server: {
    proxy: {
      // When React calls /api/... it forwards to backend on port 5000
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});