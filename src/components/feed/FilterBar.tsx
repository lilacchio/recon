"use client";

export type FilterState = {
  minConviction: number;
  direction: "all" | "long" | "short" | "watch";
  splitOnly: boolean;
  chosenBy: "all" | "hawk" | "owl" | "arbiter" | "consensus";
};

export function FilterBar({
  filters,
  onChange,
  total,
  shown,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  total: number;
  shown: number;
}) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const reset = () =>
    onChange({
      minConviction: 0,
      direction: "all",
      splitOnly: false,
      chosenBy: "all",
    });

  const hasAny =
    filters.minConviction > 0 ||
    filters.direction !== "all" ||
    filters.splitOnly ||
    filters.chosenBy !== "all";

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-5 sm:px-8 sm:pt-14 sm:pb-6 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
            the record
          </p>
          <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-[var(--text)] sm:text-[26px]">
            Every call the agents have filed.
          </h2>
        </div>
        <p className="font-mono text-[10.5px] text-[var(--text-mute)]">
          showing <span className="text-[var(--text)]">{shown}</span>
          <span className="text-[var(--text-dim)]"> / {total}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--border)] py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-mute)]">
        <label className="flex items-center gap-3">
          <span>min conv</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minConviction}
            onChange={(e) => update({ minConviction: Number(e.target.value) })}
            className="w-24 accent-[var(--accent)]"
          />
          <span className="w-6 text-right text-[var(--text)] tabular-nums">
            {filters.minConviction}
          </span>
        </label>

        <div className="flex items-center gap-1">
          <span>dir</span>
          {(["all", "long", "short", "watch"] as const).map((d) => (
            <button
              key={d}
              onClick={() => update({ direction: d })}
              className={`border px-1.5 py-0.5 ${
                filters.direction === d
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border-strong)] text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span>via</span>
          {(["all", "hawk", "owl", "arbiter", "consensus"] as const).map((c) => (
            <button
              key={c}
              onClick={() => update({ chosenBy: c })}
              className={`border px-1.5 py-0.5 ${
                filters.chosenBy === c
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border-strong)] text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              {c === "consensus" ? "agreed" : c}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.splitOnly}
            onChange={(e) => update({ splitOnly: e.target.checked })}
            className="h-3 w-3 accent-[var(--accent)]"
          />
          disagreed only
        </label>

        {hasAny && (
          <button
            onClick={reset}
            className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            reset
          </button>
        )}
      </div>
    </div>
  );
}
