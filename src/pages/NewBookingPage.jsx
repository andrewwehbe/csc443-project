import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { emptyForm } from '../lib/bookingForm.js';
import { formatDate, formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/BookingForm.jsx';

// Surface: 05 Book a room, at /bookings/new. Owner: Andrew Wehbe.
export default function NewBookingPage({ rooms, bookings, currentUser, simulation, addBooking }) {
  const [searchParams] = useSearchParams();
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);
  const [created, setCreated] = useState(null);   // the booking just made

  let content;
  if (currentUser === null) {
    content = <EmptyState title="Sign in to book a room" message="Bookings are made in your name." action={<Link to="/sign-in" className={buttonClass('primary', 'small')}>Sign in</Link>} />;
  } else if (status === 'loading') {
    content = <LoadingState label="Loading rooms" />;
  } else if (status === 'error') {
    content = <ErrorState title="The rooms would not load" message="We could not load the rooms. This usually passes in a moment." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="No rooms to book" message="The library has not listed any study rooms yet." />;
  } else if (created) {
    const room = data.find((r) => r.id === created.roomId);
    content = (
      <div role="status" className="max-w-3xl border-l-4 border-brand-700 bg-brand-50 p-4 text-sm font-semibold text-brand-900">
        Booked {room.name} for {formatDate(created.start)}, {formatTime(created.start)} to {formatTime(created.end)}.
        <p className="mt-3 flex flex-wrap gap-2">
          <Link to="/my-bookings" className={buttonClass('primary', 'small')}>See my bookings</Link>
          <button type="button" onClick={() => setCreated(null)} className={buttonClass('quiet', 'small')}>Book another</button>
        </p>
      </div>
    );
  } else {
    content = (
      <BookingForm rooms={data} bookings={bookings} currentUser={currentUser} initialForm={emptyForm(searchParams)}
        bookingId={null} submitLabel="Confirm booking" onSave={addBooking} onSaved={setCreated} />
    );
  }

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ghurfa <span className="text-accent-600">/</span> Book</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">Book a room</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">Two hours at most, one booking a day. The clash is checked while you choose the time, not after you press the button.</p>
      <div className="mt-10">{content}</div>
    </section>
  );
}
