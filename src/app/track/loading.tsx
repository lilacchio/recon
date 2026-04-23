export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="skeleton mb-3 h-3 w-32" />
      <div className="skeleton mb-10 h-10 w-72" />

      <div className="mb-10 border border-[var(--border)] p-5 sm:p-6">
        <div className="skeleton mb-4 h-3 w-48" />
        <div className="skeleton h-[320px] w-full" />
      </div>

      <div className="skeleton mb-3 h-3 w-28" />
      <div className="flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-2 py-3.5 sm:px-3">
            <div className="skeleton h-3 w-12" />
            <div className="skeleton h-4 w-28" />
            <div className="flex-1" />
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
