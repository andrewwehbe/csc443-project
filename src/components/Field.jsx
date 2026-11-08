// One form field, as in the design pack: a small caps label, the input (passed as children), then either
// its error in red or a hint in grey. The input uses name as its id and aria-describedby="<name>-msg",
// so a screen reader reads the error or hint with it.
export default function Field({ label, name, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</label>
      {children}
      {error && <p id={`${name}-msg`} className="text-xs font-medium text-red-700">{error}</p>}
      {!error && hint && <p id={`${name}-msg`} className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
