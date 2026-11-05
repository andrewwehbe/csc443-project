import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { emptyForm } from '../lib/bookingForm.js';
import { formatDate, formatTime } from '../lib/time.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/BookingForm.jsx';

// Surface: New booking, at /bookings/new. Owner: Andrew Wehbe.
export default function NewBookingPage({ rooms, bookings, currentUser, simulation, addBooking }) {
  const [searchParams] = useSearchParams();
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);
  const [created, setCreated] = useState(null);   // the booking just made

  let content;
  if (currentUser === null) {
    content = <EmptyState title="Sign in to book a room" message="Choose your name under Signed in as, at the top of the page." />;
  } else if (status === 'loading') {
    content = <LoadingState label="Loading rooms" />;
  } else if (status === 'error') {
    content = <ErrorState message="We could not load the rooms." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="No rooms to book" message="The library has not listed any study rooms yet." />;
  } else if (created) {
    const room = data.find((r) => r.id === created.roomId);
    content = (
      <div role="status" className="rounded-xl bg-brand-50 p-4 text-brand-800">
        <p>
          Booked {room.name} for {formatDate(created.start)}, {formatTime(created.start)} to {formatTime(created.end)}.
        </p>
        <p className="mt-2 flex gap-4 font-medium">
          <Link to={`/bookings/${created.id}/edit`} className="underline">Change it</Link>
          <button type="button" onClick={() => setCreated(null)} className="underline">Book another</button>
        </p>
      </div>
    );
  } else {
    content = (
      <BookingForm
        rooms={data}
        bookings={bookings}
        initialForm={emptyForm(searchParams)}
        bookingId={null}
        ownerId={currentUser.id}
        submitLabel="Book this room"
        onSave={addBooking}
        onSaved={setCreated}
      />
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Book a room</h1>
      <div className="mt-6">{content}</div>
    </section>
  );
}
