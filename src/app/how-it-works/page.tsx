import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, GitBranch, Zap, Eye, Scale, Database, Share2 } from "lucide-react";

export const metadata: Metadata = {
  title: "how it works",
  description:
    "The architecture, the cost math, and why two models + an arbiter produces a sharper signal than one. Built for the Birdeye Data 4-Week BIP Competition.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16 lg:px-8">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
        how it works · sprint 01 · birdeye data
      </p>
      <h1 className="mt-2 font-sans text-[34px] font-semibold tracking-tight text-[var(--text)] sm:text-[46px]">
        Two models argue. A third picks a side.
      </h1>
      <p className="mt-5 max-w-2xl font-sans text-[15px] leading-[1.7] text-[var(--text-dim)]">
        Ask one LLM if a token is a buy and it will give you an answer. That answer tells you more about the model than the token. Recon runs Haiku and Sonnet on the same snapshot in parallel, catches them when they disagree, and makes a third call break the tie. The split, the reasoning, and the eventual PnL all show up on the feed. So do the misses.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="flex items-center gap-2 border border-[var(--border-strong)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)]">
          <GitBranch className="h-3 w-3" strokeWidth={2.5} />
          source on github · MIT license
        </span>
        <Link
          href="/"
          className="flex items-center gap-2 border border-[var(--border-strong)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text)] hover:border-[var(--accent)]"
        >
          see live feed
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
        <Link
          href="/track"
          className="flex items-center gap-2 border border-[var(--border-strong)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text)] hover:border-[var(--accent)]"
        >
          calibration chart
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>

      <Section title="Why two models beat one" icon={Eye}>
        <ul className="flex flex-col gap-4 font-sans text-[14px] leading-[1.7] text-[var(--text-dim)]">
          <li>
            <Emph>One model will always pick a side.</Emph> Even when the data is contradictory, an LLM asked for a direction will invent confidence. Two models scored independently actually disagree, and the disagreements are where the interesting trades live.
          </li>
          <li>
            <Emph>Arbitration costs less than ensembling.</Emph> When Haiku and Sonnet converge, the scan ends there. The third call only fires when they split. That is roughly 40% of scans, not 100%.
          </li>
          <li>
            <Emph>Losses go on the same page as wins.</Emph> The kill list is a real route. If a model claims 80 conviction and lands green 30% of the time, the calibration curve puts a red line through it. Nothing gets hidden because nothing needs to be.
          </li>
        </ul>
      </Section>

      {/* ARCHITECTURE */}
      <Section title="One scan, end-to-end" icon={GitBranch}>
        <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)] p-5 font-mono text-[11.5px] leading-[1.7] text-[var(--text-dim)]">{`┌─ every 15 minutes ──────────────────────────────────────────┐
│                                                             │
│   trending ∪ new_listing  →  dedupe  →  hard filter         │
│                              ($25k liq, <14d age, top N)    │
│                                    │                        │
│                                    ▼                        │
│                 per survivor: overview + top-10 holders     │
│                              + 1h txns + heuristic safety   │
│                                    │                        │
│                                    ▼                        │
│                       ┌────────────┴────────────┐           │
│                       ▼                         ▼           │
│           hawk (Haiku 4.5)           owl (Sonnet 4.6)       │
│           stream JSON decision       stream JSON decision   │
│                       └────────────┬────────────┘           │
│                                    ▼                        │
│                         directions match?                   │
│                         |conv_gap| < 20?                    │
│                              │    │                         │
│                          yes │    │ no                      │
│                              ▼    ▼                         │
│                      consensus   arbiter (Sonnet)           │
│                                    │                        │
│                                    ▼                        │
│               persist both decisions + flag + arbiter +     │
│               signals JSON (endpoints used, raw numbers)    │
│                                    │                        │
│                                    ▼                        │
│                 Supabase realtime broadcasts INSERT →       │
│                 feed flashes new row, OG card is ready      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

every 20 minutes: price_snaps updates every call's live PnL.
the calibration chart refetches and re-buckets on every page load.`}</pre>
      </Section>

      <Section title="The arbitration math" icon={Scale}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card label="baseline" value="2 calls" sub="hawk and owl fire in parallel on every token" />
          <Card label="arbiter path" value="+1 call" sub="only when the two disagree" />
          <Card label="observed split rate" value="35–45%" sub="so most scans never pay for the third call" />
        </div>
        <p className="mt-4 font-sans text-[13.5px] leading-[1.7] text-[var(--text-dim)]">
          A three-model ensemble pays for three opinions on every token. This design pays for three only when two were not enough. If the daily spend ceiling gets hit, <Code>arbiterShouldBeSmart()</Code> swaps arbiter from Sonnet down to Haiku so a runaway cron cannot drain the account.
        </p>
      </Section>

      {/* BIRDEYE USAGE */}
      <Section title="Birdeye endpoints, what they feed" icon={Database}>
        <div className="flex flex-col divide-y divide-[var(--border)] border border-[var(--border)]">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 font-mono text-[11.5px]">
              <span className="w-56 text-[var(--text)]">{e.path}</span>
              <span className="flex-1 text-[var(--text-dim)]">{e.purpose}</span>
              <span className="text-[var(--text-mute)]">{e.when}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-sans text-[13.5px] leading-[1.7] text-[var(--text-dim)]">
          <Emph>token_security</Emph> and <Emph>multi_price</Emph> are not on the free tier. The workaround is a heuristic safety score built from overview + holders + txns: wallet concentration, age, liquidity depth, deployer behavior. On manual review the agent skips the honeypots the security endpoint would have flagged.
        </p>
      </Section>

      <Section title="What's actually hard underneath" icon={Zap}>
        <ul className="flex flex-col gap-3 font-sans text-[14px] leading-[1.65] text-[var(--text-dim)]">
          <Li>
            <Emph>Token-bucket rate limiter</Emph> on the Birdeye client. 1050ms interval, no burst, 429/5xx retry with exponential backoff. A hot scan does not get to punch through the rate limit.
          </Li>
          <Li>
            <Emph>Streaming duel</Emph> at <Code>/api/duel/stream</Code>. Both models&apos; tokens flow to the browser as they generate. Hawk and owl race each other in real time, and the arbiter panel only appears when the two split.
          </Li>
          <Li>
            <Emph>Supabase realtime</Emph> on <Code>postgres_changes</Code> INSERTs. No polling, no refresh button. New calls slide into the feed with an accent flash the moment they land.
          </Li>
          <Li>
            <Emph>URL-reflected feed filters</Emph>. Conviction, direction, chosen_by, disagreed-only. Every filtered view is a link someone else can paste into their own browser.
          </Li>
          <Li>
            <Emph>Side-adjusted calibration</Emph> on <Link className="underline" href="/track">the track page</Link>. Short calls score green when price fell. Most dashboards silently treat short as long. This one does not.
          </Li>
          <Li>
            <Emph>Server-rendered OG cards</Emph> via <Code>next/og</Code>. One 1200×630 PNG for a call, another for a duel split. Every shareable URL has a thumbnail that matches it.
          </Li>
        </ul>
      </Section>

      {/* CTA */}
      <Section title="Try the thing" icon={Share2}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/" className="border border-[var(--border-strong)] p-5 hover:border-[var(--accent)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
              01
            </p>
            <p className="mt-2 font-sans text-[15px] font-semibold text-[var(--text)]">
              the live feed
            </p>
            <p className="mt-1.5 font-sans text-[12.5px] text-[var(--text-dim)]">
              watch calls slide in every 15 minutes.
            </p>
          </Link>
          <Link href="/track" className="border border-[var(--border-strong)] p-5 hover:border-[var(--accent)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
              02
            </p>
            <p className="mt-2 font-sans text-[15px] font-semibold text-[var(--text)]">
              the honesty page
            </p>
            <p className="mt-1.5 font-sans text-[12.5px] text-[var(--text-dim)]">
              calibration curve, per model, updated live.
            </p>
          </Link>
          <Link href="/kills" className="border border-[var(--border-strong)] p-5 hover:border-[var(--accent)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
              03
            </p>
            <p className="mt-2 font-sans text-[15px] font-semibold text-[var(--text)]">
              the kill list
            </p>
            <p className="mt-1.5 font-sans text-[12.5px] text-[var(--text-dim)]">
              losses pinned, sorted by how wrong.
            </p>
          </Link>
        </div>
      </Section>

      <div className="mt-14 border-t border-[var(--border)] pt-8 font-mono text-[10.5px] text-[var(--text-mute)]">
        built for Birdeye Data 4-Week BIP · Sprint 01 · deadline 2026-04-25. Next 16, Tailwind v4, Supabase, OpenRouter Claude, Birdeye v2/v3.
      </div>
    </div>
  );
}

const ENDPOINTS = [
  { path: "/defi/token_trending", purpose: "the candidate pool", when: "every 15m" },
  { path: "/defi/v2/tokens/new_listing", purpose: "fresh listings merged into candidates", when: "every 15m" },
  { path: "/defi/token_overview", purpose: "price, liq, holder count, 1h/24h change", when: "per survivor" },
  { path: "/defi/v3/token/holder", purpose: "top-10 wallet concentration", when: "per survivor" },
  { path: "/defi/txs/token", purpose: "last-hour flow + big-buy count", when: "per survivor" },
  { path: "/defi/price", purpose: "fresh PnL snapshot per open call", when: "every 20m" },
  { path: "/defi/ohlcv", purpose: "candles for the call detail chart", when: "on page view" },
];

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-[var(--border)] pt-8">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />
        <h2 className="font-sans text-[20px] font-semibold tracking-tight text-[var(--text)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Emph({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--text)]">{children}</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--text)]">
      {children}
    </code>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
      <span>{children}</span>
    </li>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-[var(--border)] p-4">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
        {label}
      </p>
      <p className="mt-2 font-sans text-[24px] font-semibold tabular-nums text-[var(--accent)]">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[11px] text-[var(--text-dim)]">{sub}</p>
    </div>
  );
}
