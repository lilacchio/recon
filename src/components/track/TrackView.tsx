"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ClosedCall, CalibrationPoint } from "@/lib/track";

type Sort = "newest" | "biggest_win" | "biggest_loss";
type Filter = "all" | "hawk" | "owl" | "arbiter" | "consensus";

export function TrackView({
  calibration,
  calls,
}: {
  calibration: CalibrationPoint[];
  calls: ClosedCall[];
}) {
  const [sort, setSort] = useState<Sort>("newest");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    let r = [...calls];
    if (filter !== "all") r = r.filter((c) => c.chosenBy === filter);
    r.sort((a, b) => {
      if (sort === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "biggest_win") return b.pnlPct - a.pnlPct;
      return a.pnlPct - b.pnlPct;
    });
    return r;
  }, [calls, sort, filter]);

  return (
    <div className="flex flex-col gap-10">
      <div className="border border-[var(--border)] p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-sans text-[18px] font-semibold tracking-tight text-[var(--text)] sm:text-[20px]">
            Calibration curve
          </h2>
          <p className="font-mono text-[10.5px] text-[var(--text-mute)]">
            conviction bucket → actual green %
          </p>
        </div>
        <div className="h-[320px] w-full sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={calibration}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="bucket"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                stroke="rgba(255,255,255,0.1)"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                stroke="rgba(255,255,255,0.1)"
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-strong)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              />
              <ReferenceLine
                segment={[
                  { x: "0-10", y: 5 },
                  { x: "90-100", y: 95 },
                ]}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
                label={{
                  value: "perfect",
                  fill: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Line
                type="monotone"
                dataKey="hawk"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                name="hawk"
              />
              <Line
                type="monotone"
                dataKey="owl"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                name="owl"
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="#fcd34d"
                strokeWidth={2.5}
                dot={{ r: 3.5 }}
                connectNulls
                name="resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 font-mono text-[10.5px] text-[var(--text-mute)]">
          {calls.length} calls in sample. Buckets with zero samples are skipped.
          Short calls count green when price fell.
        </p>
      </div>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-[18px] font-semibold tracking-tight text-[var(--text)] sm:text-[20px]">
            Every closed call
          </h2>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-mute)]">
            <label className="flex items-center gap-2">
              sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-[var(--text)]"
              >
                <option value="newest">newest</option>
                <option value="biggest_win">biggest win</option>
                <option value="biggest_loss">biggest loss</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              chosen by
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
                className="border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-[var(--text)]"
              >
                <option value="all">all</option>
                <option value="hawk">hawk</option>
                <option value="owl">owl</option>
                <option value="arbiter">arbiter</option>
                <option value="consensus">consensus</option>
              </select>
            </label>
          </div>
        </div>

        <div className="border-t border-[var(--border)]">
          {rows.length === 0 ? (
            <p className="px-2 py-10 text-center font-mono text-[11px] text-[var(--text-mute)]">
              no calls match.
            </p>
          ) : (
            rows.map((c) => <Row key={c.id} call={c} />)
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ call }: { call: ClosedCall }) {
  const positive = call.pnlPct >= 0;
  const color = positive ? "var(--up)" : "var(--down)";
  const disagreed = call.chosenBy !== "consensus";
  return (
    <Link
      href={disagreed ? `/duel/${call.id}` : `/calls/${call.id}`}
      className="grid grid-cols-12 items-center gap-3 border-b border-[var(--border)] px-2 py-3 font-mono text-[11px] hover:bg-[var(--surface)]"
    >
      <span className="col-span-3 sm:col-span-2 font-sans text-[14px] font-semibold text-[var(--text)]">
        {call.symbol}
      </span>
      <span
        className="col-span-2 uppercase tracking-[0.14em]"
        style={{
          color:
            call.direction === "long"
              ? "var(--up)"
              : call.direction === "short"
              ? "var(--down)"
              : "var(--watch)",
        }}
      >
        {call.direction}
      </span>
      <span className="col-span-2 text-[var(--text-dim)]">conv {call.conviction}</span>
      <span className="col-span-2 hidden text-[var(--text-mute)] sm:inline">via {call.chosenBy}</span>
      <span
        className="col-span-3 text-right font-sans text-[14px] font-semibold tabular-nums sm:col-span-3"
        style={{ color }}
      >
        {positive ? "+" : ""}
        {call.pnlPct.toFixed(2)}%
      </span>
    </Link>
  );
}
