import { ImageResponse } from "next/og";
import { sbAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BG = "#0a0a0b";
const BORDER = "#2f3338";
const TEXT = "#e8e8e6";
const DIM = "#7a7d83";
const MUTE = "#4a4d52";
const ACCENT = "#fcd34d";
const UP = "#10b981";
const DOWN = "#ef4444";
const WATCH = "#60a5fa";

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) : v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select(
      `id, direction, conviction, horizon, reasoning, price_at_call, chosen_by, disagreed, created_at,
       tokens:tokens!inner(symbol, name),
       price_snaps(price, pnl_pct, taken_at)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return new Response("not found", { status: 404 });

  const tok = Array.isArray(data.tokens) ? data.tokens[0] : data.tokens;
  const symbol = tok?.symbol ?? "—";
  const name = tok?.name ?? "";
  const entry = toNum(data.price_at_call);
  const snaps = data.price_snaps ?? [];
  const latest = snaps.length
    ? [...snaps].sort(
        (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
      )[0]
    : null;
  const current = latest ? toNum(latest.price) : entry;
  const pnl = entry > 0 ? ((current - entry) / entry) * 100 : 0;
  const sideAdjusted = data.direction === "short" ? -pnl : pnl;
  const pnlColor =
    data.direction === "watch" ? WATCH : sideAdjusted >= 0 ? UP : DOWN;
  const dirColor =
    data.direction === "long" ? UP : data.direction === "short" ? DOWN : WATCH;
  const reasoning = (data.reasoning as string) ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          fontFamily: "sans-serif",
          color: TEXT,
          padding: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: MUTE,
          }}
        >
          <span>recon · filed call</span>
          <span style={{ color: ACCENT }}>
            via {data.chosen_by}
            {data.disagreed ? " · split" : ""}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 36 }}>
          <span style={{ fontSize: 110, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>
            ${symbol}
          </span>
          <span style={{ fontSize: 28, color: DIM }}>{name.slice(0, 40)}</span>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 20, alignItems: "center" }}>
          <span
            style={{
              border: `1.5px solid ${dirColor}`,
              color: dirColor,
              padding: "6px 14px",
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {data.direction}
          </span>
          <span style={{ fontSize: 22, color: DIM }}>
            conv <span style={{ color: TEXT, fontWeight: 600 }}>{data.conviction}</span>
          </span>
          <span style={{ fontSize: 22, color: DIM }}>· {data.horizon}</span>
        </div>

        <p
          style={{
            display: "block",
            fontSize: 22,
            lineHeight: 1.55,
            color: DIM,
            marginTop: 28,
            flex: 1,
          }}
        >
          {reasoning.slice(0, 260)}
          {reasoning.length > 260 ? "…" : ""}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 24,
            marginTop: 22,
          }}
        >
          <span style={{ fontSize: 20, color: DIM }}>
            entry ${entry < 0.01 ? entry.toFixed(6) : entry.toFixed(4)} · now $
            {current < 0.01 ? current.toFixed(6) : current.toFixed(4)}
          </span>
          <span style={{ fontSize: 58, fontWeight: 700, color: pnlColor, letterSpacing: -1 }}>
            {sideAdjusted >= 0 ? "+" : ""}
            {sideAdjusted.toFixed(2)}%
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
