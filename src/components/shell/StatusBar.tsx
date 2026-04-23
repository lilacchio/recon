import { sbAdmin } from "@/lib/supabase";

function fmtAgo(ms: number) {
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${String(mins).padStart(2, "0")}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

async function loadStatus() {
  const sb = sbAdmin();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const dayStr = startOfDay.toISOString().slice(0, 10);

  const [latestRes, todayRes, splitsRes] = await Promise.all([
    sb.from("calls").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("calls").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
    sb.from("calls").select("id", { count: "exact", head: true }).eq("disagreed", true).gte("created_at", startOfDay.toISOString()),
  ]);

  const latest = latestRes.data?.created_at
    ? fmtAgo(Date.now() - new Date(latestRes.data.created_at).getTime())
    : "—";
  const today = todayRes.count ?? 0;
  const splits = splitsRes.count ?? 0;

  void dayStr;
  return { latest, today, splits };
}

export async function StatusBar() {
  let s: Awaited<ReturnType<typeof loadStatus>>;
  try {
    s = await loadStatus();
  } catch {
    s = { latest: "—", today: 0, splits: 0 };
  }

  return (
    <div className="hidden h-6 shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--bg)] px-5 font-mono text-[10.5px] text-[var(--text-mute)] lg:flex">
      <div className="flex items-center gap-5">
        <span>
          <span className="text-[var(--text-dim)]">last_scan</span>{" "}
          <span className="text-[var(--text)]">{s.latest}</span>
        </span>
        <span>
          <span className="text-[var(--text-dim)]">calls_today</span>{" "}
          <span className="text-[var(--text)]">{s.today}</span>
        </span>
        <span>
          <span className="text-[var(--text-dim)]">splits_today</span>{" "}
          <span className="text-[var(--accent)]">{s.splits}</span>
        </span>
      </div>
      <div className="flex items-center gap-5">
        <span className="text-[var(--text-dim)]">birdeye · solana</span>
      </div>
    </div>
  );
}
