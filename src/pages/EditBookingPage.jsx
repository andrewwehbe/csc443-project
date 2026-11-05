import { useState } from 'react';
import { useParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { bookingToForm } from '../lib/bookingForm.js';
import { isOwner } from '../lib/ownership.js';
import { formatTime } from '../lib/time.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/BookingForm.jsx';

// Surface: Edit booking, at /bookings/:bookingId/edit. Owner: Andrew Wehbe.
// The owner gets the form; another student and someone signed out get a message. isOwner decides.
export default function EditBookingPage({ rooms, users, bookings, currentUser, simulation, updateBooking }) {
  const { bookingId } = useParams();
  const booking = bookings.find((b) => b.id === bookingId);
  const { status, data, retry } = useSimulatedRequest(booking, simulation);
  const [savedAt, setSavedAt] = useState(null);   // when the last save happened

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading the booking" />;
  } else if (status === 'error') {
    content = <ErrorState message="We could not load this booking." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="Booking not found" message="There is no booking at this address." />;
  } else if (currentUser === null) {
    content = <EmptyState title="Sign in to change this booking" message="Only the student who made it can change it." />;
  } else if (!isOwner(data, currentUser)) {
    const owner = users.find((u) => u.id === data.userId);
    content = <EmptyState title="This is not your booking" message={`It belongs to ${owner.name}. Only they can change it.`} />;
  } else if (data.status !== 'confirmed' || new Date(data.start) <= new Date()) {
    content = <EmptyState title="This booking can no longer change" message="Cancelled, past and started bookings stay as they are." />;
  } else {
    content = (
      <>
        {savedAt && <p role="status" className="mb-6 rounded-xl bg-brand-50 p-4 text-brand-800">Changes saved at {formatTime(savedAt)}.</p>}
        <BookingForm
          key={savedAt}
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
      <div className="mt-6">{content}</div>
    </section>
  );
}
