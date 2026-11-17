import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { finderParams, hasBegun, LENGTHS, nextDays, openRooms, ownBookingOn, readFinder, startTimes } from '../lib/findTime.js';
import { clock } from '../lib/quickBook.js';
import { formatDuration, formatTime } from '../lib/time.js';
import { buttonClass } from '../lib/buttons.js';

// Today's room finder: a week of hours as a calendar, each slot saying how many rooms are open then.
// Pick a slot and the rooms open for it are listed beside it, each with Book (the form opens filled in).
//   <RoomFinder rooms={rooms} bookings={bookings} currentUser={currentUser} today="2026-11-17" now={now} />
// From md up the calendar is a grid (days across, hours down); on a phone it is a row of days and a list
// of that day's hours. The calendar is one stop for Tab, and the arrow keys move the pick, as in TimeSlotPicker.

const dayName = (day, today) =>
  day === today ? 'Today' : new Date(`${day}T12:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
const lengthWord = { 60: '1 h', 90: '1 h 30', 120: '2 h' };

export default function RoomFinder({ rooms, bookings, currentUser, today, now }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pick = readFinder(searchParams, today, now);
  const days = nextDays(today);
  const starts = startTimes(pick.length);
  const cellRefs = useRef({});

  // replace: Back leaves the page instead of stepping back through every slot looked at.
  const choose = (changes) => setSearchParams(finderParams({ ...pick, ...changes }), { replace: true });
  const open = (day, start) => openRooms(rooms, bookings, day, start, pick.length, now);
  const picked = open(pick.day, pick.start);
  const mine = ownBookingOn(bookings, currentUser, pick.day, now);
  const end = pick.start + pick.length;

  // Arrows move the pick: left and right change the day, up and down the hour, skipping slots that have begun.
  function handleKey(e) {
    const [dx, dy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key] ?? [0, 0];
    if (dx === 0 && dy === 0) return;
    e.preventDefault();
    let d = days.indexOf(pick.day);
    let s = starts.indexOf(pick.start);
    do {
      d += dx;
      s += dy;
      if (!days[d] || starts[s] === undefined) return;   // the edge of the calendar: stay put
    } while (hasBegun(days[d], starts[s], now));
    choose({ day: days[d], start: starts[s] });
    requestAnimationFrame(() => cellRefs.current[`${days[d]} ${starts[s]}`]?.focus());
  }

  // One slot as a button (a plain function, not a component, so React keeps the same button between
  // renders and the focus stays on it). `wide` is the phone's list row, which spells the time out.
  function slot(day, start, wide = false) {
    const count = open(day, start).length;
    const begun = hasBegun(day, start, now);
    const chosen = day === pick.day && start === pick.start;
    const words = begun ? 'Past' : count === 0 ? 'Full' : `${count} free`;
    return (
      <button key={`${day} ${start}`} type="button" ref={(el) => { cellRefs.current[`${day} ${start}`] = el; }}
        disabled={begun} aria-pressed={chosen} tabIndex={chosen ? 0 : -1} onKeyDown={handleKey} onClick={() => choose({ day, start })}
        aria-label={`${dayName(day, today)} ${clock(start)}: ${begun ? 'already begun' : count === 0 ? 'no room open' : `${count} rooms open`}`}
        className={`rounded-md border text-xs tabular-nums ${wide ? 'flex h-11 w-full items-center justify-between px-3' : 'h-9 w-full'} ${
          chosen ? 'border-accent-500 bg-accent-100 font-semibold text-accent-900 ring-2 ring-inset ring-accent-500'
            : begun ? 'border-transparent bg-paper text-muted/40'
              : count === 0 ? 'border-line bg-paper text-muted'
                : 'border-line bg-surface text-ink hover:border-brand-400'}`}>
        {wide ? <><span className="font-mono">{clock(start)} to {clock(start + pick.length)}</span><span>{words}</span></> : words}
      </button>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Pick when you need it. Each slot counts the rooms still open for that long.</p>
          <div role="group" aria-label="How long" className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
            {LENGTHS.map((length) => (
              <button key={length} type="button" aria-pressed={length === pick.length} onClick={() => choose({ length })}
                className={`rounded-md px-3 py-1.5 ${length === pick.length ? 'bg-brand-50 font-semibold text-brand-900' : 'text-muted hover:text-ink'}`}>
                {lengthWord[length]}
              </button>
            ))}
          </div>
        </div>

        {/* md and up: the week as a grid. */}
        <div role="group" aria-label="Calendar: days across, start times down" className="mt-4 hidden grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 md:grid">
          <span />
          {days.map((day) => (
            <span key={day} className={`pb-1 text-center text-xs ${day === pick.day ? 'font-semibold text-ink' : 'text-muted'}`}>{dayName(day, today)}</span>
          ))}
          {starts.map((start) => (
            <div key={start} className="contents">
              <span className="flex items-center font-mono text-[11px] tabular-nums text-muted">{clock(start)}</span>
              {days.map((day) => slot(day, start))}
            </div>
          ))}
        </div>

        {/* Phones: the days as a row, then that day's hours as a list. */}
        <div className="mt-4 md:hidden">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Day">
            {days.map((day) => (
              <button key={day} type="button" aria-pressed={day === pick.day} onClick={() => choose({ day })}
                className={`h-11 rounded-lg border px-3 text-sm ${day === pick.day ? 'border-accent-500 bg-accent-100 font-semibold text-accent-900' : 'border-line bg-surface text-ink'}`}>
                {dayName(day, today)}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1.5" role="group" aria-label={`Start times, ${dayName(pick.day, today)}`}>
            {/* Only the hours still ahead: a phone list of past hours is just scrolling. */}
            {starts.filter((start) => !hasBegun(pick.day, start, now)).map((start) => slot(pick.day, start, true))}
          </div>
        </div>
      </div>

      {/* The answer: which rooms are open for the picked slot. */}
      <section aria-live="polite" className="self-start rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-6">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
          {dayName(pick.day, today)}, {clock(pick.start)} to {clock(end)}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {picked.length === 0 ? 'No room is open for the whole of this time.' : `${picked.length} ${picked.length === 1 ? 'room is' : 'rooms are'} open for ${formatDuration(pick.length)}.`}
        </p>
        {mine && (
          <p className="mt-3 rounded-lg border-l-4 border-accent-500 bg-accent-50 p-3 text-xs text-accent-900">
            You already have a room that day, {formatTime(mine.start)} to {formatTime(mine.end)}. One upcoming booking a day: change or cancel that one in My bookings first.
          </p>
        )}
        {picked.length === 0 ? (
          <p className="mt-4 text-sm text-ink">Pick another hour, or a shorter time.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {picked.map((room) => (
              <li key={room.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <Link to={`/rooms/${room.id}`} className="font-display text-base font-semibold tracking-tight text-ink hover:underline">{room.name}</Link>
                  <span className="block text-xs text-muted">{[`${room.capacity} seats`, room.amenities.join(', ')].filter(Boolean).join(' · ')}</span>
                </span>
                <Link to={`/bookings/new?room=${room.id}&date=${pick.day}&start=${clock(pick.start)}&end=${clock(end)}`} className={buttonClass('secondary', 'small')}>Book</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
