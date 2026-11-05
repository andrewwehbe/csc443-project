import { Link } from 'react-router';
import { formatDate, formatDuration, formatTime, minutesBetween } from '../../lib/time.js';

// A booking's details as a read-only list: shown after a booking is made.
export default function BookingSummary({ booking, room }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-slate-500">Room</dt>
        <dd className="font-medium text-slate-900">
          <Link to={`/rooms/${room.id}`} className="text-brand-700 underline-offset-2 hover:underline">
            {room.name}
          </Link>
          <span className="font-normal text-slate-600">, {room.building}, floor {room.floor}</span>
        </dd>
      </div>
      <div>
        <dt className="text-slate-500">When</dt>
        <dd className="font-medium text-slate-900">
          {formatDate(booking.start)}, {formatTime(booking.start)} to {formatTime(booking.end)}
          <span className="font-normal text-slate-600"> ({formatDuration(minutesBetween(booking.start, booking.end))})</span>
        </dd>
      </div>
      <div>
        <dt className="text-slate-500">People</dt>
        <dd className="font-medium text-slate-900">{booking.attendees}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Purpose</dt>
        <dd className="font-medium text-slate-900">{booking.purpose}</dd>
      </div>
    </dl>
  );
}
