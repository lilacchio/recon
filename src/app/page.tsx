import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { ActDuel } from "@/components/landing/ActDuel";
import { ActArbiter } from "@/components/landing/ActArbiter";
import { ActReceiptsServer } from "@/components/landing/ActReceiptsServer";
import { ActKills } from "@/components/landing/ActKills";
import { ActEnter } from "@/components/landing/ActEnter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "recon · the renaissance of on-chain calls" },
  description:
    "Two AIs argue over every Solana token we surface. A third breaks the tie. Wins, losses, and splits all file to the same public feed.",
};

export default function LandingPage() {
  return (
    <>
      <div className="flex flex-col">
        <Hero />
        <ActDuel />
        <ActArbiter />
        <ActReceiptsServer />
        <ActKills />
        <ActEnter />
      </div>
    </>
  );
}
