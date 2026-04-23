import "./_env";
import { sbAdmin } from "../src/lib/supabase";

async function main() {
  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select("direction, conviction, chosen_by, disagreed, tokens:tokens!inner(symbol)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []).map((r: { direction: string; conviction: number; chosen_by: string; disagreed: boolean; tokens: { symbol: string | null } | { symbol: string | null }[] | null }) => {
    const t = Array.isArray(r.tokens) ? r.tokens[0] : r.tokens;
    return { symbol: t?.symbol ?? "—", dir: r.direction, conv: r.conviction, via: r.chosen_by, split: r.disagreed };
  });
  console.table(rows);
  const byDir = rows.reduce<Record<string, number>>((a, r) => {
    a[r.dir] = (a[r.dir] ?? 0) + 1;
    return a;
  }, {});
  console.log("by direction:", byDir);
  console.log("splits:", rows.filter((r) => r.split).length);
}

main();
