import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { headline, isFreeNow, openingState, roomsToShow } from '../lib/today.js';
import { roomStatus, statusChipClass } from '../lib/roomStatus.js';
import { MAX_MINUTES } from '../lib/bookingRules.js';
import { formatLongDay, shiftDay } from '../lib/availabilityFilters.js';
import { dateKey } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import DayTimeline, { TimelineLegend } from '../components/DayTimeline.jsx';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

// Surface: 01 Today, at / (design pack 01-today.html). Owner: Njteh Balian.
// What is free right now, the rooms you can still get today, and the three house rules.
// It is also the example of the pattern every data screen follows: get the data, pass it through
// useSimulatedRequest, then render one of the four states (loading, error, empty, the data).
// The list's span lives in the address (/?show=day), so Back and a reload keep it.

const RULES = [
  { figure: `${MAX_MINUTES / 60}h`, title: 'Maximum per booking', text: 'Long enough for a working session, short enough that rooms turn over.' },
  { figure: '1', title: 'Booking a day', text: 'So the same four people cannot hold a room every afternoon of the week.' },
  { figure: '0', title: 'Double bookings', text: 'Two confirmed bookings on one room may never overlap. Not by a minute.' },
];

const SPANS = {
  soon: { title: 'Free in the next two hours', other: { to: '/?show=day', label: 'Whole day' } },
  day: { title: 'Free at some point today', other: { to: '/', label: 'Next two hours' } },
};

// "Right now" moves on: check the clock again every minute while the page is open.
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function HomePage({ rooms, bookings, currentUser, simulation }) {
  const [searchParams] = useSearchParams();
  const span = searchParams.get('show') === 'day' ? 'day' : 'soon';
  const now = useNow();
  const today = dateKey(now);
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);

  // Until the rooms arrive the heading asks the question; once they do, it answers it.
  const [lead, rest] =
    status === 'ready' ? headline(data.filter((room) => isFreeNow(room, bookings, now)).length, now) : ['Which rooms are free', 'right now?'];
  const shown = status === 'ready' ? roomsToShow(data, bookings, span, currentUser, now) : [];

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading today's rooms" />;
  } else if (status === 'error') {
    content = (
      <ErrorState title="Today’s bookings would not load" message="The server did not answer. This usually passes in a moment." onRetry={retry} />
    );
  } else if (status === 'empty') {
    content = <EmptyState title="No rooms to show" message="The library has not listed any study rooms yet." />;
  } else if (shown.length === 0) {
    content = <NothingFree span={span} now={now} />;
  } else {
    content = (
      <>
        <ul className="space-y-3">
          {shown.map((room) => (
            <RoomRow key={room.id} room={room} bookings={bookings} today={today} now={now} currentUser={currentUser} />
          ))}
        </ul>
        <TimelineLegend />
      </>
    );
  }

  return (
    <div>
      <section className="rounded-xl border border-line bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{formatLongDay(today)} · open 08:00 to 22:00</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          {lead}<br />{rest}
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted">
          Two hours is the limit and one booking a day, so the room you take is a room somebody else cannot. Ghurfa exists to
          stop two groups walking into the same door.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/availability" className={buttonClass('primary')}>See today</Link>
          <Link to="/rooms" className={buttonClass('secondary')}>Browse the rooms</Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{SPANS[span].title}</h2>
          <Link to={SPANS[span].other.to} className="shrink-0 text-sm text-brand-700 underline decoration-accent-500 decoration-2 underline-offset-4">
            {SPANS[span].other.label}
          </Link>
        </div>
        <div className="mt-5">{content}</div>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-3">
        <h2 className="sr-only">The house rules</h2>
        {RULES.map(({ figure, title, text }) => (
          <div key={title} className="rounded-xl border border-line bg-surface p-6">
            <p className="font-display text-3xl font-semibold text-accent-600">{figure}</p>
            <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// One room: its name (the whole card links to it), size, status word and today's timeline.
function RoomRow({ room, bookings, today, now, currentUser }) {
  const roomBookings = bookings.filter((b) => b.roomId === room.id);
  const status = roomStatus(room, bookings, today, currentUser, now);
  const nothingBooked = !roomBookings.some((b) => b.status !== 'cancelled' && dateKey(b.start) === today);

  return (
    <li className="relative rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
          {/* after:inset-0 stretches the link over the card, so the whole card opens the room. */}
          <Link to={`/rooms/${room.id}`} className="after:absolute after:inset-0">{room.name}</Link>
        </h3>
        <p className="text-xs text-muted">{[`${room.capacity} people`, room.amenities.join(', ')].filter(Boolean).join(' · ')}</p>
        <span className="flex-1" />
        {status && <span className={statusChipClass(status.tone)}>{status.word}</span>}
      </div>
      {/* relative z-10: above the card's link, so a click on free time opens the booking popover */}
      <div className="relative z-10 mt-3">
        <DayTimeline bookings={roomBookings} date={today} currentUser={currentUser} bookRoomId={room.id} />
      </div>
      {nothingBooked && <p className="mt-1.5 text-xs text-muted">Nothing booked today.</p>}
    </li>
  );
}

// The list came back empty: say why, and offer the next place to look.
function NothingFree({ span, now }) {
  // Secondary: the hero's "See today" is the page's one primary button.
  const small = buttonClass('secondary', 'small');
  const wholeDay = <Link to="/?show=day" className={small}>See the whole day</Link>;
  const tomorrow = <Link to={`/availability?date=${shiftDay(dateKey(now), 1)}`} className={small}>See tomorrow</Link>;
  const hours = openingState(now);

  if (hours === 'after') {
    return <EmptyState title="Nothing more to book today" message="It opens again tomorrow at 08:00." action={tomorrow} />;
  }
  if (span === 'day') {
    return <EmptyState title="No room is free for the rest of today" message="Every room is booked until closing time." action={tomorrow} />;
  }
  if (hours === 'before') {
    return <EmptyState title="Nothing opens in the next two hours" message="The whole day shows what is free from 08:00." action={wholeDay} />;
  }
  return (
    <EmptyState title="No room is free in the next two hours" message="Every room is taken until later. The whole day shows when they free up." action={wholeDay} />
  );
}
