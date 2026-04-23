"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CallRow } from "./CallRow";
import { FilterBar, type FilterState } from "./FilterBar";
import { sbBrowser } from "@/lib/supabase";
import type { FeedCall } from "@/lib/feed";

function parseFilters(sp: URLSearchParams): FilterState {
  const conv = Number(sp.get("conv") ?? 0);
  const dir = (sp.get("dir") as FilterState["direction"]) || "all";
  const split = sp.get("split") === "1";
  const by = (sp.get("by") as FilterState["chosenBy"]) || "all";
  return {
    minConviction: Number.isFinite(conv) ? Math.max(0, Math.min(100, conv)) : 0,
    direction: ["all", "long", "short", "watch"].includes(dir) ? dir : "all",
    splitOnly: split,
    chosenBy: ["all", "hawk", "owl", "arbiter", "consensus"].includes(by) ? by : "all",
  };
}

export function FeedList({ initial }: { initial: FeedCall[] }) {
  const [calls, setCalls] = useState<FeedCall[]>(initial);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(sp.toString())), [sp]);

  const setFilters = useCallback(
    (next: FilterState) => {
      const u = new URLSearchParams();
      if (next.minConviction > 0) u.set("conv", String(next.minConviction));
      if (next.direction !== "all") u.set("dir", next.direction);
      if (next.splitOnly) u.set("split", "1");
      if (next.chosenBy !== "all") u.set("by", next.chosenBy);
      const qs = u.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router],
  );

  // Realtime new-call subscription.
  useEffect(() => {
    const sb = sbBrowser();
    const channel = sb
      .channel("public:calls:feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls" },
        async (payload) => {
          const row = payload.new as { id: string };
          // Re-fetch via the RSC data route so we get joined token + snaps.
          try {
            const res = await fetch(`/api/feed/item?id=${row.id}`, { cache: "no-store" });
            if (!res.ok) return;
            const call = (await res.json()) as FeedCall;
            setCalls((prev) => (prev.some((c) => c.id === call.id) ? prev : [call, ...prev]));
            setFlashIds((prev) => new Set(prev).add(call.id));
            setTimeout(() => {
              setFlashIds((prev) => {
                const next = new Set(prev);
                next.delete(call.id);
                return next;
              });
            }, 700);
          } catch {
            /* ignore */
          }
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      if (c.conviction < filters.minConviction) return false;
      if (filters.direction !== "all" && c.direction !== filters.direction) return false;
      if (filters.splitOnly && !c.disagreed) return false;
      if (filters.chosenBy !== "all" && c.chosenBy !== filters.chosenBy) return false;
      return true;
    });
  }, [calls, filters]);

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} total={calls.length} shown={filtered.length} />
      <div className="mx-auto w-full max-w-7xl border-t border-[var(--border)]">
        {filtered.length === 0 ? (
          <EmptyState hasAnyCalls={calls.length > 0} />
        ) : (
          filtered.map((call, i) => (
            <div key={call.id} className={flashIds.has(call.id) ? "animate-[flash_700ms_ease-out]" : undefined}>
              <CallRow call={call} index={i} />
            </div>
          ))
        )}
      </div>
    </>
  );
}

function EmptyState({ hasAnyCalls }: { hasAnyCalls: boolean }) {
  return (
    <div className="px-5 py-20 text-center sm:px-8 sm:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
        {hasAnyCalls ? "no calls match your filter" : "no calls yet"}
      </p>
      <p className="mx-auto mt-4 max-w-md font-sans text-[14px] leading-relaxed text-[var(--text-dim)]">
        {hasAnyCalls
          ? "Loosen the filters above and something will show up."
          : "The agents haven't filed anything yet. The scan cron runs every fifteen minutes and posts whatever survives the safety filter."}
      </p>
    </div>
  );
}
