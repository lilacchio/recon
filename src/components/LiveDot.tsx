"use client";

import { motion } from "framer-motion";

export function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-label="live">
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--accent)]"
        animate={{ opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
    </span>
  );
}
