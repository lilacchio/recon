// Seed the feed: run several scans back-to-back with a higher limit.
// Each scan uses trending ∪ new_listings as candidate pool. 4h dedupe per token.
import "./_env";
import { runScan } from "../src/lib/agent/runScan";

async function main() {
  const ROUNDS = Number(process.env.BACKFILL_ROUNDS ?? 4);
  const LIMIT = Number(process.env.BACKFILL_LIMIT ?? 6);
  let totalWrote = 0;
  let totalUsd = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const t0 = Date.now();
    const r = await runScan({ limit: LIMIT });
    totalWrote += r.wrote;
    totalUsd += r.estUsd;
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
      `round ${i + 1}/${ROUNDS}: cands=${r.candidates} wrote=${r.wrote} skipped=${r.skipped} disagreements=${r.disagreements} est=$${r.estUsd.toFixed(4)} · ${dt}s`,
    );
    // Small gap between rounds so trending has a chance to rotate.
    if (i < ROUNDS - 1) await new Promise((r) => setTimeout(r, 10_000));
  }
  console.log(`\ntotal: wrote=${totalWrote}  est=$${totalUsd.toFixed(4)}`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
