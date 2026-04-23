import { z } from "zod";

const BASE = "https://public-api.birdeye.so";
const CHAIN = "solana";

const API_KEY = process.env.BIRDEYE_API_KEY;
if (!API_KEY && typeof window === "undefined") {
  // only enforce on the server; browser bundle shouldn't need it
  // soft-warn so the dev server can still boot
  console.warn("[birdeye] BIRDEYE_API_KEY is not set");
}

// Token-bucket rate limiter: capacity 1, refill 1 token / 1000ms, no burst.
// Birdeye free tier is 1 req/s strict — any burst pattern returns 429.
class TokenBucket {
  private next = 0;
  constructor(private readonly intervalMs: number) {}
  async take(): Promise<void> {
    const now = Date.now();
    const fireAt = Math.max(now, this.next);
    const waitMs = fireAt - now;
    this.next = fireAt + this.intervalMs;
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  }
}
const bucket = new TokenBucket(1050); // 50ms headroom over 1 req/s

export type BirdeyeError = {
  status: number;
  url: string;
  body: string;
};

async function call<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  schema: z.ZodType<T>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ""}`;

  // Up to 3 attempts with exponential backoff on 429/5xx.
  let res!: Response;
  let text = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    await bucket.take();
    res = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-chain": CHAIN,
        "X-API-KEY": API_KEY ?? "",
      },
      cache: "no-store",
    });
    text = await res.text();
    if (res.ok) break;
    if (res.status !== 429 && res.status < 500) break;
    const backoff = 1500 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, backoff));
  }

  if (!res.ok) {
    const err: BirdeyeError = { status: res.status, url, body: text.slice(0, 400) };
    throw Object.assign(new Error(`birdeye ${res.status} ${path}`), err);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`birdeye ${path}: non-json response`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `birdeye ${path}: schema mismatch — ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

// Envelope: Birdeye wraps most responses in { success, data }.
const envelope = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({ success: z.boolean(), data: inner });

// ---------- schemas ----------

const TrendingTokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  decimals: z.number(),
  liquidity: z.number().nullable().optional(),
  volume24hUSD: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  rank: z.number().optional(),
  logoURI: z.string().nullable().optional(),
});
export type TrendingToken = z.infer<typeof TrendingTokenSchema>;

const TrendingSchema = envelope(
  z.object({
    updateUnixTime: z.number().optional(),
    tokens: z.array(TrendingTokenSchema),
  }),
);

const NewListingSchema = z.object({
  address: z.string(),
  symbol: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  decimals: z.number().optional(),
  liquidity: z.number().nullable().optional(),
  liquidityAddedAt: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});
export type NewListing = z.infer<typeof NewListingSchema>;

const NewListingsSchema = envelope(
  z.object({ items: z.array(NewListingSchema) }),
);

const TokenOverviewSchema = envelope(
  z
    .object({
      address: z.string(),
      symbol: z.string(),
      name: z.string().optional(),
      decimals: z.number(),
      liquidity: z.number().nullable().optional(),
      price: z.number().nullable().optional(),
      priceChange1h: z.number().nullable().optional().catch(null),
      priceChange24hPercent: z.number().nullable().optional().catch(null),
      v24hUSD: z.number().nullable().optional().catch(null),
      v1hUSD: z.number().nullable().optional().catch(null),
      holder: z.number().nullable().optional().catch(null),
      marketCap: z.number().nullable().optional().catch(null),
      numberMarkets: z.number().nullable().optional().catch(null),
      lastTradeUnixTime: z.number().nullable().optional().catch(null),
    })
    .passthrough(),
);
export type TokenOverview = z.infer<typeof TokenOverviewSchema>["data"];

const HolderRowSchema = z.object({
  owner: z.string(),
  amount: z.string().or(z.number()),
  ui_amount: z.number().nullable().optional(),
  percentage: z.number().nullable().optional(),
});
const HolderDistSchema = envelope(
  z.object({ items: z.array(HolderRowSchema) }),
);
export type HolderRow = z.infer<typeof HolderRowSchema>;

const TxnSchema = z
  .object({
    txHash: z.string(),
    blockUnixTime: z.number(),
    side: z.enum(["buy", "sell"]).optional(),
    owner: z.string().optional(),
    from: z
      .object({
        amount: z.union([z.number(), z.string()]).optional(),
        uiAmount: z.number().optional(),
        symbol: z.string().optional(),
        address: z.string().optional(),
      })
      .partial()
      .passthrough()
      .optional(),
    to: z
      .object({
        amount: z.union([z.number(), z.string()]).optional(),
        uiAmount: z.number().optional(),
        symbol: z.string().optional(),
        address: z.string().optional(),
      })
      .partial()
      .passthrough()
      .optional(),
    volumeUSD: z.number().nullable().optional(),
  })
  .passthrough();
const TxnsSchema = envelope(z.object({ items: z.array(TxnSchema) }));
export type Txn = z.infer<typeof TxnSchema>;

const PriceSchema = envelope(
  z
    .object({
      value: z.number(),
      updateUnixTime: z.number().optional(),
      priceChange24h: z.number().nullable().optional(),
      liquidity: z.number().nullable().optional(),
    })
    .passthrough(),
);
export type Price = z.infer<typeof PriceSchema>["data"];

const OhlcvRowSchema = z
  .object({
    unixTime: z.number(),
    o: z.number(),
    h: z.number(),
    l: z.number(),
    c: z.number(),
    v: z.number().optional(),
  })
  .passthrough();
const OhlcvSchema = envelope(z.object({ items: z.array(OhlcvRowSchema) }));
export type OhlcvRow = z.infer<typeof OhlcvRowSchema>;

// ---------- endpoints ----------

export function getTrending(opts: { offset?: number; limit?: number; sortBy?: string; sortType?: "desc" | "asc" } = {}) {
  return call(
    "/defi/token_trending",
    {
      sort_by: opts.sortBy ?? "rank",
      sort_type: opts.sortType ?? "asc",
      offset: opts.offset ?? 0,
      limit: opts.limit ?? 20,
    },
    TrendingSchema,
  ).then((r) => r.data.tokens);
}

export function getNewListings(opts: { limit?: number; meme_platform_enabled?: boolean } = {}) {
  return call(
    "/defi/v2/tokens/new_listing",
    {
      limit: opts.limit ?? 20,
      meme_platform_enabled: opts.meme_platform_enabled ? "true" : undefined,
    },
    NewListingsSchema,
  ).then((r) => r.data.items);
}

export function getTokenOverview(address: string) {
  return call("/defi/token_overview", { address }, TokenOverviewSchema).then(
    (r) => r.data,
  );
}

export function getHolderDistribution(address: string, limit = 10, offset = 0) {
  return call(
    "/defi/v3/token/holder",
    { address, limit, offset },
    HolderDistSchema,
  ).then((r) => r.data.items);
}

export function getRecentTxns(address: string, limit = 20, offset = 0) {
  return call(
    "/defi/txs/token",
    { address, limit, offset, tx_type: "swap" },
    TxnsSchema,
  ).then((r) => r.data.items);
}

export function getPrice(address: string) {
  return call("/defi/price", { address }, PriceSchema).then((r) => r.data);
}

export function getOhlcv(
  address: string,
  opts: { type?: "1m" | "5m" | "15m" | "1H" | "4H" | "1D"; time_from?: number; time_to?: number } = {},
) {
  return call(
    "/defi/ohlcv",
    {
      address,
      type: opts.type ?? "15m",
      time_from: opts.time_from,
      time_to: opts.time_to,
    },
    OhlcvSchema,
  ).then((r) => r.data.items);
}

// ---------- heuristics ----------

// Replaces /defi/token_security which is blocked on free tier.
// Returns a 0..10 score (higher = safer) + reasons array.
export function heuristicSafety(input: {
  holders: HolderRow[];
  overview: TokenOverview;
  ageMinutes: number | null;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 10;

  const top10Pct = input.holders
    .slice(0, 10)
    .reduce((s, h) => s + (h.percentage ?? 0), 0);
  if (top10Pct > 60) {
    score -= 4;
    reasons.push(`top10 holders own ${top10Pct.toFixed(1)}% (high concentration)`);
  } else if (top10Pct > 40) {
    score -= 2;
    reasons.push(`top10 holders own ${top10Pct.toFixed(1)}%`);
  }

  const liq = input.overview.liquidity ?? 0;
  if (liq < 25_000) {
    score -= 3;
    reasons.push(`thin liquidity $${liq.toFixed(0)}`);
  } else if (liq < 100_000) {
    score -= 1;
    reasons.push(`moderate liquidity $${(liq / 1000).toFixed(1)}k`);
  }

  const holders = input.overview.holder ?? 0;
  if (holders < 200) {
    score -= 2;
    reasons.push(`only ${holders} holders`);
  }

  if (input.ageMinutes !== null && input.ageMinutes < 60) {
    score -= 2;
    reasons.push(`very new (${input.ageMinutes.toFixed(0)}m old)`);
  }

  const v24 = input.overview.v24hUSD ?? 0;
  if (liq > 0 && v24 / liq > 20) {
    score -= 2;
    reasons.push(`vol/liq ratio ${(v24 / liq).toFixed(1)}× (wash-trade smell)`);
  }

  return { score: Math.max(0, Math.min(10, score)), reasons };
}
