// Phase 1 only: there is no real sign-in or server yet, so this bar lets anyone (the professor included)
// switch who is signed in and force a data state. Phase 2 replaces it with a real login and real requests.
const MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Slow (loading)' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
];

export default function DemoBar({ users, currentUser, onUserChange, simulation, onSimulationChange }) {
  function handleUserChange(e) {
    const id = e.target.value;
    onUserChange(users.find((user) => user.id === id) ?? null);
  }

  return (
    <div className="bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 text-sm">
        <span className="font-medium text-slate-300">Phase 1 demo</span>
        <label className="flex items-center gap-2">
          Signed in as
          <select
            value={currentUser ? currentUser.id : ''}
            onChange={handleUserChange}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-base sm:text-sm"
          >
            <option value="">Nobody (signed out)</option>
            {users.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Data
          <select
            value={simulation}
            onChange={(e) => onSimulationChange(e.target.value)}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-base sm:text-sm"
          >
            {MODES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
