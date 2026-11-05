import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { bookingToForm } from '../lib/bookingForm.js';
import { effectiveStatus } from '../lib/bookingRules.js';
import { isOwner } from '../lib/ownership.js';
import { formatDate, formatTime } from '../lib/time.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/booking-form/BookingForm.jsx';
import Notice from '../components/booking-form/Notice.jsx';

const linkClass = 'font-medium text-brand-700 underline-offset-2 hover:underline';

// Surface: Edit booking, at /bookings/:bookingId/edit. Owner: Andrew Wehbe.
// Three people see three different things here, decided by asking isOwner ("is this mine?"):
// the owner gets the form, another student is told whose booking it is, and someone signed out is asked to sign in.
export default function EditBookingPage({ rooms, users, bookings, currentUser, simulation, updateBooking }) {
  const { bookingId } = useParams();
  const booking = bookings.find((b) => b.id === bookingId) ?? null;
  const { status, data, retry } = useSimulatedRequest(booking, simulation);
  const [savedAt, setSavedAt] = useState(null);   // when the last save happened: shows "Saved" and resets the form

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading the booking" rows={4} />;
  } else if (status === 'error') {
    content = <ErrorState message="We could not load this booking." onRetry={retry} />;
  } else if (status === 'empty') {
    content = (
      <EmptyState
        title="Booking not found"
        message="There is no booking at this address. The link may be wrong."
        action={<Link to="/bookings/new" className={linkClass}>Book a room</Link>}
      />
    );
  } else if (currentUser === null) {
    content = (
      <Notice
        title="Sign in to change this booking"
        message="Only the student who made a booking can change it. If it is yours, choose your name under Signed in as, at the top of the page."
      />
    );
  } else if (!isOwner(data, currentUser)) {
    const owner = users.find((u) => u.id === data.userId);
    content = (
      <Notice
        title="This is not your booking"
        message={`It belongs to ${owner ? owner.name : 'another student'}. Only they can change it.`}
        action={<Link to={`/bookings/${data.id}`} className={linkClass}>See the booking</Link>}
      />
    );
  } else if (effectiveStatus(data) !== 'confirmed') {
    content = (
      <Notice
        title={data.status === 'cancelled' ? 'This booking was cancelled' : 'This booking has ended'}
        message="Cancelled and past bookings stay as they were. Book a new slot instead."
        action={<Link to="/bookings/new" className={linkClass}>Book a room</Link>}
      />
    );
  } else if (new Date(data.start) <= new Date()) {
    content = (
      <Notice
        title="This booking has already started"
        message={`It runs until ${formatTime(data.end)}. A booking can be changed until it starts.`}
      />
    );
  } else {
    content = (
      <>
        {savedAt && (
          <p role="status" className="mb-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
            Changes saved at {formatTime(savedAt)}.
          </p>
        )}
        <BookingForm
          key={savedAt ?? 'first'}
          rooms={rooms}
          bookings={bookings}
          initialForm={bookingToForm(data)}
          bookingId={data.id}
          ownerId={data.userId}
          submitLabel="Save changes"
          onSave={(draft) => updateBooking(data.id, draft)}
          onSaved={() => setSavedAt(new Date().toISOString())}
        />
      </>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Change a booking</h1>
      {status === 'ready' && (
        <p className="mt-2 text-slate-600">
          {rooms.find((r) => r.id === data.roomId)?.name}, {formatDate(data.start)} at {formatTime(data.start)}
        </p>
      )}
      <div className="mt-6">{content}</div>
    </section>
  );
}
