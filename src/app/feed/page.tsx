import type { Metadata } from "next";
import { StatHero } from "@/components/feed/StatHero";
import { Feed } from "@/components/feed/Feed";
import { LiveDuelInset } from "@/components/feed/LiveDuelInset";
import { getLastDisagreed } from "@/lib/duel-call";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "feed",
  description: "Every Solana token the agents have scored, newest first. Wins, losses, disagreements in the open.",
};

export default async function FeedPage() {
  const lastDisagreed = await getLastDisagreed();

  return (
    <div className="flex flex-col">
      <StatHero />
      <LiveDuelInset last={lastDisagreed} />
      <Feed />
      <footer className="border-t border-[var(--border)] px-5 py-8 text-center font-mono text-[10.5px] text-[var(--text-mute)] sm:py-10">
        built for birdeye/bip · sprint_01 · source on github after sprint
      </footer>
    </div>
  );
}
