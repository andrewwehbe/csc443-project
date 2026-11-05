// Shown while a screen waits for its data. The grey bars stand in for the rows that are coming,
// so the page does not jump when they arrive.
export default function LoadingState({ label = 'Loading', rows = 3 }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4 motion-safe:animate-pulse">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
