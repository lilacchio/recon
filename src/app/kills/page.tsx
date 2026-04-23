import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownRight, Split } from "lucide-react";
import { getClosedCalls } from "@/lib/track";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "the kill list",
  description:
    "Every call the agents got wrong, sorted by how wrong. Side-adjusted — shorts that fell don't count as losses.",
};

export default async function KillsPage() {
  const all = await getClosedCalls();
  // Score losses by side-adjusted PnL: for shorts, a falling price is NOT a kill.
  const withLoss = all
    .map((c) => {
      const sideAdjusted =
        c.direction === "short" ? -c.pnlPct : c.pnlPct;
      return { ...c, loss: sideAdjusted };
    })
    .filter((c) => c.direction !== "watch" && c.loss < 0)
    .sort((a, b) => a.loss - b.loss)
    .slice(0, 20);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          the kill list
        </p>
        <h1 className="mt-2 font-sans text-[28px] font-semibold tracking-tight text-[var(--text)] sm:text-[36px]">
          What went wrong, replayed.
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-[var(--text-dim)]">
          Losses shown on purpose. Click any card to replay the duel and see
          which model was wrong and how confidently.
        </p>
      </div>

      {withLoss.length === 0 ? (
        <p className="border border-[var(--border)] px-6 py-20 text-center font-mono text-[11px] text-[var(--text-mute)]">
          no losing calls yet. (or the agents are too careful — wait.)
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {withLoss.map((c) => (
            <Link
              key={c.id}
              href={c.chosenBy === "consensus" ? `/calls/${c.id}` : `/duel/${c.id}`}
              className="group flex flex-col border border-[var(--border-strong)] p-5 transition-colors hover:border-[var(--down)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
                    {c.direction} · conv {c.conviction} · via {c.chosenBy}
                  </p>
                  <h3 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-[var(--text)]">
                    {c.symbol}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1 font-sans text-[22px] font-semibold tabular-nums" style={{ color: "var(--down)" }}>
                  <ArrowDownRight className="h-4 w-4" strokeWidth={2.5} />
                  {c.loss.toFixed(1)}%
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between font-mono text-[10.5px] text-[var(--text-mute)]">
                <span>
                  hawk <span className="text-[var(--text-dim)]">{c.hawkDirection} · {c.hawkConviction}</span>
                </span>
                <span>
                  owl <span className="text-[var(--text-dim)]">{c.owlDirection} · {c.owlConviction}</span>
                </span>
                {c.hawkDirection !== c.owlDirection && (
                  <Split className="h-3 w-3 text-[var(--accent)]" strokeWidth={2.5} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
