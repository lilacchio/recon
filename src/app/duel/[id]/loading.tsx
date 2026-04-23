export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="skeleton mb-2 h-3 w-40" />
      <div className="skeleton mb-3 h-9 w-64" />
      <div className="skeleton mb-8 h-3 w-96 max-w-full" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="border border-[var(--border)] p-5">
          <div className="skeleton mb-4 h-4 w-24" />
          <div className="skeleton mb-2 h-3 w-full" />
          <div className="skeleton mb-2 h-3 w-11/12" />
          <div className="skeleton mb-2 h-3 w-10/12" />
          <div className="skeleton mb-2 h-3 w-9/12" />
          <div className="skeleton h-3 w-8/12" />
        </div>
        <div className="border border-[var(--border)] p-5">
          <div className="skeleton mb-4 h-4 w-24" />
          <div className="skeleton mb-2 h-3 w-full" />
          <div className="skeleton mb-2 h-3 w-11/12" />
          <div className="skeleton mb-2 h-3 w-10/12" />
          <div className="skeleton mb-2 h-3 w-9/12" />
          <div className="skeleton h-3 w-8/12" />
        </div>
      </div>
    </div>
  );
}
