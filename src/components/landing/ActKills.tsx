"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TOMBSTONES = [
  { sym: "$BOBO", pnl: -68.4, reason: "rug · liq pulled 11m after call" },
  { sym: "$MFER", pnl: -41.2, reason: "dev wallet dumped 38%" },
  { sym: "$GIGA", pnl: -27.8, reason: "momentum faded, no follow-through" },
  { sym: "$COQ", pnl: -55.1, reason: "top10 concentration warning ignored" },
];

export function ActKills() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.4], [80, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const bgShift = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section
      ref={ref}
      className="relative border-t border-[var(--border)] bg-[#0a0a0a] px-5 py-32 sm:px-8 sm:py-40 lg:px-12"
    >
      <motion.div
        style={{ y: bgShift }}
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 40px)",
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div style={{ y: titleY, opacity: titleOpacity }} className="max-w-2xl">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[var(--down)]">
            act iv · the kill list
          </p>
          <h2 className="mt-4 font-sans text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            The losers stay
            <br />
            <span className="italic text-[var(--down)]">pinned.</span>
          </h2>
          <p className="mt-6 max-w-xl font-sans text-[14.5px] leading-[1.6] text-white/70">
            Most alpha accounts delete their misses. recon does the opposite. The worst calls get a dedicated page with the full prompt, the full reasoning, and what went wrong.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOMBSTONES.map((t, i) => (
            <Tombstone key={t.sym} tomb={t} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tombstone({
  tomb,
  index,
  progress,
}: {
  tomb: (typeof TOMBSTONES)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = 0.3 + index * 0.07;
  const end = start + 0.2;
  const x = useTransform(progress, [start, end], [index % 2 === 0 ? -40 : 40, 0]);
  const opacity = useTransform(progress, [start, end], [0, 1]);

  return (
    <motion.div
      style={{ x, opacity }}
      className="flex items-center justify-between border border-white/15 bg-black/60 px-5 py-4 font-mono backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <span className="text-[9px] uppercase tracking-[0.24em] text-white/30">
          rip
        </span>
        <span className="font-sans text-[17px] font-semibold text-white">
          {tomb.sym}
        </span>
        <span className="text-[11px] text-white/50">{tomb.reason}</span>
      </div>
      <span className="font-sans text-[18px] font-semibold tabular-nums text-[var(--down)]">
        {tomb.pnl.toFixed(1)}%
      </span>
    </motion.div>
  );
}
