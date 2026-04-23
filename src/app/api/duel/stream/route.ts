import { getTokenOverview, getHolderDistribution, getRecentTxns, heuristicSafety } from "@/lib/birdeye";
import { runDuel, type DuelEvent } from "@/lib/agent/duel";
import type { Snapshot } from "@/lib/agent/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// GET /api/duel/stream?tokenAddress=<solana-mint>
// Returns Server-Sent Events:
//   event: <kind>
//   data:  <json>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("tokenAddress");
  if (!address) return new Response("tokenAddress required", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: DuelEvent | { kind: "error"; error: string } | { kind: "snapshot_ready"; symbol: string }) => {
        const payload = `event: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // connection closed; swallow
        }
      };

      try {
        // Build snapshot inline (3 birdeye calls, serialized by the limiter)
        const [overview, holders, txns] = await Promise.all([
          getTokenOverview(address),
          getHolderDistribution(address, 10).catch(() => []),
          getRecentTxns(address, 30).catch(() => []),
        ]);

        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const recent1h = txns.filter((t) => t.blockUnixTime >= oneHourAgo);
        const bigBuyCount1h = recent1h.filter(
          (t) => t.side === "buy" && (t.volumeUSD ?? 0) >= 2_000,
        ).length;
        const top10PctTotal = holders.reduce((s, h) => s + (h.percentage ?? 0), 0);
        const lastTrade = overview.lastTradeUnixTime ?? null;
        const ageMinutes = lastTrade
          ? Math.max(0, Math.floor((Date.now() / 1000 - lastTrade) / 60))
          : 60 * 24;
        const safety = heuristicSafety({ holders, overview, ageMinutes });

        const snapshot: Snapshot = {
          address,
          symbol: overview.symbol,
          source: "trending",
          overview,
          top10: holders,
          top10PctTotal,
          recentTxns: recent1h,
          bigBuyCount1h,
          txnCount1h: recent1h.length,
          safety,
          ageMinutes,
        };
        send({ kind: "snapshot_ready", symbol: overview.symbol });

        await runDuel(snapshot, { emit: send });
      } catch (e) {
        send({ kind: "error", error: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
