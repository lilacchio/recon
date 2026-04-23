"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ActArbiter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const ringScale = useTransform(scrollYProgress, [0, 0.6], [0.4, 1.1]);
  const ringOpacity = useTransform(scrollYProgress, [0, 0.3, 0.85, 1], [0, 1, 1, 0]);
  const ringRot = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  const textY = useTransform(scrollYProgress, [0.1, 0.5], [40, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.35, 0.9, 1], [0, 1, 1, 0]);

  const verdictOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const verdictY = useTransform(scrollYProgress, [0.55, 0.7], [20, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[200vh] border-t border-[var(--border)] bg-[#0a0a0a] px-5 sm:px-8 lg:px-12"
    >
      <div className="sticky top-0 flex min-h-screen items-center justify-center overflow-hidden">
        <motion.div
          style={{ scale: ringScale, opacity: ringOpacity, rotate: ringRot }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div className="relative h-[min(80vh,80vw)] w-[min(80vh,80vw)]">
            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/30" />
            <div className="absolute inset-[8%] rounded-full border border-[var(--accent)]/20" />
            <div className="absolute inset-[16%] rounded-full border border-[var(--accent)]/15" />
            <div className="absolute inset-[24%] rounded-full border border-[var(--accent)]/10" />
            <div
              className="absolute inset-[30%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(252,211,77,0.18) 0%, transparent 70%)",
              }}
            />
          </div>
        </motion.div>

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[var(--accent)]">
            act ii · the arbiter
          </p>
          <h2 className="mt-4 font-sans text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[56px]">
            When they split,
            <br />
            a third model must
            <br />
            <span className="italic text-[var(--accent)]">pick a side.</span>
          </h2>
          <p className="mt-6 font-sans text-[14.5px] leading-[1.65] text-white/70 sm:text-[15px]">
            No abstaining. No &quot;both are valid.&quot; The arbiter reads both arguments cold and commits to long, short, or watch. Both losing arguments stay on file. That&apos;s the point.
          </p>

          <motion.div
            style={{ y: verdictY, opacity: verdictOpacity }}
            className="mt-10 inline-flex flex-col items-center gap-2 border border-[var(--accent)] bg-black/50 px-8 py-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] backdrop-blur-sm"
          >
            <span className="text-white/50">arbiter verdict</span>
            <span className="text-[18px] tracking-[0.3em]">long · conviction 66</span>
            <span className="text-white/50">siding with haiku · sonnet archived</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
