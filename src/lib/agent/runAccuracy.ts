import { sbAdmin } from "../supabase";
import { getPrice } from "../birdeye";

export type AccuracyResult = {
  checked: number;
  updated: number;
  errors: number;
};

// Walk all open calls younger than 7d, poll current price (serial — free tier
// blocks /defi/multi_price), insert a price_snap with pnl_pct vs entry.
export async function runAccuracy(opts: { maxAgeDays?: number } = {}): Promise<AccuracyResult> {
  const sb = sbAdmin();
  const maxAgeDays = opts.maxAgeDays ?? 7;
  const since = new Date(Date.now() - maxAgeDays * 86400_000).toISOString();

  const { data: calls, error } = await sb
    .from("calls")
    .select("id, token_address, price_at_call, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`fetch calls: ${error.message}`);
  if (!calls) return { checked: 0, updated: 0, errors: 0 };

  // Group by token to amortize: one price fetch per token, reuse across all open calls.
  const uniq = Array.from(new Set(calls.map((c) => c.token_address as string)));
  const prices = new Map<string, number>();
  let errors = 0;
  for (const addr of uniq) {
    try {
      const p = await getPrice(addr);
      prices.set(addr, p.value);
    } catch {
      errors++;
    }
  }

  let updated = 0;
  for (const call of calls) {
    const now = prices.get(call.token_address as string);
    if (now === undefined) continue;
    const entry = Number(call.price_at_call);
    if (!entry) continue;
    const pnl = ((now - entry) / entry) * 100;
    const { error: insErr } = await sb
      .from("price_snaps")
      .insert({ call_id: call.id, price: now, pnl_pct: pnl });
    if (!insErr) updated++;
  }

  return { checked: calls.length, updated, errors };
}
