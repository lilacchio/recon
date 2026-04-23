import { NextResponse } from "next/server";
import { sbAdmin } from "@/lib/supabase";
import type { FeedCall } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNum(v: string | number | null | undefined, d = 0) {
  if (v == null) return d;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = sbAdmin();
  const { data, error } = await sb
    .from("calls")
    .select(
      `id, token_address, direction, conviction, horizon, risk, reasoning,
       disagreed, chosen_by, price_at_call, liquidity_at_call, signals, created_at,
       tokens:tokens!inner(symbol, name),
       price_snaps(price, pnl_pct, taken_at)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  const tok = Array.isArray(data.tokens) ? data.tokens[0] : data.tokens;
  const entry = toNum(data.price_at_call);
  const snaps = (data.price_snaps ?? []) as Array<{
    price: number | string;
    pnl_pct: number | string | null;
    taken_at: string;
  }>;
  const latest = snaps.length
    ? [...snaps].sort(
        (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
      )[0]
    : null;
  const current = latest ? toNum(latest.price) : entry;
  const pnl = entry > 0 ? ((current - entry) / entry) * 100 : 0;
  const ageMins = Math.max(
    0,
    Math.floor((Date.now() - new Date(data.created_at).getTime()) / 60_000),
  );

  const call: FeedCall = {
    id: data.id,
    n: 0,
    symbol: tok?.symbol ?? "—",
    name: tok?.name ?? "",
    address: data.token_address,
    direction: data.direction,
    conviction: data.conviction,
    horizon: data.horizon,
    risk: data.risk,
    reasoning: data.reasoning,
    priceAtCall: entry,
    currentPrice: current,
    pnlPct: pnl,
    ageMins,
    liquidityUsd: toNum(data.liquidity_at_call),
    disagreed: data.disagreed,
    chosenBy: data.chosen_by,
    spark: [],
    createdAt: data.created_at,
  };
  return NextResponse.json(call);
}
