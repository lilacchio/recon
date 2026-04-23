import type { Metadata } from "next";
import { getClosedCalls, calibrationFromCalls } from "@/lib/track";
import { TrackView } from "@/components/track/TrackView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "track record",
  description:
    "Calibration chart: when a model says '80 conviction', how often does that call actually land green? Hawk, owl, and the resolved verdict plotted separately.",
};

export default async function TrackPage() {
  const calls = await getClosedCalls();
  const calibration = calibrationFromCalls(calls);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-mute)]">
          the track record
        </p>
        <h1 className="mt-2 font-sans text-[28px] font-semibold tracking-tight text-[var(--text)] sm:text-[36px]">
          Every call, scored honestly.
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-[14px] leading-relaxed text-[var(--text-dim)]">
          Calibration: when each model says "80 conviction", do 80% of those
          calls land green? Anything close to the diagonal is a well-calibrated
          forecaster. Bars below show sample size per bucket.
        </p>
      </div>

      <TrackView calibration={calibration} calls={calls} />
    </div>
  );
}
