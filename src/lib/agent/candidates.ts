import { getTrending, getNewListings, type TrendingToken, type NewListing } from "../birdeye";

export type Candidate = {
  address: string;
  symbol: string;
  source: "trending" | "new_listing";
  liquidity: number;
  v24hUSD: number | null;
  logoURI: string | null;
  ageMinutes: number | null;
};

function fromTrending(t: TrendingToken): Candidate {
  return {
    address: t.address,
    symbol: t.symbol,
    source: "trending",
    liquidity: t.liquidity ?? 0,
    v24hUSD: t.volume24hUSD ?? null,
    logoURI: t.logoURI ?? null,
    ageMinutes: null,
  };
}

function fromListing(l: NewListing): Candidate {
  const addedAt = l.liquidityAddedAt ? Date.parse(l.liquidityAddedAt) : NaN;
  const ageMinutes = Number.isFinite(addedAt)
    ? Math.floor((Date.now() - addedAt) / 60_000)
    : null;
  return {
    address: l.address,
    symbol: l.symbol ?? "?",
    source: "new_listing",
    liquidity: l.liquidity ?? 0,
    v24hUSD: null,
    logoURI: null,
    ageMinutes,
  };
}

// Pull trending + new_listings, dedupe by address, hard-filter trash.
// Returns at most `limit` candidates.
export async function getCandidates(limit = 12): Promise<Candidate[]> {
  const [trending, listings] = await Promise.all([
    getTrending({ limit: 20 }).catch(() => []),
    getNewListings({ limit: 20 }).catch(() => []),
  ]);

  const seen = new Set<string>();
  const pool: Candidate[] = [];
  for (const t of trending) {
    if (seen.has(t.address)) continue;
    seen.add(t.address);
    pool.push(fromTrending(t));
  }
  for (const l of listings) {
    if (seen.has(l.address)) continue;
    seen.add(l.address);
    pool.push(fromListing(l));
  }

  // Hard filters before LLM spend:
  //  - min $25k liquidity
  //  - skip anything older than 14 days from new_listing stream
  const kept = pool.filter((c) => {
    if (c.liquidity < 25_000) return false;
    if (c.ageMinutes !== null && c.ageMinutes > 14 * 24 * 60) return false;
    return true;
  });

  // Rank: liquidity * 1 + volume (if known). New listings get a small boost.
  kept.sort((a, b) => {
    const sa = a.liquidity + (a.v24hUSD ?? 0) + (a.source === "new_listing" ? 25_000 : 0);
    const sb = b.liquidity + (b.v24hUSD ?? 0) + (b.source === "new_listing" ? 25_000 : 0);
    return sb - sa;
  });

  return kept.slice(0, limit);
}
