import { dateKey, formatTime } from './time.js';
import { isOwner } from './ownership.js';

// The design pack's status vocabulary for a room on a day: one short word for a chip, so a room's
// state never depends on colour alone. Used by Today, Availability and The floor.
//   roomStatus(room, bookings, '2026-11-12', currentUser, now) -> { word: 'Free from 15:00', tone: 'free' }
// Only what is still ahead of `now` counts: on today, from now on; on a later day, from 08:00.
// Returns null for a day that is already over, which has no status left to show.

const OPEN = 8 * 60;
const CLOSE = 22 * 60;
const COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

const minuteOfDay = (iso) => {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
};
const hhmm = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

export function roomStatus(room, bookings, date, currentUser, now = new Date()) {
  if (room.status === 'out-of-service') return { word: 'Out of service', tone: 'off' };

  const today = dateKey(now.toISOString());
  if (date < today) return null;
  const from = date === today ? Math.max(minuteOfDay(now.toISOString()), OPEN) : OPEN;
  if (from >= CLOSE) return null;

  // The room's bookings on that day that are still to come or running, in time order.
  const ahead = bookings
    .filter((b) => b.roomId === room.id && b.status === 'confirmed' && dateKey(b.start) === date)
    .map((b) => ({ ...b, from: minuteOfDay(b.start), to: Math.min(minuteOfDay(b.end), CLOSE) }))
    .filter((b) => b.to > from)
    .sort((a, b) => a.from - b.from);

  const running = ahead.find((b) => b.from <= from);
  if (running && isOwner(running, currentUser)) return { word: `Yours until ${formatTime(running.end)}`, tone: 'yours' };
  if (ahead.length === 0) return { word: 'Free all day', tone: 'free' };

  // The free stretches between `from` and closing time.
  const gaps = [];
  let cursor = from;
  for (const b of ahead) {
    if (b.from > cursor) gaps.push({ from: cursor, to: b.from });
    cursor = Math.max(cursor, b.to);
  }
  if (cursor < CLOSE) gaps.push({ from: cursor, to: CLOSE });

  if (gaps.length === 0) return { word: 'Fully booked', tone: 'busy' };
  if (gaps.length === 1) {
    const [gap] = gaps;
    // Free right now but booked to closing later on, or busy now and free afterwards.
    return gap.from === from
      ? { word: `Free until ${hhmm(gap.to)}`, tone: 'free' }
      : { word: `Free from ${hhmm(gap.from)}`, tone: 'free' };
  }
  return { word: `${COUNT[gaps.length] ?? gaps.length} gaps`, tone: 'busy' };
}

// The chip around the word, as in the pack's components.html: a bordered box, coloured by tone.
//   <span className={statusChipClass(status.tone)}>{status.word}</span>
const chipBase = 'inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide';
const chipTone = {
  free: 'border-brand-300 text-brand-800',
  busy: 'border-accent-500 text-accent-800',
  yours: 'border-brand-800 bg-brand-800 text-paper',
  off: 'border-ink/15 text-muted',
};
export function statusChipClass(tone) {
  return `${chipBase} ${chipTone[tone]}`;
}
