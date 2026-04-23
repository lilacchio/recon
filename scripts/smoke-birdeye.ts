// Hits every Birdeye endpoint the agent relies on. Exits 0 only if all work.
// Run: pnpm dlx tsx scripts/smoke-birdeye.ts
import "./_env";
import {
  getTrending,
  getNewListings,
  getTokenOverview,
  getHolderDistribution,
  getRecentTxns,
  getPrice,
  getOhlcv,
  heuristicSafety,
} from "../src/lib/birdeye";

const log = (tag: string, msg: string) =>
  console.log(`${tag.padEnd(10)} ${msg}`);

async function main() {
  const t0 = Date.now();
  const results: { name: string; ok: boolean; detail: string }[] = [];
  const push = (name: string, ok: boolean, detail: string) => {
    results.push({ name, ok, detail });
    log(ok ? "✓" : "✗", `${name.padEnd(18)} ${detail}`);
  };

  let pickAddr = "So11111111111111111111111111111111111111112"; // wSOL as default

  try {
    const trending = await getTrending({ limit: 10 });
    push("trending", true, `${trending.length} tokens · #1 ${trending[0]?.symbol}`);
    if (trending[0]?.address) pickAddr = trending[0].address;
  } catch (e) {
    push("trending", false, (e as Error).message);
  }

  try {
    const listings = await getNewListings({ limit: 10 });
    push("new_listings", true, `${listings.length} items · newest ${listings[0]?.symbol ?? "?"}`);
  } catch (e) {
    push("new_listings", false, (e as Error).message);
  }

  let overview: Awaited<ReturnType<typeof getTokenOverview>> | null = null;
  try {
    overview = await getTokenOverview(pickAddr);
    push(
      "overview",
      true,
      `${overview.symbol} · liq $${(overview.liquidity ?? 0).toFixed(0)} · ${overview.holder ?? "?"} holders`,
    );
  } catch (e) {
    push("overview", false, (e as Error).message);
  }

  let holders: Awaited<ReturnType<typeof getHolderDistribution>> = [];
  try {
    holders = await getHolderDistribution(pickAddr, 10);
    const top10 = holders.reduce((s, h) => s + (h.percentage ?? 0), 0);
    push("holders", true, `top10 = ${top10.toFixed(1)}%`);
  } catch (e) {
    push("holders", false, (e as Error).message);
  }

  try {
    const txns = await getRecentTxns(pickAddr, 10);
    push("txns", true, `${txns.length} recent swaps`);
  } catch (e) {
    push("txns", false, (e as Error).message);
  }

  try {
    const price = await getPrice(pickAddr);
    push("price", true, `$${price.value.toFixed(6)}`);
  } catch (e) {
    push("price", false, (e as Error).message);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const ohlcv = await getOhlcv(pickAddr, {
      type: "15m",
      time_from: now - 60 * 60 * 6,
      time_to: now,
    });
    push("ohlcv", true, `${ohlcv.length} candles · last close ${ohlcv.at(-1)?.c.toFixed(6)}`);
  } catch (e) {
    push("ohlcv", false, (e as Error).message);
  }

  if (overview && holders.length) {
    const h = heuristicSafety({
      holders,
      overview,
      ageMinutes: 60 * 24 * 365,
    });
    push("safety_heur", true, `score ${h.score}/10 · ${h.reasons.length || "no"} flags`);
  }

  const ok = results.filter((r) => r.ok).length;
  const bad = results.length - ok;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${ok}/${results.length} green · ${dt}s`);
  process.exit(bad === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("fatal", e);
  process.exit(1);
});
