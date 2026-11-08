import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { AMENITIES } from '../data/rooms.js';
import { dayLabel, floorName, nextOwnBooking, parseWeek, weekDays, weekTitle, whenPhrase } from '../lib/roomDetail.js';
import { roomStatus, statusChipClass } from '../lib/roomStatus.js';
import { dateKey, formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import DayTimeline from '../components/DayTimeline.jsx';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

// Surface: Room detail, at /rooms/:roomId (design pack 03-room.html). Owner: Elio El Koussa.
// One room, its week as day timelines, and an action band that depends on who is looking.
// The week shown lives in the address (?week=1), so it can be shared and survives a reload.

const primary = buttonClass('primary', 'small');
const secondary = buttonClass('secondary', 'small');
const quiet = buttonClass('quiet', 'small');
// The shared buttons have no destructive kind, so this one keeps the pack's red button here.
const destructive = 'inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 bg-red-800 text-white hover:bg-red-900';
const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

export default function RoomPage({ rooms, bookings, currentUser, simulation, cancelBooking }) {
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const room = rooms.find((r) => r.id === roomId) ?? null;
  const { status, data, retry } = useSimulatedRequest(room, simulation);

  if (status === 'loading') return <LoadingState label="Loading the room" />;
  if (status === 'error') return <ErrorState message="We could not load this room." onRetry={retry} />;
  if (status === 'empty') {
    return (
      <EmptyState
        title="Room not found"
        message="There is no study room at this address."
        action={<Link to="/rooms" className={secondary}>See all rooms</Link>}
      />
    );
  }

  const week = parseWeek(searchParams.get('week'));
  const days = weekDays(week);
  const roomBookings = bookings.filter((b) => b.roomId === data.id);
  const showWeek = (offset) => setSearchParams(offset === 0 ? {} : { week: String(offset) });

  return (
    <article>
      <nav className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Ghurfa</Link> <span className="text-accent-600" aria-hidden="true">/</span>{' '}
        <span aria-current="page">{data.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{data.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {data.building}, {floorName(data.floor)} · seats {data.capacity} · {data.amenities.length > 0 ? data.amenities.join(', ') : 'no amenities'}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Amenities">
            {AMENITIES.map((amenity) => {
              const has = data.amenities.includes(amenity);
              const name = amenity[0].toUpperCase() + amenity.slice(1);
              return (
                <li key={amenity} className={statusChipClass(has ? 'free' : 'off')}>
                  {has ? name : `No ${amenity}`}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="w-full max-w-sm border border-line bg-surface p-1 sm:w-auto sm:min-w-72">
          <img
            src={`${import.meta.env.BASE_URL}${data.photo}`}
            alt={`Floor plan of ${data.name}: a table for ${data.capacity}`}
            className="aspect-[16/9] w-full bg-line/30 object-contain"
          />
        </div>
      </div>

      <ActionBand room={data} bookings={bookings} currentUser={currentUser} cancelBooking={cancelBooking} />

      <section className="mt-8" aria-labelledby="week-title">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="week-title" className="font-display text-2xl font-semibold tracking-tight text-ink">{weekTitle(week, days)}</h2>
          <span className="flex-1" />
          <button type="button" className={secondary} onClick={() => showWeek(week - 1)}>Previous week</button>
          {week !== 0 && <button type="button" className={quiet} onClick={() => showWeek(0)}>This week</button>}
          <button type="button" className={secondary} onClick={() => showWeek(week + 1)}>Next week</button>
        </div>

        <div className="mt-4 border border-line bg-surface p-5">
          <div className="hidden items-center gap-3 md:flex" aria-hidden="true">
            <span className="w-14 flex-none" />
            <div className="flex min-w-0 flex-1">
              {HOURS.map((hour) => (
                <div key={hour} className="flex-1 border-l border-line pl-1 font-mono text-[10px] tabular-nums text-muted/70">{hour}</div>
              ))}
            </div>
          </div>
          <div className="mt-1 space-y-6 md:space-y-2">
            {days.map((day, i) => (
              <div key={day} className="md:flex md:items-start md:gap-3">
                {/* Lined up with the bar (h-8), not centred on the whole block: the last day also holds the legend. */}
                <span className="hidden h-8 w-14 flex-none items-center font-mono text-xs tabular-nums text-muted md:flex" aria-hidden="true">{dayLabel(day)}</span>
                <div className="min-w-0 flex-1">
                  <DayTimeline
                    bookings={roomBookings}
                    date={day}
                    currentUser={currentUser}
                    hours={false}
                    legend={i === days.length - 1}
                    label={`${data.name} · ${dayLabel(day)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}

// The band under the room's header. What it offers depends on who is looking, asked per booking with isOwner.
function ActionBand({ room, bookings, currentUser, cancelBooking }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const band = 'mt-6 flex flex-wrap items-center gap-3 border border-ink/20 bg-brand-50 px-5 py-4';
  const now = new Date();

  if (room.status === 'out-of-service') {
    return (
      <div className={band}>
        <span className="text-sm text-ink">This room is out of service and cannot be booked.</span>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className={band}>
        <span className="text-sm text-ink">Sign in to book a room.</span>
        <span className="flex-1" />
        <Link to="/sign-in" className={secondary}>Sign in</Link>
      </div>
    );
  }

  const mine = nextOwnBooking(room.id, bookings, currentUser, now);
  if (mine) {
    const when = `${whenPhrase(mine.start, now)}, ${formatTime(mine.start)} to ${formatTime(mine.end)}`;
    function cancel() {
      const result = cancelBooking(mine.id);
      setConfirming(false);
      setMessage(result.ok ? `Your booking ${when} was cancelled.` : result.problems[0].message);
    }
    return (
      <div className={band}>
        {confirming ? (
          <>
            <span className="text-sm text-ink" role="alert">Cancel your booking {when}? This cannot be undone.</span>
            <span className="flex-1" />
            {/* Focus moves here so a keyboard user lands on the safe choice, not the destructive one. */}
            <button type="button" className={quiet} onClick={() => setConfirming(false)} autoFocus>Keep it</button>
            <button type="button" className={destructive} onClick={cancel}>Yes, cancel it</button>
          </>
        ) : (
          <>
            <span className="text-sm text-ink">
              {message && <span role="status" className="mb-1 block">{message}</span>}
              <strong className="font-semibold">You have this room {when}.</strong>
            </span>
            <span className="flex-1" />
            <Link to={`/bookings/${mine.id}/edit`} className={secondary}>Change the time</Link>
            <button type="button" className={destructive} onClick={() => setConfirming(true)}>Cancel booking</button>
          </>
        )}
      </div>
    );
  }

  const today = roomStatus(room, bookings, dateKey(now.toISOString()), currentUser, now);
  return (
    <div className={band}>
      <span className="text-sm text-ink">
        {message && <span role="status" className="mb-1 block font-semibold">{message}</span>}
        {today ? `${today.word} today.` : 'Closed for the rest of today.'}
      </span>
      <span className="flex-1" />
      <Link to={`/bookings/new?room=${room.id}`} className={primary}>Book this room</Link>
    </div>
  );
}
