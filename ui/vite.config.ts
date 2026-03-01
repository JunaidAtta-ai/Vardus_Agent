import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3002",
      "/chat": "http://localhost:3002",
      "/events": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/health": "http://localhost:3002",
    },
  },
  build: {
    outDir: "dist",
  },
});
