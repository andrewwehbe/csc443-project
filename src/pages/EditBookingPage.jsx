import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { bookingToForm } from '../lib/bookingForm.js';
import { isOwner } from '../lib/ownership.js';
import { formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/BookingForm.jsx';

// Surface: Edit booking, at /bookings/:bookingId/edit, the 05 form for a saved booking. Owner: Andrew Wehbe.
// The owner gets the form; another student and someone signed out get a message. isOwner decides.
export default function EditBookingPage({ rooms, users, bookings, currentUser, simulation, updateBooking }) {
  const { bookingId } = useParams();
  const booking = bookings.find((b) => b.id === bookingId);
  const { status, data, retry } = useSimulatedRequest(booking, simulation);
  const [savedAt, setSavedAt] = useState(null);   // when the last save happened

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading the booking" rows={1} />;
  } else if (status === 'error') {
    content = <ErrorState title="The booking would not load" message="We could not load this booking. This usually passes in a moment." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="Booking not found" message="There is no booking at this address." action={<Link to="/my-bookings" className={buttonClass('secondary', 'small')}>My bookings</Link>} />;
  } else if (currentUser === null) {
    content = <EmptyState title="Sign in to change this booking" message="Only the student who made it can change it." action={<Link to="/sign-in" className={buttonClass('primary', 'small')}>Sign in</Link>} />;
  } else if (!isOwner(data, currentUser)) {
    const owner = users.find((u) => u.id === data.userId);
    content = <EmptyState title="This is not your booking" message={`It belongs to ${owner.name}. Only they can change it.`} />;
  } else if (data.status !== 'confirmed' || new Date(data.start) <= new Date()) {
    content = <EmptyState title="This booking can no longer change" message="Cancelled, past and started bookings stay as they are." />;
  } else {
    content = (
      <>
        {savedAt && <p role="status" className="mb-6 max-w-3xl border-l-4 border-brand-700 bg-brand-50 p-4 text-sm font-semibold text-brand-900">Changes saved at {formatTime(savedAt)}.</p>}
        <BookingForm key={savedAt} rooms={rooms} bookings={bookings} currentUser={currentUser} initialForm={bookingToForm(data)}
          bookingId={data.id} submitLabel="Save changes" onSave={(draft) => updateBooking(data.id, draft)}
          onSaved={() => setSavedAt(new Date().toISOString())} />
      </>
    );
  }

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ghurfa <span className="text-accent-600">/</span> My bookings <span className="text-accent-600">/</span> Change</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink">Change a booking</h1>
      <div className="mt-10">{content}</div>
    </section>
  );
}
