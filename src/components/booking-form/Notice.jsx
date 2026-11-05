// A short message in place of the form, when this user cannot book or edit here:
// signed out, someone else's booking, or a booking that can no longer change.
//   <Notice title="Sign in to book a room" message="..." action={<Link to="/">Back to home</Link>} />
export default function Notice({ title, message, action }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
