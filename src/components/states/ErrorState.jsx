// Shown when loading failed. Says what went wrong and offers a way out.
//   <ErrorState message="We could not load the rooms." onRetry={retry} />
export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" strokeLinecap="round" />
      </svg>
      <h2 className="mt-3 text-base font-semibold text-red-900">{title}</h2>
      {message && <p className="mt-1 text-sm text-red-800">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
