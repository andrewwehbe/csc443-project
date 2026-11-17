import { Link, Outlet, useLocation } from 'react-router';
import { CalendarPlus } from 'lucide-react';
import { buttonClass } from '../lib/buttons.js';
import { frame } from '../lib/frame.js';
import AccountMenu from './AccountMenu.jsx';
import DemoBar from './DemoBar.jsx';
import MobileTabBar from './MobileTabBar.jsx';
import Icon from './Icon.jsx';
import Logo, { LogoMark } from './Logo.jsx';

// The same four places as the phone's tab bar (MobileTabBar), with the same names.
const links = [
  { to: '/', label: 'Today' },
  { to: '/availability', label: 'Availability' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/my-bookings', label: 'My bookings' },
];

// Which header link is lit: each page lights its own place, a room's page lights Rooms, History lights
// My bookings. Booking and Sign in light none: the Book a room button is where you are.
function section(pathname) {
  if (pathname === '/') return '/';
  if (pathname.startsWith('/availability')) return '/availability';
  if (pathname.startsWith('/rooms')) return '/rooms';
  if (pathname.startsWith('/my-bookings')) return '/my-bookings';
  return null;
}

// The persistent shell: the demo bar, header and footer stay, the page inside <Outlet /> changes with the route.
// The header follows the design pack: below md the links hide, below sm the Book a room button hides too.
export default function Layout({ users, currentUser, onUserChange, simulation, onSimulationChange }) {
  const { pathname } = useLocation();
  const current = section(pathname);
  const fullBleed = pathname === '/sign-in' || pathname === '/register';
  const hideBook = pathname.startsWith('/rooms/') || pathname.startsWith('/bookings');

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <DemoBar
        users={users}
        currentUser={currentUser}
        onUserChange={onUserChange}
        simulation={simulation}
        onSimulationChange={onSimulationChange}
      />

      <header className="border-b border-ink/15 bg-paper">
        <div className={`${frame} flex items-end gap-7 pb-3 pt-4`}>
          <Link to="/" className="flex items-center gap-3" aria-label="Ghurfa, home">
            <Logo />
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
          {/* The wrapper hides it: on the button itself, inline-flex would win over hidden. Left out on a room's
              page, which has its own Book this room, and on the booking form itself: one primary button a screen. */}
          {!hideBook && <span className="hidden sm:block"><Link to="/bookings/new" className={buttonClass('primary', 'small')}><Icon icon={CalendarPlus} size="sm" />Book a room</Link></span>}
          {currentUser ? (
            <AccountMenu user={currentUser} onSignOut={() => onUserChange(null)} />
          ) : (
            <Link to="/sign-in" className={buttonClass('secondary', 'small')}>Sign in</Link>
          )}
        </div>
      </header>

      <main className={fullBleed ? 'flex w-full flex-1 flex-col' : `${frame} flex-1 py-10`}>
        <Outlet />
      </main>

      {!fullBleed && (
        <footer className={`${frame} mt-20 flex items-center gap-2 border-t border-line py-8 text-xs text-muted`}>
          <LogoMark className="h-4 w-4" />
          <span><span className="font-display font-bold tracking-wide text-ink">GHURFA</span> · CSC443 Web Programming · Fall 2026 · Team Not_vibeCoding</span>
        </footer>
      )}

      <MobileTabBar />
    </div>
  );
}
