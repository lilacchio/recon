"use client";

import { useState } from "react";
import { ChevronDown, Database } from "lucide-react";

export function DataReceipts({
  endpoints,
  signals,
}: {
  endpoints: { name: string; purpose: string }[];
  signals: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);

  const digest: Array<[string, string]> = [
    ["liquidity", fmtUsd(signals.liquidity)],
    ["marketCap", fmtUsd(signals.marketCap)],
    ["holders", fmtNum(signals.holders)],
    ["top10 concentration", fmtPct(signals.top10Pct)],
    ["1h volume", fmtUsd(signals.v1hUSD)],
    ["24h volume", fmtUsd(signals.v24hUSD)],
    ["txns last 1h", fmtNum(signals.txns1h)],
    ["big buys last 1h", fmtNum(signals.bigBuys1h)],
    ["safety score", `${signals.safetyScore ?? "—"}/10`],
    ["age at call", `${signals.ageMinutes ?? 0}m`],
  ];

  return (
    <div className="border border-[var(--border-strong)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2.5} />
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          data receipts
        </p>
      </div>

      <div className="mb-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
          Birdeye endpoints queried
        </p>
        <ul className="flex flex-col gap-2">
          {endpoints.map((e) => (
            <li key={e.name} className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-2 last:border-none">
              <code className="font-mono text-[11.5px] text-[var(--text)]">{e.name}</code>
              <span className="text-right font-mono text-[10.5px] text-[var(--text-mute)]">{e.purpose}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
          signals that drove the call
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px]">
          {digest.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[var(--border)] pb-1.5">
              <dt className="text-[var(--text-mute)]">{k}</dt>
              <dd className="text-[var(--text)] tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
        {open ? "hide" : "show"} raw json
      </button>
      {open && (
        <pre className="mt-3 max-h-80 overflow-auto border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-[10.5px] leading-[1.5] text-[var(--text-dim)]">
          {JSON.stringify(signals, null, 2)}
        </pre>
      )}
    </div>
  );
}

function fmtUsd(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : 0;
  if (!Number.isFinite(n) || n === 0) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtNum(v: unknown): string {
  const n = typeof v === "number" ? v : 0;
  if (!n) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}
function fmtPct(v: unknown): string {
  const n = typeof v === "number" ? v : 0;
  if (!n) return "—";
  return `${n.toFixed(1)}%`;
}
