import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hasSentryBuildConfig = Boolean(
    env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT,
  );
  const releaseName =
    env.SENTRY_RELEASE ||
    env.VITE_SENTRY_RELEASE ||
    env.VERCEL_GIT_COMMIT_SHA ||
    undefined;

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      ...(hasSentryBuildConfig
        ? [
            sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
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
