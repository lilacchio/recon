"use client";

import { Radar } from "lucide-react";
import { motion } from "framer-motion";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-sm sm:px-6 lg:h-12">
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[15px] font-semibold tracking-tight text-[var(--text)] lg:text-[14px]">
            recon
          </span>
          <span className="hidden font-mono text-[10px] text-[var(--text-mute)] sm:inline">
            v0.1 · alpha
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <StatusPill label="agent" status="scanning" pulse />
        <div className="hidden items-center gap-4 lg:flex">
          <StatusPill label="birdeye" status="connected" />
          <StatusPill label="db" status="connected" />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <Radar
        className="h-[18px] w-[18px] text-[var(--accent)]"
        strokeWidth={2}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute top-1/2 left-1/2 h-[1px] w-3 origin-left"
          style={{
            background:
              "linear-gradient(to right, var(--accent), transparent)",
            transform: "translateY(-50%)",
          }}
        />
      </motion.div>
    </div>
  );
}

function StatusPill({
  label,
  status,
  pulse = false,
}: {
  label: string;
  status: string;
  pulse?: boolean;
}) {
  const color =
    status === "connected"
      ? "var(--up)"
      : status === "scanning"
        ? "var(--accent)"
        : status === "error"
          ? "var(--down)"
          : "var(--text-mute)";
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
      <span className="relative inline-flex h-1.5 w-1.5">
        {pulse && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.8, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
      </span>
      <span className="text-[var(--text-mute)]">{label}:</span>
      <span style={{ color }}>{status}</span>
    </div>
  );
}
