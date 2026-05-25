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

async function check() {
  console.log("Checking Supabase connection to:", env.VITE_SUPABASE_URL);
  
  const { data: categories, error: catError } = await supabase.from("product_categories").select("id, name, slug");
  console.log("\n--- Categories ---");
  if (catError) console.error(catError);
  else console.log(categories);

  const { count: prodCount, error: prodError } = await supabase.from("products").select("*", { count: "exact", head: true });
  console.log("\n--- Products Count ---");
  if (prodError) console.error(prodError);
  else console.log("Total products:", prodCount);

  const { count: courseCount, error: courseError } = await supabase.from("courses").select("*", { count: "exact", head: true });
  console.log("\n--- Courses Count ---");
  if (courseError) console.error(courseError);
  else console.log("Total courses:", courseCount);

  const { data: profiles, error: profError } = await supabase.from("profiles").select("id, user_id, full_name");
  console.log("\n--- Profiles ---");
  if (profError) console.error(profError);
  else console.log(profiles);
}

check();
