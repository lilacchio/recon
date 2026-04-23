import { sbAdmin } from "@/lib/supabase";
import { ActReceipts } from "./ActReceipts";

async function loadProof() {
  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select(
      `id, direction, conviction, disagreed,
       tokens:tokens!inner(symbol),
       price_snaps(pnl_pct, taken_at)`,
    )
    .order("created_at", { ascending: false })
    .limit(3);
  return ((data ?? []) as unknown as Array<{
    id: string;
    direction: "long" | "short" | "watch";
    conviction: number;
    disagreed: boolean;
    tokens: { symbol: string | null } | { symbol: string | null }[] | null;
    price_snaps: { pnl_pct: string | number | null; taken_at: string }[];
  }>).map((r) => {
    const t = Array.isArray(r.tokens) ? r.tokens[0] : r.tokens;
    const latest = (r.price_snaps ?? []).sort(
      (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
    )[0];
    const pnl = latest
      ? typeof latest.pnl_pct === "string"
        ? parseFloat(latest.pnl_pct)
        : (latest.pnl_pct ?? 0)
      : 0;
    return {
      id: r.id,
      symbol: t?.symbol ?? "—",
      direction: r.direction,
      conviction: r.conviction,
      disagreed: r.disagreed,
      pnl,
    };
  });
}

export async function ActReceiptsServer() {
  let calls: Awaited<ReturnType<typeof loadProof>> = [];
  try {
    calls = await loadProof();
  } catch {
    calls = [];
  }
  return <ActReceipts calls={calls} />;
}
