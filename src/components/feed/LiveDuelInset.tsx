"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Split, Zap, X, Trophy } from "lucide-react";
import type { DuelCallRow } from "@/lib/duel-call";

type LiveState = {
  hawk: string;
  owl: string;
  arbiter: string;
  phase: "idle" | "streaming" | "done" | "error";
  error?: string;
  winner?: "hawk" | "owl" | "compromise" | null;
};

export function LiveDuelInset({ last }: { last: DuelCallRow | null }) {
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [live, setLive] = useState<LiveState>({
    hawk: "",
    owl: "",
    arbiter: "",
    phase: "idle",
  });
  const [address, setAddress] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(
    () => () => {
      esRef.current?.close();
    },
    [],
  );

  const startLive = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    esRef.current?.close();
    setLive({ hawk: "", owl: "", arbiter: "", phase: "streaming" });
    const es = new EventSource(
      `/api/duel/stream?tokenAddress=${encodeURIComponent(trimmed)}`,
    );
    esRef.current = es;
    es.addEventListener("hawk_delta", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLive((s) => ({ ...s, hawk: s.hawk + d.text }));
    });
    es.addEventListener("owl_delta", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLive((s) => ({ ...s, owl: s.owl + d.text }));
    });
    es.addEventListener("arbiter_delta", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLive((s) => ({ ...s, arbiter: s.arbiter + d.text }));
    });
    es.addEventListener("arbiter_done", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setLive((s) => ({ ...s, winner: d.arbiter?.winner ?? null }));
    });
    es.addEventListener("resolved", () => {
      setLive((s) => ({ ...s, phase: "done" }));
      es.close();
    });
    es.addEventListener("error", (e) => {
      const data = (e as MessageEvent).data;
      if (data) {
        try {
          const d = JSON.parse(data);
          setLive((s) => ({ ...s, phase: "error", error: d.error }));
        } catch {
          /* ignore */
        }
      } else {
        setLive((s) => ({ ...s, phase: "error", error: "stream closed" }));
      }
      es.close();
    });
  };

  const stopLive = () => {
    esRef.current?.close();
    setLive({ hawk: "", owl: "", arbiter: "", phase: "idle" });
    setMode("replay");
  };

  return (
    <div className="mx-auto w-full max-w-7xl border-b border-[var(--border)] bg-[var(--surface)]/30 px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--accent)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            {mode === "live"
              ? live.phase === "streaming"
                ? "live duel streaming"
                : live.phase === "done"
                ? "duel resolved"
                : "live duel"
              : "latest disagreement · replay"}
          </p>
          <p className="mt-1 font-sans text-[12.5px] text-[var(--text-dim)]">
            {mode === "replay"
              ? last
                ? last.hawk.direction === last.owl.direction
                  ? `${last.symbol} — both said ${last.hawk.direction}, but split on conviction (${last.hawk.conviction} vs ${last.owl.conviction}).`
                  : `${last.symbol} — hawk said ${last.hawk.direction} (conv ${last.hawk.conviction}), owl said ${last.owl.direction} (conv ${last.owl.conviction}).`
                : "waiting for the first split."
              : "paste any Solana mint and both models will score it live."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "replay" ? (
            <button
              onClick={() => setMode("live")}
              className="flex items-center gap-1.5 border border-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] hover:bg-[var(--accent)]/20"
            >
              <Zap className="h-3 w-3" strokeWidth={2.5} />
              run live
            </button>
          ) : (
            <button
              onClick={stopLive}
              className="flex items-center gap-1.5 border border-[var(--border-strong)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
              close
            </button>
          )}
        </div>
      </div>

      {mode === "live" && live.phase === "idle" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="paste Solana mint (e.g. So11111111111111111111111111111111111111112)"
            className="flex-1 border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 font-mono text-[12px] text-[var(--text)] placeholder:text-[var(--text-mute)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            onClick={startLive}
            className="border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--bg)]"
          >
            start duel
          </button>
        </div>
      )}

      {mode === "live" && live.phase === "error" && (
        <p className="border border-[var(--down)] bg-[var(--down)]/10 px-3 py-2 font-mono text-[11px] text-[var(--down)]">
          stream error: {live.error}
        </p>
      )}

      {mode === "replay" && last && <ReplayColumns call={last} />}
      {mode === "live" && live.phase !== "idle" && live.phase !== "error" && (
        <LiveColumns state={live} />
      )}

      {mode === "replay" && last && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10.5px] text-[var(--text-mute)]">
            arbiter picked <span className="text-[var(--text)]">{last.chosenBy}</span>
          </span>
          <Link
            href={`/duel/${last.id}`}
            className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--accent)] hover:underline"
          >
            <Split className="h-3 w-3" strokeWidth={2.5} />
            full replay →
          </Link>
        </div>
      )}
    </div>
  );
}

function ReplayColumns({ call }: { call: DuelCallRow }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 900), 50);
    return () => clearInterval(id);
  }, []);
  const charsH = Math.min(call.hawk.reasoning.length, tick * 2);
  const charsO = Math.min(call.owl.reasoning.length, tick * 2);
  return (
    <div className="grid grid-cols-2 gap-3">
      <ColumnCard
        label="hawk"
        sub="fast · haiku"
        direction={call.hawk.direction}
        conviction={call.hawk.conviction}
        text={call.hawk.reasoning.slice(0, charsH)}
        cursor={charsH < call.hawk.reasoning.length}
      />
      <ColumnCard
        label="owl"
        sub="deep · sonnet"
        direction={call.owl.direction}
        conviction={call.owl.conviction}
        text={call.owl.reasoning.slice(0, charsO)}
        cursor={charsO < call.owl.reasoning.length}
      />
    </div>
  );
}

function LiveColumns({ state }: { state: LiveState }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <ColumnCard
          label="hawk"
          sub="fast · haiku"
          text={state.hawk}
          cursor={state.phase === "streaming"}
          winner={state.winner === "hawk"}
        />
        <ColumnCard
          label="owl"
          sub="deep · sonnet"
          text={state.owl}
          cursor={state.phase === "streaming"}
          winner={state.winner === "owl"}
        />
      </div>
      <AnimatePresence>
        {state.arbiter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[var(--accent)] bg-[var(--accent)]/5 p-3"
          >
            <p className="mb-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--accent)]">
              <Trophy className="h-2.5 w-2.5" strokeWidth={2.5} />
              arbiter{state.winner ? ` · ${state.winner}` : ""}
            </p>
            <p className="font-sans text-[11.5px] leading-[1.55] text-[var(--text)]">
              {state.arbiter}
              {state.phase === "streaming" && (
                <span className="animate-pulse text-[var(--accent)]">▊</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColumnCard({
  label,
  sub,
  direction,
  conviction,
  text,
  cursor,
  winner,
}: {
  label: string;
  sub: string;
  direction?: "long" | "short" | "watch";
  conviction?: number;
  text: string;
  cursor: boolean;
  winner?: boolean;
}) {
  const color =
    direction === "long"
      ? "var(--up)"
      : direction === "short"
      ? "var(--down)"
      : direction === "watch"
      ? "var(--watch)"
      : undefined;
  return (
    <div
      className={`flex h-[170px] flex-col border p-3 ${
        winner ? "border-[var(--accent)]" : "border-[var(--border-strong)]"
      }`}
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-sans text-[13px] font-semibold text-[var(--text)]">{label}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-mute)]">{sub}</span>
      </div>
      {direction && (
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="border px-1 py-[1px] font-mono text-[8.5px] uppercase tracking-[0.14em]"
            style={{ borderColor: color, color }}
          >
            {direction}
          </span>
          <span className="font-mono text-[9.5px] text-[var(--text-mute)]">
            conv <span className="text-[var(--text)]">{conviction}</span>
          </span>
        </div>
      )}
      <p className="flex-1 overflow-hidden font-sans text-[11.5px] leading-[1.5] text-[var(--text-dim)]">
        {text}
        {cursor && <span className="animate-pulse text-[var(--accent)]">▊</span>}
      </p>
    </div>
  );
}
