// Apply supabase/schema.sql against the Supabase Postgres.
// Requires SUPABASE_DB_URL in .env.local (or SUPABASE_DB_PASSWORD).
import "./_env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

function resolveUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const pw = process.env.SUPABASE_DB_PASSWORD;
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!pw || !publicUrl) {
    throw new Error(
      "set SUPABASE_DB_URL in .env.local (postgres://postgres.<ref>:<pw>@...pooler.supabase.com:6543/postgres) " +
        "or SUPABASE_DB_PASSWORD to derive it",
    );
  }
  const ref = new URL(publicUrl).host.split(".")[0];
  const region = process.env.SUPABASE_REGION ?? "ap-south-1";
  // Session-mode pooler on 5432 (supports prepared statements / DDL).
  return `postgres://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

async function main() {
  const sql = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ref = new URL(publicUrl).host.split(".")[0];
  const region = process.env.SUPABASE_REGION ?? "ap-south-1";
  const pw = process.env.SUPABASE_DB_PASSWORD!;
  const client = new Client({
    host: `aws-0-${region}.pooler.supabase.com`,
    port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
    user: `postgres.${ref}`,
    password: pw,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  console.log(`→ connecting as postgres.${ref}@aws-0-${region}.pooler.supabase.com:5432`);
  await client.connect();
  console.log("✓ connected");
  await client.query(sql);
  console.log("✓ schema applied");
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name",
  );
  console.log("  tables:", rows.map((r) => r.table_name).join(", "));
  await client.end();
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});
