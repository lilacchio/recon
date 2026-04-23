import { getFeedStats } from "@/lib/feed";
import { StatHeroClient } from "./StatHeroClient";

export async function StatHero() {
  const stats = await getFeedStats();
  return <StatHeroClient stats={stats} />;
}
