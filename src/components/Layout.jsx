import { Link, Outlet, useLocation } from 'react-router';
import { buttonClass } from '../lib/buttons.js';
import DemoBar from './DemoBar.jsx';

const links = [
  { to: '/availability', label: 'Availability' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/my-bookings', label: 'My bookings' },
];

// Which header link is lit, as in the design pack: Today and Book a room count as Availability,
// a room's page as Rooms, History as My bookings. Sign in lights none.
function section(pathname) {
  if (pathname.startsWith('/rooms')) return '/rooms';
  if (pathname.startsWith('/my-bookings')) return '/my-bookings';
  if (pathname === '/' || pathname.startsWith('/availability') || pathname.startsWith('/bookings')) return '/availability';
  return null;
}

const initials = (name) => name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();   // 'LH'

// The persistent shell: the demo bar, header and footer stay, the page inside <Outlet /> changes with the route.
// The header follows the design pack: below md the links hide, below sm the Book a room button hides too.
export default function Layout({ users, currentUser, onUserChange, simulation, onSimulationChange }) {
  const { pathname } = useLocation();
  const current = section(pathname);
  const fullBleed = pathname === '/sign-in' || pathname === '/register';

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBar
        users={users}
        currentUser={currentUser}
        onUserChange={onUserChange}
        simulation={simulation}
        onSimulationChange={onSimulationChange}
      />

      <header className="border-b border-ink/15 bg-paper">
        <div className="mx-auto flex max-w-6xl items-end gap-7 px-4 pb-3 pt-4">
          <Link to="/" className="flex items-baseline gap-2.5">
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">Ghurfa</span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:inline">Two hours, yours</span>
          </Link>
          <nav className="hidden gap-6 md:flex" aria-label="Main">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                aria-current={current === to ? 'page' : undefined}
                className={`pb-1 text-sm ${current === to ? 'border-b-2 border-accent-500 font-semibold text-ink' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <span className="flex-1" />
          {/* The wrapper hides it: on the button itself, inline-flex would win over hidden. */}
          <span className="hidden sm:block"><Link to="/bookings/new" className={buttonClass('primary', 'small')}>Book a room</Link></span>
          {currentUser ? (
            <span title={currentUser.name} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 font-display text-[11px] font-semibold text-paper">
              <span aria-hidden="true">{initials(currentUser.name)}</span>
              <span className="sr-only">Signed in as {currentUser.name}</span>
            </span>
          ) : (
            <Link to="/sign-in" className={buttonClass('secondary', 'small')}>Sign in</Link>
          )}
        </div>
      </header>

      <main className={fullBleed ? 'flex w-full flex-1 flex-col' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-10'}>
        <Outlet />
      </main>

      {!fullBleed && (
        <footer className="mx-auto mt-20 w-full max-w-6xl border-t border-line px-4 py-8 text-xs text-muted">
          <span className="font-display font-bold tracking-wide">GHURFA</span> · CSC443 Web Programming · Fall 2026 · Team Not_vibeCoding
        </footer>
      )}
    </div>
  );
}
