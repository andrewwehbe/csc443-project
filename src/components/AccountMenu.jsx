import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { CalendarCheck, LogOut } from 'lucide-react';
import Icon from './Icon.jsx';

const initials = (name) => name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();   // 'LH'
const item = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-brand-50';

// The circle with your initials in the header, as a button: it opens a small menu with your name,
// My bookings and Sign out, so signing out does not depend on the demo bar. Escape or a click outside closes it.
//   <AccountMenu user={currentUser} onSignOut={() => onUserChange(null)} />
export default function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      rootRef.current.querySelector('button').focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 font-display text-[11px] font-semibold text-paper hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800">
        <span aria-hidden="true">{initials(user.name)}</span>
        <span className="sr-only">Account: {user.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5">
          <p className="px-3 pb-2 pt-1.5 text-xs text-muted">Signed in as <span className="block text-sm font-semibold text-ink">{user.name}</span></p>
          <Link to="/my-bookings" onClick={() => setOpen(false)} className={item}><Icon icon={CalendarCheck} size="sm" />My bookings</Link>
          <button type="button" onClick={() => { setOpen(false); onSignOut(); }} className={item}><Icon icon={LogOut} size="sm" />Sign out</button>
        </div>
      )}
    </div>
  );
}
