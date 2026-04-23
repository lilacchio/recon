import { ImageResponse } from "next/og";
import { getDuelCall } from "@/lib/duel-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BG = "#0a0a0b";
const BORDER = "#2f3338";
const TEXT = "#e8e8e6";
const DIM = "#7a7d83";
const MUTE = "#4a4d52";
const ACCENT = "#fcd34d";

function dirColor(d: "long" | "short" | "watch") {
  return d === "long" ? "#10b981" : d === "short" ? "#ef4444" : "#60a5fa";
}

function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  const call = await getDuelCall(id);
  if (!call) return new Response("not found", { status: 404 });

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
          padding: 48,
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
          <span>recon · the duel</span>
          <span style={{ color: ACCENT }}>
            {call.disagreed ? "split · arbiter resolved" : "consensus"}
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 18, alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
            ${call.symbol}
          </span>
          <span style={{ fontSize: 28, color: DIM }}>{clip(call.name, 38)}</span>
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 28, flex: 1 }}>
          <Panel
            label="hawk"
            sub="fast · haiku"
            dir={call.hawk.direction}
            conv={call.hawk.conviction}
            text={call.hawk.reasoning}
            winner={call.chosenBy === "hawk"}
          />
          <Panel
            label="owl"
            sub="deep · sonnet"
            dir={call.owl.direction}
            conv={call.owl.conviction}
            text={call.owl.reasoning}
            winner={call.chosenBy === "owl"}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 22,
            fontSize: 20,
            color: DIM,
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 18,
          }}
        >
          <span>
            arbiter picked{" "}
            <span style={{ color: ACCENT, fontWeight: 600 }}>{call.chosenBy}</span>
          </span>
          <span>
            {call.direction.toUpperCase()} · conv {call.conviction} · {call.horizon}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Panel({
  label,
  sub,
  dir,
  conv,
  text,
  winner,
}: {
  label: string;
  sub: string;
  dir: "long" | "short" | "watch";
  conv: number;
  text: string;
  winner: boolean;
}) {
  const color = dirColor(dir);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        border: `2px solid ${winner ? ACCENT : BORDER}`,
        padding: 22,
        background: winner ? "rgba(252,211,77,0.06)" : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: MUTE }}>
          {sub}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <span
          style={{
            border: `1px solid ${color}`,
            color,
            padding: "2px 8px",
            fontSize: 14,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {dir}
        </span>
        <span style={{ fontSize: 18, color: DIM }}>
          conv <span style={{ color: TEXT, fontWeight: 600 }}>{conv}</span>
        </span>
        {winner && (
          <span
            style={{
              marginLeft: "auto",
              color: ACCENT,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              border: `1px solid ${ACCENT}`,
              padding: "2px 8px",
            }}
          >
            chosen
          </span>
        )}
      </div>
      <p style={{ display: "block", fontSize: 18, lineHeight: 1.5, color: DIM, marginTop: 14 }}>
        {clip(text, 280)}
      </p>
    </div>
  );
}
