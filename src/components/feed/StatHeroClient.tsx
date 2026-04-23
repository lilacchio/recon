"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { FeedStats } from "@/lib/feed";

export function StatHeroClient({ stats }: { stats: FeedStats }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = [
    { label: "calls filed", value: stats.calls.toString(), sub: "all-time" },
    {
      label: "green rate",
      value: `${stats.greenPct.toFixed(1)}%`,
      sub: "at latest snap",
    },
    {
      label: "avg pnl",
      value: `${stats.avgPnl >= 0 ? "+" : ""}${stats.avgPnl.toFixed(1)}%`,
      sub: "winners only",
      color: stats.avgPnl >= 0 ? "var(--up)" : "var(--down)",
    },
    {
      label: "uptime",
      value: `${stats.uptimeHours}h`,
      sub: "since first scan",
    },
  ];

  const duelSummary = `hawk ${stats.hawkWon} · owl ${stats.owlWon} · arbiter ${stats.arbiter} · agreed ${stats.consensus}`;

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div
        className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(252,211,77,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)] sm:text-[11px]">
            live · two agents argue · sprint 01
          </p>
          <p className="hidden font-mono text-[10.5px] text-[var(--text-mute)] sm:block">
            {duelSummary}
          </p>
        </div>

        <motion.div
          initial={mounted ? "hidden" : false}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-2 gap-y-8 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6"
        >
          {items.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { y: 10, opacity: 0 },
                show: { y: 0, opacity: 1, transition: { duration: 0.35 } },
              }}
              className="flex flex-col"
            >
              <div
                className="font-sans text-[40px] font-semibold leading-none tracking-tight tabular-nums text-[var(--text)] sm:text-[56px] lg:text-[72px]"
                style={s.color ? { color: s.color } : undefined}
              >
                {s.value}
              </div>
              <div className="mt-3 flex items-baseline gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-dim)] sm:text-[11px]">
                <span>{s.label}</span>
                <span className="text-[var(--text-mute)] normal-case tracking-normal">
                  · {s.sub}
                </span>
              </div>
              <div className="mt-3 h-px w-10 bg-[var(--accent)]" />
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-10 max-w-xl font-sans text-[14px] leading-relaxed text-[var(--text-dim)] sm:mt-12 sm:text-[15px]">
          If you trade Solana memecoins, one LLM is not enough. Single-model
          alpha calls read like oracles and rot like them too. Recon runs
          Haiku and Sonnet on the same snapshot. When they agree, the call
          carries weight. When they split, a third model breaks the tie and
          you get to read both arguments before trusting either. Wins,
          losses, and disagreements all file below. Nothing gets deleted.
        </p>
      </div>
    </section>
  );
}
