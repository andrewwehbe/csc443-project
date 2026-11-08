import { daySegments, hourRows, overlayPosition, rangeLabel, rangeTitle } from '../lib/timeline.js';
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
// From md up it is a bar; below md a list of hours, because a 14-hour bar is unreadable on a phone and
// nothing may scroll sideways. Screen readers get a plain list of the bookings, never colours alone.

const segmentClass = 'flex h-full items-center justify-center overflow-hidden rounded-[1px] px-1 text-[11px] font-medium leading-none';
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

export default function DayTimeline({ bookings, date, currentUser, chosen = null, clash = false, hours = true, legend = false, label }) {
  // Only the day's bookings that hold the room. Completed ones still held it, so they stay.
  const blocks = bookings
    .filter((b) => b.status !== 'cancelled' && dateKey(b.start) === date)
    .map((b) => ({ id: b.id, start: b.start, end: b.end, kind: isOwner(b, currentUser) ? 'yours' : 'booked' }));
  const parts = daySegments(blocks);
  const overlay = chosen && overlayPosition(chosen.start, chosen.end);
  const overlayKind = clash ? 'clash' : 'chosen';

  return (
    <div>
      {/* From md up: the bar. Hidden from screen readers, which get the list after it. */}
      <div className="hidden md:block">
        <div aria-hidden="true">
          {hours && (
            <div className="flex">
              {HOURS.map((hour) => (
                <div key={hour} className="flex-1 border-l border-line pl-1 font-mono text-[10px] tabular-nums text-muted/70">{hour}</div>
              ))}
            </div>
          )}
          <div className="@container relative h-8 overflow-hidden rounded-[2px] border border-line bg-paper p-0.5">
            <div className="flex h-full gap-px">
              {parts.map((part, i) =>
                part.type === 'gap' ? (
                  <div key={`gap-${i}`} className="h-full" style={{ width: `${part.width}%` }} />
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
            {/* Drawn on top of the bookings, not beside them, so an overlap is literally visible. */}
            {overlay && (
              <div
                className={`absolute inset-y-0.5 flex items-center justify-center overflow-hidden rounded-[1px] px-1 text-[11px] leading-none ${overlayClass[overlayKind]}`}
                style={{ left: `${overlay.left}%`, width: `${overlay.width}%` }}
                title={rangeTitle(overlay.from, overlay.to)}
              >
                <span className="hidden min-w-0 truncate @sm:inline">{rangeLabel(overlay.from, overlay.to)}</span>
              </div>
            )}
          </div>
        </div>
        <TimelineText blocks={blocks} chosen={overlay && { ...chosen, kind: overlayKind }} label={label} />
      </div>

      {/* Below md: one row per hour. */}
      <div className="md:hidden">
        {label && <p className="mb-3 font-display text-base font-semibold text-ink">{label}</p>}
        <ul className="space-y-1">
          {hourRows(blocks, overlay && { ...chosen, clash }).map((row) => (
            <li key={row.hour} className="flex items-stretch gap-2">
              <span className="w-11 flex-none pt-1 font-mono text-[11px] tabular-nums text-muted">{row.hour}</span>
              <span className={`flex-1 rounded-[2px] px-2 py-1.5 text-xs ${rowClass[row.kind]}`}>
                {rowWord[row.kind]}{row.until && ` · until ${row.until}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {legend && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted" aria-hidden="true">
          <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-[1px] border border-line bg-paper" />Free</span>
          <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-[1px] bg-brand-200" />Booked by someone else</span>
          <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-[1px] bg-brand-800" />Yours</span>
          <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-[1px] bg-accent-100 ring-2 ring-inset ring-accent-500" />Being chosen</span>
          <span className="flex items-center gap-2"><span className="h-3 w-7 rounded-[1px] bg-red-100 ring-2 ring-inset ring-red-600" />Clashes</span>
        </div>
      )}
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
