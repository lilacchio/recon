"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HAIKU_LINES = [
  "> haiku-4.5 reading $PEPE",
  "momentum_5m = +42%",
  "big_buys_1h = 7",
  "holders_delta = +312",
  "verdict: long · conviction 74",
  "reason: fresh breakout, wallets stacking, no rug markers",
];

const SONNET_LINES = [
  "> sonnet-4.6 reading $PEPE",
  "liq_usd = 18,400",
  "top10_concentration = 61%",
  "age_minutes = unknown",
  "verdict: short · conviction 58",
  "reason: liquidity thin, holders concentrated, pump smells pre-dumped",
];

function Column({
  lines,
  label,
  color,
  progress,
  align,
}: {
  lines: string[];
  label: string;
  color: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  align: "left" | "right";
}) {
  const x = useTransform(progress, [0, 0.4], align === "left" ? ["-20%", "0%"] : ["20%", "0%"]);
  const opacity = useTransform(progress, [0, 0.25], [0, 1]);
  return (
    <motion.div
      style={{ x, opacity }}
      className="flex flex-col gap-3 border border-[var(--border-strong)] bg-black/40 p-6 font-mono text-[12.5px] leading-[1.7] backdrop-blur-sm sm:p-8"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <span className="text-[10.5px] uppercase tracking-[0.24em]" style={{ color }}>
          {label}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-mute)]">
          live
        </span>
      </div>
      {lines.map((line, i) => {
        const start = 0.1 + i * 0.08;
        const end = start + 0.12;
        return <Line key={i} text={line} progress={progress} start={start} end={end} last={i === lines.length - 1} color={color} />;
      })}
    </motion.div>
  );
}

function Line({
  text,
  progress,
  start,
  end,
  last,
  color,
}: {
  text: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
  last: boolean;
  color: string;
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [8, 0]);
  return (
    <motion.span
      style={{ opacity, y, color: last ? color : undefined }}
      className={last ? "font-semibold" : "text-[var(--text-dim)]"}
    >
      {text}
    </motion.span>
  );
}

export function ActDuel() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const headingY = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.6]);
  const sparkScale = useTransform(scrollYProgress, [0.35, 0.55], [0.6, 1]);
  const sparkOpacity = useTransform(scrollYProgress, [0.35, 0.5, 0.75], [0, 1, 0]);

  return (
    <section
      id="how"
      ref={ref}
      className="relative min-h-[200vh] border-t border-[var(--border)] bg-[#0a0a0a] px-5 py-32 sm:px-8 lg:px-12"
    >
      <div className="sticky top-0 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 py-20">
        <motion.div style={{ y: headingY, opacity: headingOpacity }} className="max-w-2xl">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[var(--accent)]">
            act i · the duel
          </p>
          <h2 className="mt-4 font-sans text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            Same token.
            <br />
            Two readers.
            <br />
            <span className="italic text-[var(--accent)]">One disagreement.</span>
          </h2>
          <p className="mt-6 max-w-lg font-sans text-[14.5px] leading-[1.6] text-white/70">
            Haiku and Sonnet read the same Birdeye snapshot at the same second. No tool use, no chain-of-thought tricks. Whatever each model sees, it has to commit to in writing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <Column lines={HAIKU_LINES} label="haiku · bull" color="var(--up)" progress={scrollYProgress} align="left" />

          <motion.div
            style={{ scale: sparkScale, opacity: sparkOpacity }}
            className="flex items-center justify-center py-4"
          >
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full border border-[var(--accent)]/40" />
              <span className="relative font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]">
                split
              </span>
            </div>
          </motion.div>

          <Column lines={SONNET_LINES} label="sonnet · bear" color="var(--down)" progress={scrollYProgress} align="right" />
        </div>
      </div>
    </section>
  );
}
