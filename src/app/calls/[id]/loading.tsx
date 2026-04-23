export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="skeleton mb-2 h-3 w-32" />
      <div className="skeleton mb-8 h-9 w-80 max-w-full" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="border border-[var(--border-strong)] p-5 sm:p-6">
            <div className="skeleton mb-3 h-3 w-48" />
            <div className="skeleton mb-2 h-3 w-full" />
            <div className="skeleton mb-2 h-3 w-11/12" />
            <div className="skeleton mb-2 h-3 w-10/12" />
            <div className="skeleton h-3 w-8/12" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="skeleton h-36 w-full" />
            <div className="skeleton h-36 w-full" />
          </div>
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="border border-[var(--border-strong)] p-5 sm:p-6">
            <div className="skeleton mb-3 h-3 w-32" />
            <div className="skeleton h-[280px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
