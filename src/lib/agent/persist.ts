import { sbAdmin } from "../supabase";
import type { Snapshot } from "./snapshot";
import type { DuelResult } from "./duel";

const DEDUPE_MS = 4 * 60 * 60 * 1000; // 4h

export type PersistResult = { wrote: boolean; callId: string | null; reason?: string };

export async function persistDuel(s: Snapshot, d: DuelResult): Promise<PersistResult> {
  const sb = sbAdmin();

  const { error: tokErr } = await sb.from("tokens").upsert(
    {
      address: s.address,
      symbol: s.symbol,
      name: s.overview.name ?? null,
      decimals: s.overview.decimals,
      logo_uri: null,
    },
    { onConflict: "address" },
  );
  if (tokErr) return { wrote: false, callId: null, reason: `token upsert: ${tokErr.message}` };

  const since = new Date(Date.now() - DEDUPE_MS).toISOString();
  const { data: recent, error: dupErr } = await sb
    .from("calls")
    .select("id")
    .eq("token_address", s.address)
    .gte("created_at", since)
    .limit(1);
  if (dupErr) return { wrote: false, callId: null, reason: `dedupe check: ${dupErr.message}` };
  if (recent && recent.length > 0) {
    return { wrote: false, callId: null, reason: "deduped (called within 4h)" };
  }

  const price = s.overview.price ?? 0;

  const signals = {
    source: s.source,
    liquidity: s.overview.liquidity ?? 0,
    marketCap: s.overview.marketCap ?? 0,
    priceChange1h: s.overview.priceChange1h ?? null,
    priceChange24h: s.overview.priceChange24hPercent ?? null,
    v1hUSD: s.overview.v1hUSD ?? 0,
    v24hUSD: s.overview.v24hUSD ?? 0,
    holders: s.overview.holder ?? 0,
    top10Pct: s.top10PctTotal,
    txns1h: s.txnCount1h,
    bigBuys1h: s.bigBuyCount1h,
    safetyScore: s.safety.score,
    safetyFlags: s.safety.reasons,
    ageMinutes: s.ageMinutes,
    promptVersion: d.promptVersion,
    // Data receipts: which endpoints drove the snapshot
    endpoints: [
      { name: "/defi/token_overview", purpose: "price, liquidity, holder count, v1h/v24h" },
      { name: "/defi/v3/token/holder", purpose: "top-10 concentration" },
      { name: "/defi/txs/token", purpose: "recent 1h flow + big buy count" },
    ],
  };

  const { data: inserted, error: insErr } = await sb
    .from("calls")
    .insert({
      token_address: s.address,
      direction: d.resolved.direction,
      conviction: d.resolved.conviction,
      horizon: d.resolved.horizon,
      risk: d.resolved.risk,
      reasoning: d.resolved.reasoning,
      hawk_decision: d.hawk,
      owl_decision: d.owl,
      disagreed: d.disagreed,
      chosen_by: d.chosenBy,
      arbiter_reasoning: d.arbiter?.reasoning ?? null,
      signals,
      price_at_call: price,
      liquidity_at_call: s.overview.liquidity ?? null,
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    return { wrote: false, callId: null, reason: `insert call: ${insErr?.message ?? "unknown"}` };
  }

  await sb.from("price_snaps").insert({
    call_id: inserted.id,
    price,
    pnl_pct: 0,
  });

  // Budget tracking.
  const totalIn = d.hawk.tokensIn + d.owl.tokensIn + (d.arbiter?.tokensIn ?? 0);
  const totalOut = d.hawk.tokensOut + d.owl.tokensOut + (d.arbiter?.tokensOut ?? 0);
  // Rough OpenRouter pricing blend: ~$1/1M in, ~$5/1M out for anthropic models averaged.
  const estUsd = (totalIn / 1_000_000) * 1 + (totalOut / 1_000_000) * 5;
  await sb.rpc("increment_token_usage", { p_in: totalIn, p_out: totalOut, p_usd: estUsd }).then(
    () => {},
    async () => {
      // RPC doesn't exist — fall back to a manual upsert.
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await sb
        .from("token_usage")
        .select("tokens_in, tokens_out, est_usd")
        .eq("day", today)
        .maybeSingle();
      await sb.from("token_usage").upsert({
        day: today,
        tokens_in: (existing?.tokens_in ?? 0) + totalIn,
        tokens_out: (existing?.tokens_out ?? 0) + totalOut,
        est_usd: (Number(existing?.est_usd) || 0) + estUsd,
        updated_at: new Date().toISOString(),
      });
    },
  );

  return { wrote: true, callId: inserted.id };
}
