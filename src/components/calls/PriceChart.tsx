"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

type Candle = { time: number; open: number; high: number; low: number; close: number };

export function PriceChart({
  data,
  entry,
}: {
  data: Candle[];
  entry: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 320,
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.5)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;

    const candles: ISeriesApi<"Candlestick"> = chart.addSeries(CandlestickSeries, {
      upColor: "#4ade80",
      downColor: "#f87171",
      borderUpColor: "#4ade80",
      borderDownColor: "#f87171",
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
    });
    candles.setData(
      data
        .filter((c) => Number.isFinite(c.time))
        .map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
    );

    // Entry line
    if (entry > 0 && data.length) {
      const entryLine: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
        color: "#fcd34d",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      entryLine.setData(
        data.map((c) => ({ time: c.time as UTCTimestamp, value: entry })),
      );
    }

    chart.timeScale().fitContent();

    const onResize = () => {
      if (ref.current && chartRef.current)
        chartRef.current.applyOptions({ width: ref.current.clientWidth });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [data, entry]);

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center font-mono text-[11px] text-[var(--text-mute)]">
        no price candles yet. birdeye will populate after the first snap.
      </div>
    );
  }

  return <div ref={ref} className="h-[320px] w-full" />;
}
