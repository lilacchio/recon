import {
  getTokenOverview,
  getHolderDistribution,
  getRecentTxns,
  heuristicSafety,
  type HolderRow,
  type TokenOverview,
  type Txn,
} from "../birdeye";
import type { Candidate } from "./candidates";

export type Snapshot = {
  address: string;
  symbol: string;
  source: Candidate["source"];
  overview: TokenOverview;
  top10: HolderRow[];
  top10PctTotal: number;
  recentTxns: Txn[];
  bigBuyCount1h: number;
  txnCount1h: number;
  safety: { score: number; reasons: string[] };
  ageMinutes: number | null;
};

// Build a compact per-candidate snapshot. 3 Birdeye calls: overview, holders, txns.
export async function buildSnapshot(cand: Candidate): Promise<Snapshot | null> {
  const [overview, holders, txns] = await Promise.all([
    getTokenOverview(cand.address).catch(() => null),
    getHolderDistribution(cand.address, 10).catch(() => []),
    getRecentTxns(cand.address, 50).catch(() => []),
  ]);
  if (!overview) return null;

  const top10PctTotal = holders.reduce((s, h) => s + (h.percentage ?? 0), 0);

  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
  const recent1h = txns.filter((t) => t.blockUnixTime >= oneHourAgo);
  const bigBuyCount1h = recent1h.filter(
    (t) => t.side === "buy" && (t.volumeUSD ?? 0) >= 2_000,
  ).length;

  // Only trust explicit candidate age (from new_listings). lastTradeUnixTime
  // is "most recent swap", not "token launch" — using it returns 0 for every
  // actively-trading token and trips every model into "unscoreable watch".
  const ageMinutes: number | null = cand.ageMinutes ?? null;

  const safety = heuristicSafety({ holders, overview, ageMinutes });

  return {
    address: cand.address,
    symbol: cand.symbol,
    source: cand.source,
    overview,
    top10: holders,
    top10PctTotal,
    recentTxns: recent1h,
    bigBuyCount1h,
    txnCount1h: recent1h.length,
    safety,
    ageMinutes,
  };
}
