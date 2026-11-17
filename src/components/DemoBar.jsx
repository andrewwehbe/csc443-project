import { frame } from '../lib/frame.js';

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
      <div className={`${frame} flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-sm`}>
        <span className="font-medium text-slate-300">Phase 1 demo</span>
        <label className="flex items-center gap-2">
          Signed in as
          <select
            value={currentUser ? currentUser.id : ''}
            onChange={handleUserChange}
            className="rounded-lg border border-paper bg-paper px-2.5 py-1 text-base font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 sm:text-sm"
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
            className="rounded-lg border border-paper bg-paper px-2.5 py-1 text-base font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 sm:text-sm"
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
