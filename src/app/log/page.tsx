import Link from "next/link";
import type { Metadata } from "next";
import { Split } from "lucide-react";
import { sbAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "agent log",
  description:
    "Every scan the agent has run. Token counts per model, arbiter verdicts, split flags. In the open.",
};

type LogRow = {
  id: string;
  created_at: string;
  direction: "long" | "short" | "watch";
  conviction: number;
  disagreed: boolean;
  chosen_by: "hawk" | "owl" | "arbiter" | "consensus";
  signals: Record<string, unknown> | null;
  tokens: { symbol: string | null } | null;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function LogPage() {
  const sb = sbAdmin();
  const callsRes = await sb
    .from("calls")
    .select(
      `id, created_at, direction, conviction, disagreed, chosen_by, signals,
       tokens:tokens!inner(symbol)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = ((callsRes.data as unknown as LogRow[]) ?? []).map((r) => ({
    ...r,
    tokens: Array.isArray(r.tokens) ? r.tokens[0] : r.tokens,
  }));

  const splits = rows.filter((r) => r.disagreed).length;
  const consensus = rows.filter((r) => r.chosen_by === "consensus").length;
  const totalTokens = rows.reduce((a, r) => {
    const s = (r.signals ?? {}) as { hawk_tokens?: { in?: number; out?: number }; owl_tokens?: { in?: number; out?: number } };
    return (
      a +
      (s.hawk_tokens?.in ?? 0) +
      (s.hawk_tokens?.out ?? 0) +
      (s.owl_tokens?.in ?? 0) +
      (s.owl_tokens?.out ?? 0)
    );
  }, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          the agent log
        </p>
        <h1 className="mt-2 font-sans text-[30px] font-semibold tracking-tight text-[var(--text)] sm:text-[40px]">
          Every scan, in the open.
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-[14px] leading-relaxed text-[var(--text-dim)]">
          Every token the agent has scored, in reverse chronological order.
          Token counts per model, which side the arbiter picked, whether the
          models split. All of it.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="scans" value={rows.length.toString()} sub="last 100" />
        <Stat
          label="splits"
          value={splits.toString()}
          sub={rows.length ? `${Math.round((splits / rows.length) * 100)}% disagreement` : "—"}
          color="var(--accent)"
        />
        <Stat
          label="consensus"
          value={consensus.toString()}
          sub={rows.length ? `${Math.round((consensus / rows.length) * 100)}% agreed` : "—"}
        />
        <Stat
          label="tokens moved"
          value={totalTokens.toLocaleString()}
          sub="hawk + owl, in + out"
        />
      </div>

      <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
        recent scans
      </p>
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center font-mono text-[11px] text-[var(--text-mute)]">
            no scans yet.
          </p>
        ) : (
          rows.map((r) => {
            const s = (r.signals ?? {}) as {
              hawk_tokens?: { in?: number; out?: number };
              owl_tokens?: { in?: number; out?: number };
              hawk_ms?: number;
              owl_ms?: number;
            };
            const hawkIn = s.hawk_tokens?.in ?? 0;
            const hawkOut = s.hawk_tokens?.out ?? 0;
            const owlIn = s.owl_tokens?.in ?? 0;
            const owlOut = s.owl_tokens?.out ?? 0;
            const dirColor =
              r.direction === "long"
                ? "var(--up)"
                : r.direction === "short"
                ? "var(--down)"
                : "var(--watch)";
            return (
              <Link
                key={r.id}
                href={r.disagreed ? `/duel/${r.id}` : `/calls/${r.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 font-mono text-[11px] transition-colors hover:bg-[var(--surface)] sm:px-5"
              >
                <span className="w-16 text-[var(--text-mute)] tabular-nums">
                  {fmtTime(r.created_at)}
                </span>
                <span className="w-16 text-[var(--text)] font-semibold">
                  ${r.tokens?.symbol ?? "—"}
                </span>
                <span
                  className="w-14 uppercase tracking-[0.12em]"
                  style={{ color: dirColor }}
                >
                  {r.direction}
                </span>
                <span className="w-14 text-[var(--text-dim)] tabular-nums">
                  conv {r.conviction}
                </span>
                <span className="w-36 text-[var(--text-mute)] tabular-nums">
                  hawk {hawkIn}→{hawkOut}
                </span>
                <span className="w-36 text-[var(--text-mute)] tabular-nums">
                  owl {owlIn}→{owlOut}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {r.disagreed && (
                    <span className="flex items-center gap-1 text-[var(--accent)]">
                      <Split className="h-3 w-3" strokeWidth={2.5} />
                      split
                    </span>
                  )}
                  <span className="text-[var(--text-dim)]">· via {r.chosen_by}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>

      <p className="mt-8 font-mono text-[10.5px] text-[var(--text-mute)]">
        scans fire every 15 minutes via Vercel cron. Disagreements trigger a third LLM call; consensus skips it.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div>
      <div
        className="font-sans text-[26px] font-semibold leading-none tabular-nums text-[var(--text)] sm:text-[32px]"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-[var(--text-mute)]">
        {sub}
      </div>
    </div>
  );
}
