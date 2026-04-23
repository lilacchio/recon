import { getFeedCalls } from "@/lib/feed";
import { FeedList } from "./FeedList";

export async function Feed() {
  const calls = await getFeedCalls(50);
  return <FeedList initial={calls} />;
}
