"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Eye, Clock, Split } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";
import type { FeedCall } from "@/lib/feed";

const DirectionIcon = {
  long: ArrowUpRight,
  short: ArrowDownRight,
  watch: Eye,
};

const formatPrice = (p: number) =>
  p < 0.01 ? p.toFixed(6) : p < 1 ? p.toFixed(4) : p.toFixed(2);

const formatAge = (m: number) => {
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h${m % 60}m`;
  return `${Math.floor(m / 1440)}d`;
};

const formatLiquidity = (n: number) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

export function CallRow({ call, index }: { call: FeedCall; index: number }) {
  const Dir = DirectionIcon[call.direction];
  const positive = call.pnlPct >= 0;
  const pnlColor = positive ? "var(--up)" : "var(--down)";
  const href = call.disagreed ? `/duel/${call.id}` : `/calls/${call.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className="group relative border-b border-[var(--border)] px-5 py-5 transition-colors hover:bg-[var(--surface)] sm:px-8 sm:py-6"
    >
      <Link
        href={href}
        aria-label={`open ${call.symbol} ${call.disagreed ? "duel replay" : "call detail"}`}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 pointer-events-none flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="font-sans text-[17px] font-semibold tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] sm:text-[19px]">
              {call.symbol}
            </span>
            <span className="font-sans text-[12px] text-[var(--text-mute)] sm:text-[12.5px]">
              {call.name}
            </span>
            <DirectionBadge direction={call.direction} />
            <HorizonBadge horizon={call.horizon} />
            {call.disagreed && <SplitBadge />}
            <ChosenByTag chosenBy={call.chosenBy} />
          </div>
          <div className="mt-1 font-mono text-[10px] text-[var(--text-mute)] sm:text-[10.5px]">
            #{call.n.toString().padStart(3, "0")} · filed {formatAge(call.ageMins)} ago
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div
            className="flex items-baseline gap-1 font-sans text-[17px] font-semibold leading-none tabular-nums sm:text-[20px]"
            style={{ color: pnlColor }}
          >
            <Dir className="h-3.5 w-3.5" strokeWidth={2.5} />
            {positive ? "+" : ""}
            {call.pnlPct.toFixed(2)}%
          </div>
          <Sparkline points={call.spark} up={positive} width={84} height={22} />
        </div>
      </div>

      <p className="mt-3 max-w-2xl font-sans text-[13px] leading-[1.6] text-[var(--text-dim)] sm:mt-4 sm:text-[13.5px]">
        {call.reasoning}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[10.5px] text-[var(--text-mute)]">
          <span>
            entry <span className="text-[var(--text-dim)]">${formatPrice(call.priceAtCall)}</span>
          </span>
          <span>
            now <span className="text-[var(--text-dim)]">${formatPrice(call.currentPrice)}</span>
          </span>
          <span>
            liq <span className="text-[var(--text-dim)]">{formatLiquidity(call.liquidityUsd)}</span>
          </span>
          <span>
            risk <span className="text-[var(--text-dim)]">{call.risk}/10</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
            conv
          </span>
          <div className="h-[3px] w-20 bg-[var(--surface)] sm:w-28">
            <div
              className="h-full"
              style={{
                width: `${call.conviction}%`,
                background: "var(--accent)",
              }}
            />
          </div>
          <span className="font-sans text-[14px] font-semibold tabular-nums text-[var(--text)] sm:text-[15px]">
            {call.conviction}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function DirectionBadge({ direction }: { direction: FeedCall["direction"] }) {
  const map = {
    long: { label: "long", color: "var(--up)" },
    short: { label: "short", color: "var(--down)" },
    watch: { label: "watch", color: "var(--watch)" },
  } as const;
  const s = map[direction];
  return (
    <span
      className="border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
      style={{ borderColor: s.color, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function HorizonBadge({ horizon }: { horizon: FeedCall["horizon"] }) {
  return (
    <span className="flex items-center gap-1 border border-[var(--border-strong)] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
      <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />
      {horizon}
    </span>
  );
}

function SplitBadge() {
  return (
    <span className="flex items-center gap-1 border border-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
      <Split className="h-2.5 w-2.5" strokeWidth={2.5} />
      split
    </span>
  );
}

function ChosenByTag({ chosenBy }: { chosenBy: FeedCall["chosenBy"] }) {
  const label = {
    hawk: "hawk",
    owl: "owl",
    arbiter: "arb",
    consensus: "agreed",
  }[chosenBy];
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--text-mute)]">
      · via {label}
    </span>
  );
}
