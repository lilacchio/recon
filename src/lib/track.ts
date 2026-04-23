import { sbAdmin } from "./supabase";

export type ClosedCall = {
  id: string;
  symbol: string;
  name: string;
  direction: "long" | "short" | "watch";
  conviction: number;
  chosenBy: "hawk" | "owl" | "arbiter" | "consensus";
  hawkConviction: number;
  owlConviction: number;
  hawkDirection: "long" | "short" | "watch";
  owlDirection: "long" | "short" | "watch";
  pnlPct: number;
  createdAt: string;
};

export type CalibrationPoint = {
  bucket: string; // e.g. "0-10"
  hawk: number | null; // green %
  owl: number | null;
  resolved: number | null;
  n: number; // number of resolved samples in bucket
};

type Row = {
  id: string;
  direction: ClosedCall["direction"];
  conviction: number;
  chosen_by: ClosedCall["chosenBy"];
  hawk_decision: { direction: ClosedCall["direction"]; conviction: number };
  owl_decision: { direction: ClosedCall["direction"]; conviction: number };
  created_at: string;
  tokens: { symbol: string | null; name: string | null } | { symbol: string | null; name: string | null }[] | null;
  price_snaps: { pnl_pct: string | number | null; taken_at: string }[];
};

function latestPnl(snaps: Row["price_snaps"]): number {
  if (!snaps?.length) return 0;
  const latest = [...snaps].sort(
    (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
  )[0];
  const v = latest.pnl_pct;
  return typeof v === "string" ? parseFloat(v) : (v ?? 0);
}

function tok(r: Row["tokens"]) {
  return Array.isArray(r) ? r[0] : r;
}

export async function getClosedCalls(): Promise<ClosedCall[]> {
  const sb = sbAdmin();
  const { data } = await sb
    .from("calls")
    .select(
      `id, direction, conviction, chosen_by, hawk_decision, owl_decision, created_at,
       tokens:tokens!inner(symbol, name),
       price_snaps(pnl_pct, taken_at)`,
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (!data) return [];
  return (data as unknown as Row[]).map((r) => {
    const t = tok(r.tokens);
    return {
      id: r.id,
      symbol: t?.symbol ?? "—",
      name: t?.name ?? "",
      direction: r.direction,
      conviction: r.conviction,
      chosenBy: r.chosen_by,
      hawkConviction: r.hawk_decision?.conviction ?? 0,
      owlConviction: r.owl_decision?.conviction ?? 0,
      hawkDirection: r.hawk_decision?.direction ?? "watch",
      owlDirection: r.owl_decision?.direction ?? "watch",
      pnlPct: latestPnl(r.price_snaps),
      createdAt: r.created_at,
    };
  });
}

const BUCKETS = [
  [0, 10],
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50],
  [50, 60],
  [60, 70],
  [70, 80],
  [80, 90],
  [90, 101],
] as const;

function isGreen(direction: ClosedCall["direction"], pnl: number): boolean | null {
  // "watch" calls don't have a side, so we don't score them.
  if (direction === "watch") return null;
  if (direction === "long") return pnl > 0;
  return pnl < 0; // short: green if price dropped
}

export function calibrationFromCalls(calls: ClosedCall[]): CalibrationPoint[] {
  return BUCKETS.map(([lo, hi]) => {
    const label = `${lo}-${hi === 101 ? 100 : hi}`;

    const inBucket = (c: number) => c >= lo && c < hi;
    const hawkRows = calls.filter(
      (c) => inBucket(c.hawkConviction) && c.hawkDirection !== "watch",
    );
    const owlRows = calls.filter(
      (c) => inBucket(c.owlConviction) && c.owlDirection !== "watch",
    );
    const resolvedRows = calls.filter(
      (c) => inBucket(c.conviction) && c.direction !== "watch",
    );

    const pct = (rows: ClosedCall[], sideKey: "hawk" | "owl" | "resolved") => {
      if (!rows.length) return null;
      const hits = rows.filter((c) => {
        const dir =
          sideKey === "hawk"
            ? c.hawkDirection
            : sideKey === "owl"
            ? c.owlDirection
            : c.direction;
        const green = isGreen(dir, c.pnlPct);
        return green === true;
      }).length;
      return (hits / rows.length) * 100;
    };

    return {
      bucket: label,
      hawk: pct(hawkRows, "hawk"),
      owl: pct(owlRows, "owl"),
      resolved: pct(resolvedRows, "resolved"),
      n: resolvedRows.length,
    };
  });
}
