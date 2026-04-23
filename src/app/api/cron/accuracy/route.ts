import { NextResponse } from "next/server";
import { runAccuracy } from "@/lib/agent/runAccuracy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const qs = new URL(req.url).searchParams.get("secret") ?? "";
  return bearer === expected || qs === expected;
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();
  const result = await runAccuracy();
  const ms = Date.now() - t0;
  return NextResponse.json({ ok: true, ms, ...result });
}

export { handle as GET, handle as POST };
