import "./_env";
import { runAccuracy } from "../src/lib/agent/runAccuracy";

async function main() {
  const t0 = Date.now();
  const res = await runAccuracy();
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`checked=${res.checked}  updated=${res.updated}  errors=${res.errors}  · ${dt}s`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
