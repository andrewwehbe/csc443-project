import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { formatTime } from '../lib/time.js';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

// Landing page: which rooms are free at this moment. It also shows the pattern every data screen follows:
// get the data, pass it through useSimulatedRequest, then render one of the four states.
export default function HomePage({ rooms, bookings, simulation }) {
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);
  const now = new Date();

  // The confirmed booking that is running right now in this room, or undefined.
  const currentBooking = (room) =>
    bookings.find((b) => b.roomId === room.id && b.status === 'confirmed' && new Date(b.start) <= now && now < new Date(b.end));

  return (
    <section>
      <h1 className="text-2xl font-semibold">Study Room Booking</h1>
      <p className="mt-2 text-muted">See which library study rooms are free and book one for your group.</p>

      <h2 className="mt-8 text-lg font-semibold">Right now</h2>
      <div className="mt-3">
        {status === 'loading' && <LoadingState label="Loading rooms" />}
        {status === 'error' && <ErrorState message="We could not load the rooms." onRetry={retry} />}
        {status === 'empty' && <EmptyState title="No rooms to show" message="The library has not listed any study rooms yet." />}
        {status === 'ready' && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((room) => {
              const running = currentBooking(room);
              return (
                <li key={room.id} className="overflow-hidden rounded-xl border border-line">
                  <img
                    src={`${import.meta.env.BASE_URL}${room.photo}`}
                    alt={`Floor plan of ${room.name}: a table for ${room.capacity}`}
                    className="aspect-[40/26] w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-medium">{room.name}</p>
                    <p className="text-sm text-muted">{room.building}, floor {room.floor} · {room.capacity} seats</p>
                    <p className={`mt-2 text-sm font-medium ${running ? 'text-amber-700' : 'text-brand-700'}`}>
                      {running ? `Booked until ${formatTime(running.end)}` : 'Free now'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
