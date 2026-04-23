import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "about",
  description:
    "How the two-agent duel works, what data drives it, and why the losses are on the same page as the wins.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16 lg:px-8">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
        about
      </p>
      <h1 className="mt-2 font-sans text-[32px] font-semibold tracking-tight text-[var(--text)] sm:text-[42px]">
        Two AIs, one token, a real verdict.
      </h1>
      <p className="mt-5 font-sans text-[15px] leading-[1.7] text-[var(--text-dim)]">
        Recon is a Solana alpha agent that argues with itself in public. Every
        fresh token that makes it past the safety filter gets scored by two
        different models at the same time. When they disagree on direction or
        conviction, a third model picks a side. Wins, losses, and split
        verdicts all land on the same feed.
      </p>

      <Section title="How one call is made">
        <ol className="flex flex-col gap-4 font-sans text-[14px] leading-[1.65] text-[var(--text-dim)]">
          <Step n={1} title="Candidates">
            Pull trending + new-listing tokens from Birdeye. Dedupe, drop
            anything under $25k liquidity or older than 14 days, rank by
            liquidity and volume with a new-listing boost.
          </Step>
          <Step n={2} title="Snapshot">
            For each survivor, fetch token overview, top-10 holders, and the
            last hour of swap transactions. Score safety from 0 to 10 based on
            concentration, age, liquidity, and deployer behavior. Anything
            below 3 is skipped entirely.
          </Step>
          <Step n={3} title="The duel">
            Send the same snapshot to{" "}
            <Emph>hawk (Claude Haiku 4.5)</Emph> and{" "}
            <Emph>owl (Claude Sonnet 4.6)</Emph> in parallel. Both return
            structured JSON: direction, conviction, horizon, risk, reasoning.
            Their streams are captured token-by-token so they can be replayed
            verbatim.
          </Step>
          <Step n={4} title="Arbitrate if needed">
            If the two directions differ, or conviction gaps by 20 points or
            more, a third call goes out to the <Emph>arbiter</Emph>. It sees
            both verdicts and must pick one or compromise. It cannot answer
            "both are valid".
          </Step>
          <Step n={5} title="Persist">
            Store both decisions, the disagreement flag, who was chosen, the
            arbiter's reasoning, and every raw signal. Nothing is thrown
            away.
          </Step>
          <Step n={6} title="Track">
            A second cron job takes fresh price snapshots and updates each
            call's live PnL. The track page plots actual green rate against
            stated conviction for each model separately.
          </Step>
        </ol>
      </Section>

      <Section title="The models">
        <ul className="flex flex-col gap-3 font-sans text-[14px] leading-[1.65] text-[var(--text-dim)]">
          <li>
            <Emph>hawk</Emph>. Claude Haiku 4.5 via OpenRouter. Fast, decisive,
            prefers acting over waiting. Temperature 0.3.
          </li>
          <li>
            <Emph>owl</Emph>. Claude Sonnet 4.6 via OpenRouter. Slower, more
            cautious, looks harder for exit-liquidity patterns. Temperature
            0.3.
          </li>
          <li>
            <Emph>arbiter</Emph>. Sonnet by default, downgrades to Haiku once
            the daily call budget runs hot so a runaway cron can't blow the
            allowance.
          </li>
        </ul>
      </Section>

      <Section title="Birdeye endpoints used">
        <pre className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-[11.5px] leading-[1.55] text-[var(--text-dim)]">{`GET /defi/token_trending      // pool of candidates
GET /defi/v2/tokens/new_listing   // fresh listings
GET /defi/token_overview      // price, liq, holder count, v1h/v24h
GET /defi/v3/token/holder     // top-10 wallet concentration
GET /defi/txs/token           // 1h flow + big-buy count
GET /defi/price               // fresh price for PnL snap
GET /defi/ohlcv               // candles for the call detail chart`}</pre>
      </Section>

      <Section title="Honest disclaimer">
        <p className="font-sans text-[14px] leading-[1.7] text-[var(--text-dim)]">
          This is a research prototype built for the Birdeye BIP hackathon
          sprint. It is <Emph>not financial advice</Emph>. Memecoins lose
          value faster than any model can model them. The only numbers worth
          trusting on this site are the ones in the losses column. Those are
          real.
        </p>
      </Section>

      <div className="mt-14 flex items-center justify-between border-t border-[var(--border)] pt-8">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
        >
          ← the feed
        </Link>
        <Link
          href="/track"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
        >
          calibration chart →
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-[var(--border)] pt-8">
      <h2 className="mb-5 font-sans text-[20px] font-semibold tracking-tight text-[var(--text)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--accent)] font-mono text-[10.5px] text-[var(--accent)]">
        {n}
      </span>
      <div>
        <p className="font-sans text-[14.5px] font-semibold text-[var(--text)]">{title}</p>
        <p className="mt-1">{children}</p>
      </div>
    </li>
  );
}

function Emph({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--text)]">{children}</span>;
}
