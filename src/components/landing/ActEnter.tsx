"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export function ActEnter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center border-t border-[var(--border)] bg-[#0a0a0a] px-5 py-32 sm:px-8 lg:px-12"
    >
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(252,211,77,0.18) 0%, transparent 55%)",
          }}
        />
      </motion.div>

      <motion.div
        style={{ scale, y }}
        className="relative mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[var(--accent)]">
          act v · enter
        </p>
        <h2 className="mt-5 max-w-3xl font-sans text-[36px] font-semibold leading-[1.03] tracking-tight text-white sm:text-[64px]">
          Most of the calls will lose.
          <br />
          <span className="italic text-[var(--accent)]">The ones that don&apos;t are worth reading.</span>
        </h2>
        <p className="mt-6 max-w-lg font-sans text-[14.5px] leading-[1.65] text-white/70 sm:text-[15.5px]">
          Memecoins lose value faster than any model can model them. recon is research, not financial advice. The track page holds the record. The kill list holds the misses. Everything else is on the feed.
        </p>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/feed"
            className="group flex items-center justify-center gap-3 border border-[var(--accent)] bg-[var(--accent)] px-8 py-4 font-mono text-[12px] uppercase tracking-[0.24em] text-black transition-colors hover:bg-white"
          >
            enter terminal
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/track"
            className="flex items-center justify-center gap-2 border border-white/30 px-8 py-4 font-mono text-[12px] uppercase tracking-[0.24em] text-white/90 hover:border-white hover:text-white"
          >
            calibration chart
          </Link>
          <Link
            href="/kills"
            className="flex items-center justify-center gap-2 border border-white/20 px-8 py-4 font-mono text-[12px] uppercase tracking-[0.24em] text-white/60 hover:border-[var(--down)] hover:text-[var(--down)]"
          >
            kill list
          </Link>
        </div>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">
          powered by birdeye
        </p>
      </motion.div>
    </section>
  );
}
