// Shown when there is nothing to list. Always say why it is empty and what the user can do next.
//   <EmptyState title="No rooms match" message="Try fewer filters." action={<Link to="/rooms">Clear filters</Link>} />
export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4M9 15h6" />
      </svg>
      <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
