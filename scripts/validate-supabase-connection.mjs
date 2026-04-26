import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

const parseEnvFile = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

if (!fs.existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  process.exit(1);
}

const env = parseEnvFile(envPath);
const supabaseUrl = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const checks = [];

const formatError = (error) => {
  if (error instanceof Error) {
    const parts = [error.message];
    const causeCode =
      typeof error.cause === "object" &&
      error.cause !== null &&
      "code" in error.cause
        ? error.cause.code
        : undefined;

    if (causeCode) {
      parts.push(`cause=${causeCode}`);
    }

    return parts.join(" ");
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error);
};

const runCheck = async (name, fn) => {
  try {
    const details = await fn();
    checks.push({ name, ok: true, details });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      details: formatError(error),
    });
  }
};

await runCheck("auth settings endpoint", async () => {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: publishableKey,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = await response.json();
  return {
    status: response.status,
    hasExternalProviders:
      Boolean(body.external?.google) || Boolean(body.external?.apple),
  };
});

await runCheck("public categories query", async () => {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name")
    .limit(1);

  if (error) throw error;

  return {
    rows: data?.length ?? 0,
    sample: data?.[0] ?? null,
  };
});

await runCheck("public sitemap function", async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/sitemap`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = await response.text();
  return {
    status: response.status,
    hasUrlSet: body.includes("<urlset"),
  };
});

console.log(JSON.stringify(checks, null, 2));

if (checks.some((check) => !check.ok)) {
  process.exit(1);
}
