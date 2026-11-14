import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "LAB_");
  return {
    server: {
      host: "127.0.0.1",
      port: 5178,
      strictPort: true,
      proxy: {
        "/backend": {
          target: env.LAB_BACKEND_ORIGIN || "http://127.0.0.1:3000",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/backend/, "/api"),
        },
        "/inference": {
          target: env.LAB_AI_ORIGIN || "http://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/inference/, ""),
        },
      },
    },
  };
});
