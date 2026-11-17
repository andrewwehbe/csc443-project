import { Link, useLocation } from 'react-router';
import { CalendarCheck, CalendarPlus, DoorOpen, House } from 'lucide-react';
import Icon from './Icon.jsx';

// Phones only (below md, where the header hides its links): a bar fixed to the bottom of the screen with the
// four places people go. Adapted from 21st.dev/@shadcnui-blocks/tabs-08 (icon over a short label, a line on
// the active tab), as plain links: it moves between pages, so it is navigation, not tabs.
const TABS = [
  { to: '/', label: 'Today', icon: House, active: (path) => path === '/' },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen, active: (path) => path.startsWith('/rooms') || path.startsWith('/availability') },
  { to: '/bookings/new', label: 'Book', icon: CalendarPlus, active: (path) => path.startsWith('/bookings') },
  { to: '/my-bookings', label: 'Mine', icon: CalendarCheck, active: (path) => path.startsWith('/my-bookings') },
];

export default function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {TABS.map(({ to, label, icon, active }) => {
        const on = active(pathname);
        return (
          <Link key={to} to={to} aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 border-t-2 pb-2 pt-1.5 text-[11px] ${on ? 'border-accent-500 font-semibold text-ink' : 'border-transparent text-muted'}`}>
            <Icon icon={icon} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
