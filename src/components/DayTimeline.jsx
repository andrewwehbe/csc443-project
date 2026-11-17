import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DAY_END, DAY_START, daySegments, hourRows, minuteOfDay, overlayPosition, rangeLabel, rangeTitle } from '../lib/timeline.js';
import { clock, freeStretchAt, quickRange } from '../lib/quickBook.js';
import { buttonClass } from '../lib/buttons.js';
import { dateKey, formatTime } from '../lib/time.js';
import { isOwner } from '../lib/ownership.js';

// One room's day, 08:00-22:00, as in the design pack's components.html. Shared by Today, Availability,
// Room detail, The floor and the booking form, so each passes its own bookings and day.
//   <DayTimeline bookings={roomBookings} date="2026-11-12" currentUser={currentUser} />
//   <DayTimeline bookings={roomBookings} date={form.date} currentUser={currentUser} chosen={{ start, end }} clash={hasClash} legend />
// bookings    the bookings of ONE room (any day; only `date`'s are drawn, cancelled ones are skipped)
// date        'YYYY-MM-DD'
// currentUser who is looking, or null: their own bookings show as "yours"; nobody else's name is ever shown
// chosen      { start, end } ISO strings of a time being picked, drawn on top of the bookings (optional)
// clash       true when `chosen` breaks the overlap rule: it is then drawn in red over the booking it hits
// hours       show the 08 … 21 header above the bar (default true)
// legend      show the colour key under the bar (default false)
// label       a name for the day, e.g. "B-204 · Wednesday": heading of the phone list and the screen-reader list
// bookRoomId  the room's id to make free time clickable: a click on the bar offers "Book 14:00 to 16:00" in a
//             small popover (adapted from 21st.dev/@pearpages/popover); on phones each free hour is a link
// From md up it is a bar; below md a list of hours, because a 14-hour bar is unreadable on a phone and
// nothing may scroll sideways. Screen readers get a plain list of the bookings, never colours alone.

const segmentClass = 'flex h-full items-center justify-center overflow-hidden rounded-sm px-1 text-[11px] font-medium leading-none';
const kindClass = {
  booked: 'bg-brand-200 text-brand-900',
  yours: 'bg-brand-800 text-paper',
};
const overlayClass = {
  chosen: 'bg-accent-100 font-medium text-accent-900 ring-2 ring-inset ring-accent-500',
  clash: 'bg-red-100/90 font-semibold text-red-900 ring-2 ring-inset ring-red-600',
};
const rowClass = {
  free: 'border border-line bg-paper text-muted',
  booked: 'bg-brand-200 text-brand-900',
  yours: 'bg-brand-800 text-paper',
  chosen: 'bg-accent-100 text-accent-900 ring-2 ring-inset ring-accent-500',
  clash: 'bg-red-100 text-red-900 ring-2 ring-inset ring-red-600',
};
const rowWord = { free: 'Free', booked: 'Booked', yours: 'Yours', chosen: 'Being chosen', clash: 'Clashes' };
const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

export default function DayTimeline({ bookings, date, currentUser, chosen = null, clash = false, hours = true, legend = false, label, bookRoomId }) {
  const [offer, setOffer] = useState(null);   // the popover: { left, start, end, from, to } in % and minutes
  const now = new Date();
  const today = dateKey(now);
  // Where "now" falls on this day: a past day is all gone, a later day not started.
  const nowMinute = date === today ? minuteOfDay(now) : date < today ? DAY_END : -1;
  const canBook = Boolean(bookRoomId) && date >= today;
  // Only the day's bookings that hold the room. Completed ones still held it, so they stay.
  const blocks = bookings
    .filter((b) => b.status !== 'cancelled' && dateKey(b.start) === date)
    .map((b) => ({ id: b.id, start: b.start, end: b.end, kind: isOwner(b, currentUser) ? 'yours' : 'booked' }));
  const parts = daySegments(blocks);
  const overlay = chosen && overlayPosition(chosen.start, chosen.end);
  const overlayKind = clash ? 'clash' : 'chosen';
  // The time already gone is shaded (on today, up to a line marking now), so past time never reads as free.
  const pastShare = nowMinute > DAY_START ? (Math.min(nowMinute, DAY_END) - DAY_START) / (DAY_END - DAY_START) * 100 : 0;
  // Phones list only the hours still ahead: all fourteen on a later day, none on a past one.
  const rows = hourRows(blocks, overlay && { ...chosen, clash }).filter((row) => minuteOfDay(`${date}T${row.hour}`) + 60 > nowMinute);

  // A click on free time: where on the bar it landed, as a minute of the day, then the booking to offer there.
  function openOffer(e) {
    const bar = e.currentTarget.parentElement.getBoundingClientRect();
    const share = (e.clientX - bar.left) / bar.width;
    const minute = DAY_START + share * (DAY_END - DAY_START);
    const stretch = freeStretchAt(blocks, minute);
    const range = stretch && quickRange(stretch, minute, nowMinute);
    setOffer(range ? { left: share * 100, ...range, ...stretch } : null);
  }
  const bookHref = (start, end) => `/bookings/new?room=${bookRoomId}&date=${date}&start=${clock(start)}&end=${clock(end)}`;

  return (
    <div>
      {/* From md up: the bar. Hidden from screen readers, which get the list after it. */}
      <div className="relative hidden md:block">
        <div aria-hidden="true">
          {hours && (
            <div className="flex">
              {HOURS.map((hour) => (
                <div key={hour} className="flex-1 border-l border-line pl-1 font-mono text-[10px] tabular-nums text-muted/70">{hour}</div>
              ))}
            </div>
          )}
          <div className="@container relative h-8 overflow-hidden rounded-md border border-line bg-paper p-0.5">
            <div className="flex h-full gap-px">
              {parts.map((part, i) =>
                part.type === 'gap' ? (
                  canBook ? (
                    // tabIndex -1: the mouse can click free time; keyboard users book from the page's buttons
                    <button key={`gap-${i}`} type="button" tabIndex={-1} onClick={openOffer} className="h-full cursor-pointer rounded-sm hover:bg-brand-50" style={{ width: `${part.width}%` }} />
                  ) : (
                    <div key={`gap-${i}`} className="h-full" style={{ width: `${part.width}%` }} />
                  )
                ) : (
                  <div
                    key={part.id}
                    className={`${segmentClass} ${kindClass[part.kind]}`}
                    style={{ width: `${part.width}%` }}
                    title={rangeTitle(part.from, part.to)}
                  >
                    {/* A bar narrower than 24rem (a card on The floor) has no room for labels, which would wrap
                        over each other, so it shows none; otherwise one line, cut with an ellipsis if it must be.
                        The title and the screen-reader list below still give every time in words. */}
                    <span className="hidden min-w-0 truncate @sm:inline">{part.kind === 'yours' ? 'yours' : rangeLabel(part.from, part.to)}</span>
                  </div>
                )
              )}
            </div>
            {pastShare > 0 && (
              <div className={`pointer-events-none absolute inset-y-0 left-0 bg-ink/10 ${pastShare < 100 ? 'border-r-2 border-accent-500' : ''}`}
                style={{ width: `${pastShare}%` }} />
            )}
            {/* Drawn on top of the bookings, not beside them, so an overlap is literally visible. */}
            {overlay && (
              <div
                className={`absolute inset-y-0.5 flex items-center justify-center overflow-hidden rounded-sm px-1 text-[11px] leading-none ${overlayClass[overlayKind]}`}
                style={{ left: `${overlay.left}%`, width: `${overlay.width}%` }}
                title={rangeTitle(overlay.from, overlay.to)}
              >
                <span className="hidden min-w-0 truncate @sm:inline">{rangeLabel(overlay.from, overlay.to)}</span>
              </div>
            )}
          </div>
        </div>
        {offer && <BookOffer offer={offer} href={bookHref(offer.start, offer.end)} onClose={() => setOffer(null)} />}
        <TimelineText blocks={blocks} chosen={overlay && { ...chosen, kind: overlayKind }} label={label} />
      </div>

      {/* Below md: one row per hour. */}
      <div className="md:hidden">
        {label && <p className="mb-3 font-display text-base font-semibold text-ink">{label}</p>}
        {rows.length === 0 && <p className="text-xs text-muted">This day is over.</p>}
        <ul className="space-y-1">
          {rows.map((row) => (
            <li key={row.hour} className="flex items-stretch gap-2">
              <span className="w-11 flex-none pt-1 font-mono text-[11px] tabular-nums text-muted">{row.hour}</span>
              {canBook && row.kind === 'free' && minuteOfDay(`${date}T${row.hour}`) > nowMinute ? (
                <Link to={bookHref(minuteOfDay(`${date}T${row.hour}`), minuteOfDay(`${date}T${row.hour}`) + 60)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs ${rowClass.free} hover:border-brand-400 hover:text-ink`}>
                  Free · <span className="font-semibold text-brand-700 underline underline-offset-2">book {row.hour}</span>
                </Link>
              ) : (
                <span className={`flex-1 rounded-md px-2 py-1.5 text-xs ${rowClass[row.kind]}`}>
                  {rowWord[row.kind]}{row.until && ` · until ${row.until}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {legend && <div className="mt-5 border-t border-line pt-4"><TimelineLegend picking={Boolean(chosen)} canBook={canBook} /></div>}
    </div>
  );
}

// The colour key. A screen with one bar per room puts it once next to the list: <TimelineLegend canBook />.
// It names only what can be on the screen: "Being chosen" and "Clashes" only where a time is being picked.
// canBook adds the hint that free time is clickable (bars only, so not on phones).
export function TimelineLegend({ picking = false, canBook = false }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
      <span aria-hidden="true" className="flex items-center gap-2"><span className="h-3 w-7 rounded-sm border border-line bg-paper" />Free</span>
      <span aria-hidden="true" className="flex items-center gap-2"><span className="h-3 w-7 rounded-sm bg-brand-200" />Booked by someone else</span>
      <span aria-hidden="true" className="flex items-center gap-2"><span className="h-3 w-7 rounded-sm bg-brand-800" />Yours</span>
      <span aria-hidden="true" className="hidden items-center gap-2 md:flex"><span className="h-3 w-7 rounded-sm border-r-2 border-accent-500 bg-ink/10" />Past</span>
      {picking && <span aria-hidden="true" className="flex items-center gap-2"><span className="h-3 w-7 rounded-sm bg-accent-100 ring-2 ring-inset ring-accent-500" />Being chosen</span>}
      {picking && <span aria-hidden="true" className="flex items-center gap-2"><span className="h-3 w-7 rounded-sm bg-red-100 ring-2 ring-inset ring-red-600" />Clashes</span>}
      {canBook && <span className="hidden font-medium text-ink md:inline">Click free time on a bar to book it.</span>}
    </div>
  );
}

// The popover under the bar after a click on free time. Escape or a click outside closes it.
function BookOffer({ offer, href, onClose }) {
  const boxRef = useRef(null);
  useEffect(() => {
    boxRef.current.querySelector('a').focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => { if (!boxRef.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [onClose]);

  return (
    <div ref={boxRef} role="dialog" aria-label="Book this time" className="pop-in absolute z-20 mt-2 w-60 origin-top -translate-x-1/2 rounded-xl border border-line bg-surface p-4 text-sm ring-1 ring-ink/5"
      style={{ left: `${Math.min(Math.max(offer.left, 14), 86)}%` }}>
      <p className="text-xs text-muted">Free {clock(offer.from)} to {clock(offer.to)}</p>
      <div className="mt-3 flex items-center gap-2">
        <Link to={href} className={buttonClass('primary', 'small')}>Book {clock(offer.start)} to {clock(offer.end)}</Link>
        <button type="button" onClick={onClose} className={buttonClass('quiet', 'small')}>Close</button>
      </div>
    </div>
  );
}

// What a screen reader announces instead of the bar: each booking as words, in time order.
function TimelineText({ blocks, chosen, label }) {
  const sorted = [...blocks].sort((a, b) => new Date(a.start) - new Date(b.start));
  const range = (b) => `${formatTime(b.start)} to ${formatTime(b.end)}`;
  return (
    <ul className="sr-only" aria-label={label ? `${label}, 08:00 to 22:00` : 'The day, 08:00 to 22:00'}>
      {sorted.length === 0 && <li>Free all day</li>}
      {sorted.map((b) => (
        <li key={b.id}>{range(b)}: {b.kind === 'yours' ? 'your booking' : 'booked'}</li>
      ))}
      {chosen && <li>{chosen.kind === 'clash' ? 'Clashes with a booking' : 'Being chosen'}: {range(chosen)}</li>}
    </ul>
  );
}
