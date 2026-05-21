import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

loadEnv(path.join(repoRoot, ".env"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
}

const APPLY = process.argv.includes("--apply");
const FROM_CATEGORY = "Roupas";
const TO_CATEGORY = "Vestuário";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

async function countByCategory(category) {
  let total = 0;

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("services")
      .select("id", { count: "exact" })
      .eq("category", category)
      .range(from, from + 999);

    if (error) throw error;
    if (!data?.length) break;

    total += data.length;

    if (data.length < 1000) break;
  }

  return total;
}

const beforeFrom = await countByCategory(FROM_CATEGORY);
const beforeTo = await countByCategory(TO_CATEGORY);

if (!APPLY) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        fromCategory: FROM_CATEGORY,
        toCategory: TO_CATEGORY,
        fromCount: beforeFrom,
        toCount: beforeTo,
        wouldUpdate: beforeFrom,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { error } = await supabase
  .from("services")
  .update({ category: TO_CATEGORY })
  .eq("category", FROM_CATEGORY);

if (error) throw error;

const afterFrom = await countByCategory(FROM_CATEGORY);
const afterTo = await countByCategory(TO_CATEGORY);

console.log(
  JSON.stringify(
    {
      mode: "apply",
      fromCategory: FROM_CATEGORY,
      toCategory: TO_CATEGORY,
      updated: beforeFrom,
      before: {
        fromCount: beforeFrom,
        toCount: beforeTo,
      },
      after: {
        fromCount: afterFrom,
        toCount: afterTo,
      },
    },
    null,
    2,
  ),
);
