import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "@lovable.dev/cloud-auth-js",
      "sonner",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "react-router-dom",
      "sonner",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "@lovable.dev/cloud-auth-js",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-router-dom",
            "@tanstack/react-query",
            "sonner",
            "@lovable.dev/cloud-auth-js",
          ],
          "vendor-date": ["date-fns"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-charts": ["recharts"],
          "vendor-zod": ["zod"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
