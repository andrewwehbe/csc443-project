import { useState } from 'react';
import { Link } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { isOwner } from '../lib/ownership.js';
import { statusChipClass } from '../lib/roomStatus.js';
import { whenPhrase } from '../lib/roomDetail.js';
import { dateKey, formatDuration, formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

const dayName = (iso) => whenPhrase(iso).replace(/^on /, '').replace(/^./, (c) => c.toUpperCase());   // 'Today', 'Thu 12 Nov'

// The word in the box: today's bookings count down, a running one says until when, the rest are Confirmed.
function statusWord(booking, now) {
  const minutes = Math.round((new Date(booking.start) - now) / 60000);
  if (minutes <= 0) return { word: `In use until ${formatTime(booking.end)}`, tone: 'busy' };
  if (dateKey(booking.start) === dateKey(now)) return { word: `Starts in ${formatDuration(minutes)}`, tone: 'busy' };
  return { word: 'Confirmed', tone: 'free' };
}

// Surface: 06 My bookings, at /my-bookings. Owner: Andrew Wehbe.
// The signed-in user's bookings that have not ended, soonest first. Each booking is asked "is this mine?"
// with isOwner, so switching user in the demo bar changes the list; someone signed out is asked to sign in.
export default function MyBookingsPage({ rooms, bookings, currentUser, simulation, cancelBooking }) {
  const now = new Date();
  const mine = bookings.filter((b) => isOwner(b, currentUser));
  const upcoming = mine.filter((b) => b.status === 'confirmed' && new Date(b.end) > now).sort((a, b) => new Date(a.start) - new Date(b.start));
  const { status, data, retry } = useSimulatedRequest(upcoming, simulation);
  const [message, setMessage] = useState('');   // what the last Cancel did

  function handleCancel(booking, room) {
    const what = `${room.name}, ${dayName(booking.start)} ${formatTime(booking.start)} to ${formatTime(booking.end)}`;
    if (!window.confirm(`Cancel ${what}? This cannot be undone.`)) return;
    const result = cancelBooking(booking.id);
    setMessage(result.ok ? `Cancelled ${what}.` : result.problems[0].message);
  }

  let content;
  if (currentUser === null) {
    content = <EmptyState title="Sign in to see your bookings" message="Your bookings are kept under your name." action={<Link to="/sign-in" className={buttonClass('primary', 'small')}>Sign in</Link>} />;
  } else if (status === 'loading') {
    content = <LoadingState label="Loading your bookings" rows={2} />;
  } else if (status === 'error') {
    content = <ErrorState title="Your bookings would not load" message="The server did not answer. This usually passes in a moment." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="You have no rooms booked" message="Rooms you book appear here, soonest first." action={<Link to="/availability" className={buttonClass('primary', 'small')}>Find a room</Link>} />;
  } else {
    content = (
      <>
        <ul className="space-y-3">
          {data.map((booking) => {
            const room = rooms.find((r) => r.id === booking.roomId);
            const { word, tone } = statusWord(booking, now);
            return (
              <li key={booking.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-line bg-surface px-5 py-4">
                <span className="min-w-0 flex-1">
                  <Link to={`/rooms/${room.id}`} className="block font-display text-lg font-semibold tracking-tight text-ink hover:underline">{room.name}</Link>
                  <span className="mt-0.5 block text-xs text-muted">{dayName(booking.start)} {formatTime(booking.start)} – {formatTime(booking.end)} · {booking.purpose}</span>
                </span>
                <span className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                  <span className={`${statusChipClass(tone)} mr-auto sm:mr-0`}>{word}</span>
                  {new Date(booking.start) > now && <Link to={`/bookings/${booking.id}/edit`} className={buttonClass('secondary', 'small')}>Change</Link>}
                  <button type="button" onClick={() => handleCancel(booking, room)} className={buttonClass('secondary', 'small')}>Cancel</button>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">You can hold one booking a day, so each of these is on a different day.</p>
      </>
    );
  }

  return (
    <section>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">My bookings</h1>
      <nav className="mt-6 flex gap-8 border-b border-line" aria-label="My bookings">
        <Link to="/my-bookings" aria-current="page" className="border-b-2 border-accent-500 pb-2.5 font-display text-sm font-semibold text-ink">
          Upcoming <span className="ml-1.5 border border-line px-1.5 font-mono text-[10px] tabular-nums">{upcoming.length}</span>
        </Link>
        <Link to="/my-bookings/history" className="border-b-2 border-transparent pb-2.5 font-display text-sm text-muted hover:text-ink">
          History <span className="ml-1.5 border border-line px-1.5 font-mono text-[10px] tabular-nums">{mine.length - upcoming.length}</span>
        </Link>
      </nav>
      {message && <p role="status" className="mt-5 border-l-4 border-brand-700 bg-brand-50 p-4 text-sm font-semibold text-brand-900">{message}</p>}
      <div className="mt-5">{content}</div>
    </section>
  );
}
