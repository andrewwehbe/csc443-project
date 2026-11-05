import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { newBookingForm } from '../lib/bookingForm.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';
import BookingForm from '../components/booking-form/BookingForm.jsx';
import BookingSummary from '../components/booking-form/BookingSummary.jsx';
import Notice from '../components/booking-form/Notice.jsx';

const linkButton =
  'inline-block rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700';

// Surface: New booking, at /bookings/new. Owner: Andrew Wehbe.
// Other screens can open it already filled in: /bookings/new?room=r3&date=2026-11-06&start=14:00&end=15:00
export default function NewBookingPage({ rooms, bookings, currentUser, simulation, addBooking }) {
  const [searchParams] = useSearchParams();
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);
  const [created, setCreated] = useState(null);   // the booking just made, shown as a confirmation
  const [formKey, setFormKey] = useState(0);       // a new key gives a fresh form ("Book another room")

  const prefill = {
    room: searchParams.get('room'),
    date: searchParams.get('date'),
    start: searchParams.get('start'),
    end: searchParams.get('end'),
  };

  function bookAnother() {
    setCreated(null);
    setFormKey((key) => key + 1);
  }

  let content;
  if (currentUser === null) {
    content = (
      <Notice
        title="Sign in to book a room"
        message="A booking belongs to the student who makes it. Choose your name under Signed in as, at the top of the page."
      />
    );
  } else if (status === 'loading') {
    content = <LoadingState label="Loading rooms" rows={4} />;
  } else if (status === 'error') {
    content = <ErrorState message="We could not load the rooms, so the form cannot open." onRetry={retry} />;
  } else if (status === 'empty') {
    content = <EmptyState title="No rooms to book" message="The library has not listed any study rooms yet." />;
  } else if (created) {
    const room = data.find((r) => r.id === created.roomId);
    content = (
      <div role="status" className="rounded-xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="text-lg font-semibold text-brand-800">Booked. The room is yours.</h2>
        <div className="mt-4">
          <BookingSummary booking={created} room={room} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/bookings/${created.id}`} className={`${linkButton} bg-brand-700 text-white hover:bg-brand-800`}>
            See the booking
          </Link>
          <Link to={`/bookings/${created.id}/edit`} className={`${linkButton} border border-brand-600 bg-white text-brand-800 hover:bg-brand-100`}>
            Change it
          </Link>
          <button type="button" onClick={bookAnother} className={`${linkButton} text-brand-800 hover:bg-brand-100`}>
            Book another room
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <BookingForm
        key={formKey}
        rooms={data}
        bookings={bookings}
        initialForm={newBookingForm(prefill, data)}
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
      <p className="mt-2 text-slate-600">Pick a room and a time. The house rules are checked as you type, before you book.</p>
      <div className="mt-6">{content}</div>
    </section>
  );
}
