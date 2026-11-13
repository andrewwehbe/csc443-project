import { Link } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { isOwner } from '../lib/ownership.js';
import { effectiveStatus } from '../lib/bookingRules.js';
import { statusChipClass } from '../lib/roomStatus.js';
import { whenPhrase } from '../lib/roomDetail.js';
import { formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

const dayName = (iso) => whenPhrase(iso).replace(/^on /, '').replace(/^./, (c) => c.toUpperCase());

function statusWord(booking, now) {
  if (effectiveStatus(booking, now) === 'cancelled') return { word: 'Cancelled', tone: 'off' };
  return { word: 'Completed', tone: 'free' };
}

// Surface: 07 History, at /my-bookings/history. The History tab of My bookings.
// Past bookings of the signed-in user: ended ones count as completed, cancelled ones stay cancelled.
export default function HistoryPage({ rooms, bookings, currentUser, simulation }) {
  const now = new Date();
  const mine = bookings.filter((b) => isOwner(b, currentUser));
  const upcomingCount = mine.filter((b) => b.status === 'confirmed' && new Date(b.end) > now).length;
  const past = mine
    .filter((b) => b.status === 'cancelled' || effectiveStatus(b, now) === 'completed')
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  const { status, data, retry } = useSimulatedRequest(past, simulation);

  let content;
  if (currentUser === null) {
    content = <EmptyState title="Sign in to see your bookings" message="Your bookings are kept under your name." action={<Link to="/sign-in" className={buttonClass('primary', 'small')}>Sign in</Link>} />;
  } else if (status === 'loading') {
    content = <LoadingState label="Loading your history" rows={2} />;
  } else if (status === 'error') {
    content = <ErrorState title="Your history would not load" message="The server did not answer. This usually passes in a moment." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="No past bookings" message="Rooms you have used, and bookings you cancel, appear here." />;
  } else {
    content = (
      <>
        <style>{`
          .history-list { position: relative; margin: 0; padding: 0.25rem 0 0; list-style: none; }
          .history-list::before {
            content: '';
            position: absolute;
            top: 0.6rem;
            bottom: 0.6rem;
            left: 6.35rem;
            width: 1px;
            background: var(--color-line);
          }
          .history-item {
            position: relative;
            display: grid;
            grid-template-columns: 5.5rem 1fr;
            gap: 1.75rem;
            align-items: start;
            opacity: 0;
            animation: history-in 0.45s ease forwards;
            animation-delay: calc(var(--i) * 60ms);
          }
          .history-item + .history-item { margin-top: 0.85rem; }
          .history-day {
            position: relative;
            padding-top: 0.85rem;
            font-family: var(--font-display);
            font-size: 0.8rem;
            font-weight: 600;
            line-height: 1.25;
            text-align: right;
            color: var(--color-ink);
          }
          .history-day::after {
            content: '';
            position: absolute;
            top: 1.15rem;
            right: -1.15rem;
            width: 0.55rem;
            height: 0.55rem;
            border: 2px solid var(--color-brand-800);
            border-radius: 50%;
            background: var(--color-paper);
          }
          .history-item.is-cancelled .history-day { color: var(--color-muted); }
          .history-item.is-cancelled .history-day::after { border-color: var(--color-line); }
          .history-card {
            border: 1px solid var(--color-line);
            background: var(--color-surface);
            padding: 0.9rem 1.15rem;
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .history-card:hover {
            transform: translateY(-2px);
            border-color: var(--color-brand-300);
          }
          @keyframes history-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .history-item { animation: none; opacity: 1; }
            .history-card:hover { transform: none; }
          }
          @media (max-width: 639px) {
            .history-list::before { left: 0.35rem; }
            .history-item { grid-template-columns: 1fr; gap: 0.35rem; padding-left: 1.4rem; }
            .history-day { padding-top: 0; text-align: left; }
            .history-day::after { top: 0.25rem; right: auto; left: -1.25rem; }
          }
        `}</style>
        <ol className="history-list">
          {data.map((booking, index) => {
            const room = rooms.find((r) => r.id === booking.roomId);
            const { word, tone } = statusWord(booking, now);
            const cancelled = word === 'Cancelled';
            return (
              <li key={booking.id} className={`history-item${cancelled ? ' is-cancelled' : ''}`} style={{ '--i': index }}>
                <span className="history-day">{dayName(booking.start)}</span>
                <article className="history-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link to={`/rooms/${room.id}`} className={`font-display text-lg font-semibold tracking-tight hover:underline ${cancelled ? 'text-muted line-through' : 'text-ink'}`}>{room.name}</Link>
                    <span className={statusChipClass(tone)}>{word}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatTime(booking.start)} – {formatTime(booking.end)} · {booking.purpose}</p>
                </article>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-muted">Newest first. Cancelled bookings stay here.</p>
      </>
    );
  }

  return (
    <section>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">My bookings</h1>
      <nav className="mt-6 flex gap-8 border-b border-line" aria-label="My bookings">
        <Link to="/my-bookings" className="border-b-2 border-transparent pb-2.5 font-display text-sm text-muted hover:text-ink">
          Upcoming <span className="ml-1.5 border border-line px-1.5 font-mono text-[10px] tabular-nums">{upcomingCount}</span>
        </Link>
        <Link to="/my-bookings/history" aria-current="page" className="border-b-2 border-accent-500 pb-2.5 font-display text-sm font-semibold text-ink">
          History <span className="ml-1.5 border border-line px-1.5 font-mono text-[10px] tabular-nums">{past.length}</span>
        </Link>
      </nav>
      <div className="mt-5">{content}</div>
    </section>
  );
}
