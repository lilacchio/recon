import "./_env";
import { sbAdmin } from "../src/lib/supabase";

async function main() {
  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select("reasoning, direction, conviction, tokens:tokens!inner(symbol)")
    .order("created_at", { ascending: false })
    .limit(3);
  for (const r of (data ?? []) as Array<{ reasoning: string; direction: string; conviction: number; tokens: { symbol: string | null } | { symbol: string | null }[] | null }>) {
    const t = Array.isArray(r.tokens) ? r.tokens[0] : r.tokens;
    console.log(`=== ${t?.symbol} · ${r.direction} conv=${r.conviction} ===`);
    console.log(r.reasoning);
    console.log();
  }
}
main();
