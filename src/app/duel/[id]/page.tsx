import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getDuelCall } from "@/lib/duel-call";
import { DuelReplay } from "@/components/duel/DuelReplay";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const call = await getDuelCall(id);
  if (!call) return { title: "duel · recon" };
  const title = call.disagreed
    ? `hawk vs owl on $${call.symbol} — arbiter picked ${call.chosenBy}`
    : `hawk and owl agree on $${call.symbol}: ${call.direction}`;
  const description = call.disagreed
    ? `hawk said ${call.hawk.direction} (conv ${call.hawk.conviction}), owl said ${call.owl.direction} (conv ${call.owl.conviction}). arbiter resolved it live on recon.`
    : `both models converged on ${call.direction} at conviction ${call.conviction}. filed ${new Date(call.createdAt).toUTCString()}.`;
  const ogUrl = `/api/og/duel?id=${id}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function DuelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getDuelCall(id);
  if (!call) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
          back to feed
        </Link>
        <Link
          href={`/calls/${call.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
        >
          call detail →
        </Link>
      </div>

      <div className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          {call.disagreed ? "the duel · models split" : "the duel · consensus"}
        </p>
        <h1 className="mt-2 font-sans text-[28px] font-semibold tracking-tight text-[var(--text)] sm:text-[36px]">
          {call.symbol}{" "}
          <span className="text-[var(--text-mute)]">vs itself</span>
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-[13.5px] leading-relaxed text-[var(--text-dim)]">
          {call.disagreed
            ? `Hawk said ${call.hawk.direction} at ${call.hawk.conviction}. Owl said ${call.owl.direction} at ${call.owl.conviction}. Arbiter picked ${call.chosenBy}.`
            : `Both models agreed on ${call.direction}. Resolved at ${call.conviction} conviction via consensus.`}
        </p>
      </div>

      <DuelReplay call={call} />
    </div>
  );
}
