// Manually run one Duel scan. Prints the step trace.
// Run: pnpm exec tsx scripts/run-once.ts
import "./_env";
import { runScan } from "../src/lib/agent/runScan";

async function main() {
  const t0 = Date.now();
  const res = await runScan({ limit: 3 });
  for (const s of res.steps) {
    switch (s.kind) {
      case "candidates":
        console.log(`→ ${s.count} candidates`);
        break;
      case "snapshot":
        console.log(`  snapshot   ${s.symbol.padEnd(10)} ${s.ok ? "ok" : `skip (${s.reason})`}`);
        break;
      case "hawk_score":
        console.log(`    hawk     ${s.symbol.padEnd(10)} ${s.direction} conv=${s.conviction}`);
        break;
      case "owl_score":
        console.log(`    owl      ${s.symbol.padEnd(10)} ${s.direction} conv=${s.conviction}`);
        break;
      case "disagreed":
        console.log(`    ! split  ${s.symbol.padEnd(10)} gap=${s.gap}`);
        break;
      case "arbiter":
        console.log(`    arbiter  ${s.symbol.padEnd(10)} picked ${s.winner}`);
        break;
      case "resolved":
        console.log(
          `  resolved   ${s.symbol.padEnd(10)} ${s.direction} conv=${s.conviction} via ${s.chosenBy}`,
        );
        break;
      case "persist":
        console.log(
          `  persist    ${s.symbol.padEnd(10)} ${s.wrote ? `wrote ${s.callId?.slice(0, 8)}` : `skip (${s.reason})`}`,
        );
        break;
      case "error":
        console.log(`  ERROR      ${s.symbol.padEnd(10)} ${s.error}`);
        break;
    }
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `\ncandidates=${res.candidates}  scored=${res.scored}  wrote=${res.wrote}  skipped=${res.skipped}  disagreements=${res.disagreements}  est_usd=$${res.estUsd.toFixed(4)}  · ${dt}s`,
  );
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
