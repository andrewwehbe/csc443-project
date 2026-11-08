// Shown while a screen waits for its data. The bars stand in for the rows that are coming and keep their
// height, so the page does not jump when they arrive. Styled like the design pack's loading state (02-availability.html).
export default function LoadingState({ label = 'Loading', rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="border border-line bg-surface px-5 py-4">
            <div className="flex items-center gap-4">
              <span className="h-5 w-24 rounded bg-line motion-safe:animate-pulse" />
              <span className="h-3.5 w-40 rounded bg-line motion-safe:animate-pulse" />
            </div>
            <div className="mt-3 h-8 rounded-[2px] bg-line motion-safe:animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}
