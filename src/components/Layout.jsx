import { NavLink, Outlet } from 'react-router';
import DemoBar from './DemoBar.jsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/bookings/new', label: 'Book a room' },
];

// The persistent shell: the demo bar, header and footer stay, the page inside <Outlet /> changes with the route.
export default function Layout({ users, currentUser, onUserChange, simulation, onSimulationChange }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBar
        users={users}
        currentUser={currentUser}
        onUserChange={onUserChange}
        simulation={simulation}
        onSimulationChange={onSimulationChange}
      />

      <header className="border-b border-ink/15">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3" aria-label="Main">
          <span className="font-semibold text-brand-800">Study Rooms</span>
          <ul className="flex gap-4 text-sm">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) => (isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink')}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        CSC443 Web Programming · Fall 2026 · Team Not_vibeCoding
      </footer>
    </div>
  );
}
