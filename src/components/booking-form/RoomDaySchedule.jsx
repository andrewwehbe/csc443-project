import { Link } from 'react-router';
import { overlaps } from '../../lib/bookingRules.js';
import { dateKey, formatDate, formatTime, toISO } from '../../lib/time.js';

// What is already booked in the chosen room on the chosen day, so the user can pick a free slot.
// A booking that clashes with the times typed in the form is marked in red.
//   room       the chosen room, or null      date  'YYYY-MM-DD', or '' when not chosen
//   draft      the booking as typed so far, or null      bookingId  the booking being edited (left out of the list)
export default function RoomDaySchedule({ room, date, bookings, draft, bookingId }) {
  if (!room || !date) {
    return (
      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="text-base font-semibold">Already booked</h2>
        <p className="mt-2 text-sm text-slate-600">Choose a room and a date to see when the room is taken.</p>
      </section>
    );
  }

  const taken = bookings
    .filter((b) => b.roomId === room.id && b.id !== bookingId && b.status === 'confirmed' && dateKey(b.start) === date)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <section aria-labelledby="schedule-heading" className="rounded-xl border border-slate-200 p-4">
      <h2 id="schedule-heading" className="text-base font-semibold">Already booked</h2>
      <p className="mt-1 text-sm text-slate-600">
        <Link to={`/rooms/${room.id}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
          {room.name}
        </Link>{' '}
        on {formatDate(toISO(date, '12:00'))}
      </p>

      {taken.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Nothing yet. The whole day is free.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {taken.map((b) => {
            const clashes = draft !== null && overlaps(b, draft);
            const colours = clashes
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-slate-200 text-slate-700';
            return (
              <li
                key={b.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${colours}`}
              >
                <span className="tabular-nums">
                  {formatTime(b.start)} to {formatTime(b.end)}
                </span>
                {clashes && <span className="font-medium">Clashes with your time</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
