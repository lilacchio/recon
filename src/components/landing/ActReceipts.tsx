"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

type ProofCall = {
  id: string;
  symbol: string;
  direction: "long" | "short" | "watch";
  conviction: number;
  disagreed: boolean;
  pnl: number;
};

export function ActReceipts({ calls }: { calls: ProofCall[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const headingY = useTransform(scrollYProgress, [0, 0.35], [60, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section
      ref={ref}
      className="relative border-t border-[var(--border)] bg-[#0a0a0a] px-5 py-32 sm:px-8 sm:py-40 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div style={{ y: headingY, opacity: headingOpacity }} className="max-w-2xl">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[var(--accent)]">
            act iii · receipts
          </p>
          <h2 className="mt-4 font-sans text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            Every call. Every disagreement.
            <br />
            <span className="italic text-[var(--accent)]">All of it, timestamped.</span>
          </h2>
          <p className="mt-6 max-w-xl font-sans text-[14.5px] leading-[1.6] text-white/70">
            No deletions, no quiet edits. When the price moves, the feed shows whether the models were right. These are the last three, pulled live.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {calls.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/20 px-6 py-16 text-center font-mono text-[11px] text-white/40">
              the scanner hasn&apos;t filed anything yet.
            </div>
          ) : (
            calls.map((c, i) => <ReceiptCard key={c.id} call={c} index={i} progress={scrollYProgress} />)
          )}
        </div>
      </div>
    </section>
  );
}

function ReceiptCard({
  call,
  index,
  progress,
}: {
  call: ProofCall;
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = 0.25 + index * 0.08;
  const end = start + 0.2;
  const y = useTransform(progress, [start, end], [80, 0]);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const rotate = useTransform(progress, [start, end], [index % 2 === 0 ? -3 : 3, 0]);

  const positive = call.pnl >= 0;
  const dirColor =
    call.direction === "long"
      ? "var(--up)"
      : call.direction === "short"
      ? "var(--down)"
      : "var(--watch)";

  return (
    <motion.div style={{ y, opacity, rotate }}>
      <Link
        href={call.disagreed ? `/duel/${call.id}` : `/calls/${call.id}`}
        className="group flex flex-col border border-white/20 bg-black/50 p-6 backdrop-blur-sm transition-colors hover:border-[var(--accent)]"
      >
        <div className="flex items-start justify-between">
          <span className="font-sans text-[22px] font-semibold text-white">
            ${call.symbol}
          </span>
          <span
            className="border px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{ borderColor: dirColor, color: dirColor }}
          >
            {call.direction}
          </span>
        </div>
        <div className="mt-5 flex items-baseline gap-3">
          <span
            className="font-sans text-[32px] font-semibold tabular-nums"
            style={{ color: positive ? "var(--up)" : "var(--down)" }}
          >
            {positive ? "+" : ""}
            {call.pnl.toFixed(2)}%
          </span>
          <span className="font-mono text-[10.5px] text-white/50">
            conv {call.conviction}
          </span>
        </div>
        {call.disagreed && (
          <span className="mt-4 w-fit border border-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
            split · replay →
          </span>
        )}
      </Link>
    </motion.div>
  );
}
