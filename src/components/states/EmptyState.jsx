// Shown when there is nothing to list. Always say why it is empty and what the user can do next.
//   <EmptyState title="No rooms match" message="Try fewer filters." action={<Link to="/rooms">Clear filters</Link>} />
// Styled like the design pack's empty state (02-availability.html).
export default function EmptyState({ title, message, action }) {
  return (
    <div className="border border-dashed border-ink/25 bg-surface px-6 py-14 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      {message && <p className="mx-auto mt-3 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
