// Shown when loading failed. Says what went wrong in plain words (no status code) and always offers a retry.
//   <ErrorState message="We could not load the rooms." onRetry={retry} />
// Styled like the design pack's error state (02-availability.html).
export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div role="alert" className="border border-red-300 bg-red-50 px-6 py-14 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-red-900">{title}</h2>
      {message && <p className="mx-auto mt-3 max-w-sm text-sm text-red-900/70">{message}</p>}
      {onRetry && (
        <div className="mt-7">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded bg-brand-800 px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
