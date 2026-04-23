import { NextResponse } from "next/server";
import { runScan } from "@/lib/agent/runScan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby tier caps at 60s. Scanner uses an internal time budget to bail gracefully.
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev mode: allow when unset
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const qs = new URL(req.url).searchParams.get("secret") ?? "";
  return bearer === expected || qs === expected;
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();
  const result = await runScan({ limit: 10, timeBudgetMs: 50_000 });
  const ms = Date.now() - t0;
  return NextResponse.json({ ok: true, ms, ...result });
}

export { handle as GET, handle as POST };
