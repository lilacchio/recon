// Nuke all calls + price_snaps. Keeps tokens/token_usage so cache + counters survive.
// Run: pnpm exec tsx scripts/wipe.ts
import "./_env";
import { sbAdmin } from "../src/lib/supabase";

async function main() {
  const sb = sbAdmin();
  const { count: callsBefore } = await sb
    .from("calls")
    .select("id", { count: "exact", head: true });
  const { error: snapErr } = await sb
    .from("price_snaps")
    .delete()
    .gte("taken_at", "1970-01-01");
  if (snapErr) throw snapErr;
  const { error: callErr } = await sb
    .from("calls")
    .delete()
    .gte("created_at", "1970-01-01");
  if (callErr) throw callErr;
  console.log(`wiped ${callsBefore ?? 0} calls + their price_snaps`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
