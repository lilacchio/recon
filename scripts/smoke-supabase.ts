// Insert + read + delete a probe row. Run: pnpm dlx tsx scripts/smoke-supabase.ts
import "./_env";
import { sbAdmin } from "../src/lib/supabase";

async function main() {
  const sb = sbAdmin();
  const probeAddr = `PROBE_${Date.now()}`;

  const { error: insErr } = await sb.from("tokens").insert({
    address: probeAddr,
    symbol: "PRB",
    name: "probe",
    decimals: 9,
  });
  if (insErr) {
    console.error("insert failed:", insErr.message);
    console.error("(if the tokens table doesn't exist yet, run the SPEC SQL first)");
    process.exit(1);
  }
  console.log("✓ insert");

  const { data, error: readErr } = await sb
    .from("tokens")
    .select("address, symbol, name")
    .eq("address", probeAddr)
    .single();
  if (readErr || !data) {
    console.error("read failed:", readErr?.message);
    process.exit(1);
  }
  console.log(`✓ read     ${data.symbol} / ${data.name}`);

  const { error: delErr } = await sb.from("tokens").delete().eq("address", probeAddr);
  if (delErr) {
    console.error("delete failed:", delErr.message);
    process.exit(1);
  }
  console.log("✓ delete");
  process.exit(0);
}

main().catch((e) => {
  console.error("fatal", e);
  process.exit(1);
});
