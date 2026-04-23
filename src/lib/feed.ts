import { sbAdmin } from "./supabase";

export type FeedCall = {
  id: string;
  n: number; // sequential index; newest = highest
  symbol: string;
  name: string;
  address: string;
  direction: "long" | "short" | "watch";
  conviction: number;
  horizon: "1h" | "4h" | "24h" | "7d";
  risk: number;
  reasoning: string;
  priceAtCall: number;
  currentPrice: number;
  pnlPct: number;
  ageMins: number;
  liquidityUsd: number;
  disagreed: boolean;
  chosenBy: "hawk" | "owl" | "arbiter" | "consensus";
  spark: number[];
  createdAt: string;
};

export type FeedStats = {
  calls: number;
  greenPct: number;
  avgPnl: number; // winners-only avg
  uptimeHours: number;
  hawkWon: number;
  owlWon: number;
  arbiter: number;
  consensus: number;
};

type CallRow = {
  id: string;
  token_address: string;
  direction: FeedCall["direction"];
  conviction: number;
  horizon: FeedCall["horizon"];
  risk: number;
  reasoning: string;
  disagreed: boolean;
  chosen_by: FeedCall["chosenBy"];
  price_at_call: string | number;
  liquidity_at_call: string | number | null;
  signals: Record<string, unknown>;
  created_at: string;
  tokens: { symbol: string | null; name: string | null } | null;
  price_snaps: { price: string | number; pnl_pct: string | number | null; taken_at: string }[];
};

function toNum(v: string | number | null | undefined, d = 0): number {
  if (v == null) return d;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : d;
}

function sparkFromSnaps(
  snaps: CallRow["price_snaps"],
  entry: number,
): number[] {
  // Ordered asc by taken_at, normalized to ~50 baseline for the existing Sparkline component.
  if (!snaps.length) return Array(8).fill(50);
  const sorted = [...snaps].sort(
    (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime(),
  );
  const out = sorted.map((s) => {
    const p = toNum(s.price);
    const rel = entry > 0 ? p / entry : 1;
    return 50 + (rel - 1) * 200; // ±100% maps to ±200
  });
  // Pad short series so the line actually draws.
  while (out.length < 6) out.unshift(out[0] ?? 50);
  return out;
}

export async function getFeedCalls(limit = 50): Promise<FeedCall[]> {
  const sb = sbAdmin();
  const { data, error } = await sb
    .from("calls")
    .select(
      `id, token_address, direction, conviction, horizon, risk, reasoning,
       disagreed, chosen_by, price_at_call, liquidity_at_call, signals, created_at,
       tokens:tokens!inner(symbol, name),
       price_snaps(price, pnl_pct, taken_at)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const total = data.length;
  const now = Date.now();
  return (data as unknown as CallRow[]).map((r, i) => {
    const entry = toNum(r.price_at_call);
    const snaps = r.price_snaps ?? [];
    const latest = snaps.length
      ? [...snaps].sort(
          (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
        )[0]
      : null;
    const current = latest ? toNum(latest.price) : entry;
    const pnl = entry > 0 ? ((current - entry) / entry) * 100 : 0;
    const ageMins = Math.max(
      0,
      Math.floor((now - new Date(r.created_at).getTime()) / 60_000),
    );
    return {
      id: r.id,
      n: total - i,
      symbol: r.tokens?.symbol ?? "—",
      name: r.tokens?.name ?? "",
      address: r.token_address,
      direction: r.direction,
      conviction: r.conviction,
      horizon: r.horizon,
      risk: r.risk,
      reasoning: r.reasoning,
      priceAtCall: entry,
      currentPrice: current,
      pnlPct: pnl,
      ageMins,
      liquidityUsd: toNum(r.liquidity_at_call),
      disagreed: r.disagreed,
      chosenBy: r.chosen_by,
      spark: sparkFromSnaps(snaps, entry),
      createdAt: r.created_at,
    };
  });
}

export async function getFeedStats(): Promise<FeedStats> {
  const sb = sbAdmin();
  const [{ data: calls }, { data: firstCall }] = await Promise.all([
    sb
      .from("calls")
      .select("chosen_by, direction, disagreed, price_at_call, id, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    sb
      .from("calls")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const rows = calls ?? [];
  const total = rows.length;

  // Latest pnl per call for green rate + avg winner.
  const { data: snaps } = await sb
    .from("price_snaps")
    .select("call_id, pnl_pct, taken_at")
    .in("call_id", rows.map((r) => r.id))
    .order("taken_at", { ascending: false });

  const latestPnlByCall = new Map<string, number>();
  for (const s of snaps ?? []) {
    if (!latestPnlByCall.has(s.call_id)) {
      latestPnlByCall.set(s.call_id, toNum(s.pnl_pct));
    }
  }
  const pnls = Array.from(latestPnlByCall.values());
  const winners = pnls.filter((p) => p > 0);
  const greenPct = pnls.length ? (winners.length / pnls.length) * 100 : 0;
  const avgPnl = winners.length
    ? winners.reduce((a, b) => a + b, 0) / winners.length
    : 0;

  const hawkWon = rows.filter((r) => r.chosen_by === "hawk").length;
  const owlWon = rows.filter((r) => r.chosen_by === "owl").length;
  const arbiter = rows.filter((r) => r.chosen_by === "arbiter").length;
  const consensus = rows.filter((r) => r.chosen_by === "consensus").length;

  const firstAt = firstCall?.created_at
    ? new Date(firstCall.created_at).getTime()
    : Date.now();
  const uptimeHours = Math.max(
    1,
    Math.floor((Date.now() - firstAt) / 3_600_000),
  );

  return { calls: total, greenPct, avgPnl, uptimeHours, hawkWon, owlWon, arbiter, consensus };
}
