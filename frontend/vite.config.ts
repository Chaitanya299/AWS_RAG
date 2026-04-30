import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        "/docs": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        "/openapi.json": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  },
});
