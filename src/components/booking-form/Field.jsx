// One labelled field: the label, the input (passed as children), an optional hint and the error.
// The input must carry the same id, plus aria-describedby pointing at `${id}-hint` and `${id}-error`
// so a screen reader reads them with it (BookingForm's fieldProps does both).
export default function Field({ id, label, hint, error, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex gap-1.5 text-sm text-red-700">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4h1.5v5h-1.5V6Zm0 6.5h1.5V14h-1.5v-1.5Z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
