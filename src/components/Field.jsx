// One form field: its label, the input (passed as children) and its error message.
// The input uses name as its id, and aria-describedby="<name>-error" so a screen reader reads the error with it.
export default function Field({ label, name, error, children }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-800">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
