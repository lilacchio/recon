// One tiny Haiku 4.5 call via OpenRouter. Run: pnpm dlx tsx scripts/smoke-llm.ts
import "./_env";
import { chat, LLM_FAST } from "../src/lib/llm";

async function main() {
  const t0 = Date.now();
  const res = await chat({
    model: LLM_FAST,
    maxTokens: 12,
    temperature: 0,
    messages: [
      { role: "system", content: "Reply with exactly: ok" },
      { role: "user", content: "ping" },
    ],
  });
  const dt = Date.now() - t0;
  console.log(`✓ ${LLM_FAST}`);
  console.log(`  reply : ${JSON.stringify(res.text.trim())}`);
  console.log(`  tokens: in=${res.usage.in} out=${res.usage.out}`);
  console.log(`  latency: ${dt}ms`);
  process.exit(0);
}

main().catch((e) => {
  console.error("fatal", e?.message ?? e);
  process.exit(1);
});
