import { Crosshair } from "lucide-react";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Crosshair className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.25} />
      <span
        className="font-[family-name:var(--font-display)] text-[15px] font-bold tracking-[0.12em] text-[var(--text)]"
      >
        RECON
      </span>
    </div>
  );
}
