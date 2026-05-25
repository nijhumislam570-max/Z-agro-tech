import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "..", ".env");

const rawEnv = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of rawEnv.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[trimmed.slice(0, eq).trim()] = val;
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function inspect() {
  const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
  console.log("--- User Roles ---");
  if (rolesError) console.error(rolesError);
  else console.log(roles);

  const { data: settings, error: settingsError } = await supabase.from("admin_settings").select("*");
  console.log("\n--- Admin Settings ---");
  if (settingsError) console.error(settingsError);
  else console.log(settings);
}

inspect();
