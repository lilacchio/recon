import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Split } from "lucide-react";
import { getDuelCall } from "@/lib/duel-call";
import { getOhlcv } from "@/lib/birdeye";
import { PriceChart } from "@/components/calls/PriceChart";
import { DataReceipts } from "@/components/calls/DataReceipts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const call = await getDuelCall(id);
  if (!call) return { title: "call · recon" };
  const title = `$${call.symbol} — ${call.direction} · conv ${call.conviction}`;
  const description = call.reasoning.slice(0, 180);
  const ogUrl = `/api/og/call?id=${id}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getDuelCall(id);
  if (!call) notFound();

  // OHLCV since call: compute hourly candles from created_at → now.
  const fromSec = Math.floor(new Date(call.createdAt).getTime() / 1000);
  const toSec = Math.floor(Date.now() / 1000);
  const candles = await getOhlcv(call.address, {
    type: "1H",
    time_from: fromSec,
    time_to: toSec,
  }).catch(() => []);

  const chartData = candles.map((k) => ({
    time: k.unixTime,
    open: k.o,
    high: k.h,
    low: k.l,
    close: k.c,
  }));

  const signals = call.signals as Record<string, unknown>;
  const endpoints = (signals.endpoints as { name: string; purpose: string }[]) ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-mute)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
          back to feed
        </Link>
        {call.disagreed && (
          <Link
            href={`/duel/${call.id}`}
            className="flex items-center gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--accent)]"
          >
            <Split className="h-3 w-3" strokeWidth={2.5} />
            replay duel
          </Link>
        )}
      </div>

      <div className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          call {call.id.slice(0, 8)}
        </p>
        <h1 className="mt-2 font-sans text-[28px] font-semibold tracking-tight text-[var(--text)] sm:text-[36px]">
          {call.symbol}{" "}
          <span className="text-[var(--text-mute)]">{call.name}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="border border-[var(--border-strong)] p-5 sm:p-6">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
              resolved reasoning · via {call.chosenBy}
            </p>
            <p className="font-sans text-[14.5px] leading-[1.65] text-[var(--text)]">
              {call.reasoning}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10.5px] text-[var(--text-mute)]">
              <span>
                direction{" "}
                <span
                  className="text-[var(--text)]"
                  style={{
                    color:
                      call.direction === "long"
                        ? "var(--up)"
                        : call.direction === "short"
                        ? "var(--down)"
                        : "var(--watch)",
                  }}
                >
                  {call.direction}
                </span>
              </span>
              <span>
                conv <span className="text-[var(--text)]">{call.conviction}</span>
              </span>
              <span>
                horizon <span className="text-[var(--text-dim)]">{call.horizon}</span>
              </span>
              <span>
                risk <span className="text-[var(--text-dim)]">{call.risk}/10</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MiniAgent role="hawk" tag="fast · haiku" d={call.hawk} />
            <MiniAgent role="owl" tag="deep · sonnet" d={call.owl} />
          </div>

          <DataReceipts endpoints={endpoints} signals={signals} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-[var(--border-strong)] p-5 sm:p-6">
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
              price since call
            </p>
            <PriceChart data={chartData} entry={call.priceAtCall} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniAgent({
  role,
  tag,
  d,
}: {
  role: "hawk" | "owl";
  tag: string;
  d: { direction: "long" | "short" | "watch"; conviction: number; reasoning: string };
}) {
  const color =
    d.direction === "long"
      ? "var(--up)"
      : d.direction === "short"
      ? "var(--down)"
      : "var(--watch)";
  return (
    <div className="border border-[var(--border)] p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-sans text-[15px] font-semibold text-[var(--text)]">{role}</span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--text-mute)]">{tag}</span>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <span className="border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ borderColor: color, color }}>
          {d.direction}
        </span>
        <span className="font-mono text-[10.5px] text-[var(--text-dim)]">conv {d.conviction}</span>
      </div>
      <p className="line-clamp-4 font-sans text-[12.5px] leading-[1.55] text-[var(--text-dim)]">
        {d.reasoning}
      </p>
    </div>
  );
}
