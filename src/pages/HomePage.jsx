import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSimulatedRequest } from '../hooks/useSimulatedRequest.js';
import { headline, isFreeNow } from '../lib/today.js';
import { MAX_MINUTES } from '../lib/bookingRules.js';
import { formatLongDay } from '../lib/availabilityFilters.js';
import { dateKey } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';
import { CalendarPlus } from 'lucide-react';
import Icon from '../components/Icon.jsx';
import RoomFinder from '../components/RoomFinder.jsx';
import LoadingState from '../components/states/LoadingState.jsx';
import EmptyState from '../components/states/EmptyState.jsx';
import ErrorState from '../components/states/ErrorState.jsx';

// Surface: 01 Today, at / (design pack 01-today.html). Owner: Njteh Balian.
// What is free right now, a calendar of the week to find a room by time (RoomFinder), and the house rules.
// It is also the example of the pattern every data screen follows: get the data, pass it through
// useSimulatedRequest, then render one of the four states (loading, error, empty, the data).
// The calendar's pick lives in the address (/?day=…&at=…&for=…), so Back and a reload keep it.

const RULES = [
  { figure: `${MAX_MINUTES / 60}h`, title: 'Maximum per booking', text: 'Long enough for a working session, short enough that rooms turn over.' },
  { figure: '1', title: 'Upcoming booking a day', text: 'So the same four people cannot hold a room every afternoon of the week.' },
  { figure: '0', title: 'Double bookings', text: 'Two confirmed bookings on one room may never overlap. Not by a minute.' },
];

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
  const now = useNow();
  const today = dateKey(now);
  const { status, data, retry } = useSimulatedRequest(rooms, simulation);

  // Until the rooms arrive the heading asks the question; once they do, it answers it.
  const [lead, rest] =
    status === 'ready' ? headline(data.filter((room) => isFreeNow(room, bookings, now)).length, now) : ['Which rooms are free', 'right now?'];

  let content;
  if (status === 'loading') {
    content = <LoadingState label="Loading today's rooms" />;
  } else if (status === 'error') {
    content = (
      <ErrorState title="Today’s bookings would not load" message="The server did not answer. This usually passes in a moment." onRetry={retry} />
    );
  } else if (status === 'empty') {
    content = <EmptyState title="No rooms to show" message="The library has not listed any study rooms yet." />;
  } else {
    content = <RoomFinder rooms={data} bookings={bookings} currentUser={currentUser} today={today} now={now} />;
  }

  return (
    <div>
      <section className="rounded-xl border border-line bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{formatLongDay(today)} · open 08:00 to 22:00</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          {lead}<br />{rest}
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted">
          Two hours is the limit and one upcoming booking a day, so the room you take is a room somebody else cannot. Ghurfa
          exists to stop two groups walking into the same door.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {/* Booking is what people come for, so it is the page's one primary (the header hides its own here). */}
          <Link to="/bookings/new" className={buttonClass('primary')}><Icon icon={CalendarPlus} size="sm" />Book a room</Link>
          <a href="#when" className={buttonClass('secondary')}>Pick a time</a>
        </div>
      </section>

      <section id="when" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">When do you need a room?</h2>
        <div className="mt-4">{content}</div>
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
