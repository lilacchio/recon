"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCw, Share2, Trophy } from "lucide-react";
import type { DuelCallRow, DuelAgentDecision } from "@/lib/duel-call";

const CHARS_PER_SECOND = 80;

export function DuelReplay({ call }: { call: DuelCallRow }) {
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0); // ms since start
  const [arbiterTick, setArbiterTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const hawkLen = call.hawk.reasoning.length;
  const owlLen = call.owl.reasoning.length;
  const agentDone = tick * (CHARS_PER_SECOND / 1000) >= Math.max(hawkLen, owlLen);
  const arbLen = call.arbiterReasoning?.length ?? 0;

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (!agentDone) setTick((t) => t + dt);
      else if (arbiterTick * (CHARS_PER_SECOND / 1000) < arbLen)
        setArbiterTick((t) => t + dt);
      else return; // finished
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, agentDone, arbLen, arbiterTick]);

  const charsShown = Math.floor(tick * (CHARS_PER_SECOND / 1000));
  const arbChars = Math.floor(arbiterTick * (CHARS_PER_SECOND / 1000));

  const restart = () => {
    setTick(0);
    setArbiterTick(0);
    lastTsRef.current = null;
    setPlaying(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 border border-[var(--border-strong)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text)] hover:bg-[var(--surface)]"
        >
          {playing ? (
            <Pause className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <Play className="h-3 w-3" strokeWidth={2.5} />
          )}
          {playing ? "pause" : "play"}
        </button>
        <button
          onClick={restart}
          className="flex items-center gap-2 border border-[var(--border-strong)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-dim)] hover:bg-[var(--surface)]"
        >
          <RotateCw className="h-3 w-3" strokeWidth={2.5} />
          restart
        </button>
        <div className="ml-auto">
          <ShareButton call={call} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <AgentPanel
          role="hawk"
          tag="fast · haiku"
          decision={call.hawk}
          shown={call.hawk.reasoning.slice(0, Math.min(charsShown, hawkLen))}
          finished={charsShown >= hawkLen}
          winner={call.chosenBy === "hawk"}
          highlight={!call.disagreed}
        />
        <AgentPanel
          role="owl"
          tag="deep · sonnet"
          decision={call.owl}
          shown={call.owl.reasoning.slice(0, Math.min(charsShown, owlLen))}
          finished={charsShown >= owlLen}
          winner={call.chosenBy === "owl"}
          highlight={!call.disagreed}
        />
      </div>

      <AnimatePresence>
        {call.disagreed && call.arbiterReasoning && agentDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="border border-[var(--accent)] bg-[var(--accent)]/5 p-5 sm:p-7"
          >
            <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--accent)]">
              <Trophy className="h-3 w-3" strokeWidth={2.5} />
              arbiter verdict · picked {call.chosenBy}
            </div>
            <p className="font-sans text-[14px] leading-[1.65] text-[var(--text)] sm:text-[15px]">
              {call.arbiterReasoning.slice(0, arbChars)}
              {arbChars < arbLen && (
                <span className="animate-pulse text-[var(--accent)]">▊</span>
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10.5px] text-[var(--text-mute)]">
              <span>
                final{" "}
                <span className="text-[var(--text)]">
                  {call.direction} · conv {call.conviction}
                </span>
              </span>
              <span>
                horizon <span className="text-[var(--text-dim)]">{call.horizon}</span>
              </span>
              <span>
                risk <span className="text-[var(--text-dim)]">{call.risk}/10</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentPanel({
  role,
  tag,
  decision,
  shown,
  finished,
  winner,
  highlight,
}: {
  role: "hawk" | "owl";
  tag: string;
  decision: DuelAgentDecision;
  shown: string;
  finished: boolean;
  winner: boolean;
  highlight: boolean;
}) {
  const dirColor =
    decision.direction === "long"
      ? "var(--up)"
      : decision.direction === "short"
      ? "var(--down)"
      : "var(--watch)";
  return (
    <div
      className={`relative border p-5 sm:p-6 ${
        winner || highlight
          ? "border-[var(--accent)]"
          : "border-[var(--border-strong)]"
      }`}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
            {tag}
          </p>
          <h3 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-[var(--text)]">
            {role}
          </h3>
        </div>
        <AnimatePresence>
          {finished && winner && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-1 border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--accent)]"
            >
              <Trophy className="h-2.5 w-2.5" strokeWidth={2.5} />
              chosen
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className="border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
          style={{ borderColor: dirColor, color: dirColor }}
        >
          {decision.direction}
        </span>
        <span className="font-mono text-[10.5px] text-[var(--text-dim)]">
          conv{" "}
          <span className="font-sans text-[15px] font-semibold tabular-nums text-[var(--text)]">
            {decision.conviction}
          </span>
        </span>
        <span className="font-mono text-[10.5px] text-[var(--text-mute)]">
          · {decision.horizon} · risk {decision.risk}/10
        </span>
      </div>

      <p className="min-h-[180px] font-sans text-[13.5px] leading-[1.65] text-[var(--text-dim)]">
        {shown}
        {!finished && (
          <span className="animate-pulse text-[var(--accent)]">▊</span>
        )}
      </p>

      <div className="mt-5 flex items-center gap-4 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--text-mute)]">
        <span>{decision.model}</span>
        <span>
          {decision.tokensIn}→{decision.tokensOut} tok
        </span>
        <span>{(decision.ms / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

function ShareButton({ call }: { call: DuelCallRow }) {
  const [open, setOpen] = useState(false);
  const text = call.disagreed
    ? `hawk said ${call.hawk.direction} (${call.hawk.conviction}), owl said ${call.owl.direction} (${call.owl.conviction}). arbiter picked ${call.chosenBy}. token: $${call.symbol}. watch the duel:`
    : `both AIs agreed on ${call.direction} for $${call.symbol} at conv ${call.conviction}. the duel:`;

  const copy = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    await navigator.clipboard.writeText(`${text} ${url}`);
  };

  const tweet = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(
      `${text} ${url}`,
    )}`;
    window.open(intent, "_blank");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-[var(--border-strong)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text)] hover:bg-[var(--surface)]"
      >
        <Share2 className="h-3 w-3" strokeWidth={2.5} />
        share
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 flex w-56 flex-col border border-[var(--border-strong)] bg-[var(--bg)] p-1 shadow-xl">
          <button
            onClick={() => {
              tweet();
              setOpen(false);
            }}
            className="px-3 py-2 text-left font-mono text-[11px] text-[var(--text)] hover:bg-[var(--surface)]"
          >
            post to X
          </button>
          <button
            onClick={() => {
              copy();
              setOpen(false);
            }}
            className="px-3 py-2 text-left font-mono text-[11px] text-[var(--text)] hover:bg-[var(--surface)]"
          >
            copy link + text
          </button>
        </div>
      )}
    </div>
  );
}
