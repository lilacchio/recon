export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      {/* stat hero skeleton */}
      <div className="mb-10 border border-[var(--border)] p-5 sm:p-6">
        <div className="skeleton mb-4 h-3 w-32" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton mb-2 h-2.5 w-20" />
              <div className="skeleton h-7 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* duel inset skeleton */}
      <div className="mb-10 border border-[var(--border)] p-5">
        <div className="skeleton mb-4 h-3 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="skeleton h-[170px] w-full" />
          <div className="skeleton h-[170px] w-full" />
        </div>
      </div>

      {/* feed rows skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-40" />
      </div>
      <div className="flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <FeedRowSkel key={i} />
        ))}
      </div>
    </div>
  );
}

function FeedRowSkel() {
  return (
    <div className="flex items-center gap-4 px-2 py-4 sm:px-3">
      <div className="skeleton h-3 w-10" />
      <div className="flex-1">
        <div className="skeleton mb-2 h-4 w-36" />
        <div className="skeleton h-2.5 w-72 max-w-full" />
      </div>
      <div className="hidden sm:block">
        <div className="skeleton h-8 w-24" />
      </div>
      <div className="skeleton h-3 w-12" />
      <div className="skeleton h-3 w-14" />
    </div>
  );
}
