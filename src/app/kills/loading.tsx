export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="skeleton mb-3 h-3 w-28" />
      <div className="skeleton mb-8 h-10 w-60" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] p-5">
            <div className="skeleton mb-3 h-4 w-24" />
            <div className="skeleton mb-2 h-7 w-20" />
            <div className="skeleton mb-4 h-2.5 w-full" />
            <div className="skeleton h-2.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
