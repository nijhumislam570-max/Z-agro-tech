import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  const hasSentryBuildConfig = Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT,
  );
  const releaseName =
    process.env.SENTRY_RELEASE ||
    process.env.VITE_SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    undefined;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      ...(hasSentryBuildConfig
        ? [
            sentryVitePlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              telemetry: false,
              release: releaseName ? { name: releaseName } : undefined,
            }),
          ]
        : []),
    ],
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
      ],
    },
    build: {
      sourcemap: hasSentryBuildConfig ? "hidden" : false,
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
  };
});
