import { getCandidates } from "./candidates";
import { buildSnapshot } from "./snapshot";
import { runDuel, type DuelResult } from "./duel";
import { persistDuel } from "./persist";
import { sbAdmin } from "../supabase";

export type ScanStep =
  | { kind: "candidates"; count: number }
  | { kind: "snapshot"; symbol: string; ok: boolean; reason?: string }
  | { kind: "hawk_score"; symbol: string; direction: string; conviction: number }
  | { kind: "owl_score"; symbol: string; direction: string; conviction: number }
  | { kind: "disagreed"; symbol: string; gap: number }
  | { kind: "arbiter"; symbol: string; winner: string }
  | { kind: "resolved"; symbol: string; direction: string; conviction: number; chosenBy: string }
  | { kind: "persist"; symbol: string; wrote: boolean; callId: string | null; reason?: string }
  | { kind: "error"; symbol: string; error: string };

export type ScanResult = {
  candidates: number;
  scored: number;
  wrote: number;
  skipped: number;
  disagreements: number;
  steps: ScanStep[];
  estUsd: number;
  budgetExhausted: boolean;
};

const RECENT_CALL_MS = 4 * 60 * 60 * 1000; // match persist.ts dedupe

async function filterFreshCandidates<T extends { address: string }>(cands: T[]): Promise<T[]> {
  if (cands.length === 0) return cands;
  const sb = sbAdmin();
  const since = new Date(Date.now() - RECENT_CALL_MS).toISOString();
  const { data } = await sb
    .from("calls")
    .select("token_address")
    .in(
      "token_address",
      cands.map((c) => c.address),
    )
    .gte("created_at", since);
  const recent = new Set((data ?? []).map((r) => r.token_address));
  return cands.filter((c) => !recent.has(c.address));
}

// Cheap budget check: if today's spend > threshold, arbiter falls back to Haiku.
async function arbiterShouldBeSmart(): Promise<boolean> {
  try {
    const sb = sbAdmin();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await sb
      .from("token_usage")
      .select("est_usd")
      .eq("day", today)
      .maybeSingle();
    const spent = Number(data?.est_usd) || 0;
    return spent < 0.8; // use Sonnet arbiter until $0.80/day spent
  } catch {
    return true; // if the check fails (table missing etc), default to smart
  }
}

export async function runScan(
  opts: { limit?: number; timeBudgetMs?: number } = {},
): Promise<ScanResult> {
  const steps: ScanStep[] = [];
  const start = Date.now();
  const timeBudgetMs = opts.timeBudgetMs ?? Infinity;
  const poolLimit = opts.limit ?? 10;

  const poolRaw = await getCandidates(poolLimit);
  const cands = await filterFreshCandidates(poolRaw);
  steps.push({ kind: "candidates", count: cands.length });

  let scored = 0;
  let wrote = 0;
  let skipped = 0;
  let disagreements = 0;
  let estUsd = 0;
  let budgetExhausted = false;
  const useSmartArbiter = await arbiterShouldBeSmart();

  for (const c of cands) {
    // Leave ~10s of headroom. A single candidate takes 10-20s on Birdeye free tier.
    if (Date.now() - start > timeBudgetMs - 15_000) {
      budgetExhausted = true;
      break;
    }
    try {
      const snap = await buildSnapshot(c);
      if (!snap) {
        steps.push({ kind: "snapshot", symbol: c.symbol, ok: false, reason: "no overview" });
        skipped++;
        continue;
      }
      if (snap.safety.score < 3) {
        steps.push({
          kind: "snapshot",
          symbol: c.symbol,
          ok: false,
          reason: `safety=${snap.safety.score}/10`,
        });
        skipped++;
        continue;
      }
      steps.push({ kind: "snapshot", symbol: c.symbol, ok: true });

      const duel: DuelResult = await runDuel(snap, { useSmartArbiter });
      scored++;

      steps.push({
        kind: "hawk_score",
        symbol: c.symbol,
        direction: duel.hawk.direction,
        conviction: duel.hawk.conviction,
      });
      steps.push({
        kind: "owl_score",
        symbol: c.symbol,
        direction: duel.owl.direction,
        conviction: duel.owl.conviction,
      });

      if (duel.disagreed) {
        disagreements++;
        steps.push({
          kind: "disagreed",
          symbol: c.symbol,
          gap: Math.abs(duel.hawk.conviction - duel.owl.conviction),
        });
        if (duel.arbiter) {
          steps.push({ kind: "arbiter", symbol: c.symbol, winner: duel.arbiter.winner });
        }
      }

      steps.push({
        kind: "resolved",
        symbol: c.symbol,
        direction: duel.resolved.direction,
        conviction: duel.resolved.conviction,
        chosenBy: duel.chosenBy,
      });

      const totalIn = duel.hawk.tokensIn + duel.owl.tokensIn + (duel.arbiter?.tokensIn ?? 0);
      const totalOut = duel.hawk.tokensOut + duel.owl.tokensOut + (duel.arbiter?.tokensOut ?? 0);
      estUsd += (totalIn / 1_000_000) * 1 + (totalOut / 1_000_000) * 5;

      const res = await persistDuel(snap, duel);
      steps.push({
        kind: "persist",
        symbol: c.symbol,
        wrote: res.wrote,
        callId: res.callId,
        reason: res.reason,
      });
      if (res.wrote) wrote++;
      else skipped++;
    } catch (e) {
      steps.push({ kind: "error", symbol: c.symbol, error: (e as Error).message });
      skipped++;
    }
  }

  return {
    candidates: cands.length,
    scored,
    wrote,
    skipped,
    disagreements,
    steps,
    estUsd,
    budgetExhausted,
  };
}
