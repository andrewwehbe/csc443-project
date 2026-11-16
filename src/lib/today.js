import { isOwner } from './ownership.js';
import { dateKey } from './time.js';
import { DAY_END, DAY_START, minuteOfDay } from './timeline.js';

// What 01 Today works out: which rooms are free right now, which ones you can still get in the next
// two hours or later today, and the sentence that says so. `now` is passed in so tests can fix the clock.

export const SOON_MINUTES = 120;
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

// The library is open 08:00-22:00: 'before' it opens, 'open', or 'after' it has closed.
export function openingState(now = new Date()) {
  const minute = minuteOfDay(now);
  if (minute < DAY_START) return 'before';
  return minute < DAY_END ? 'open' : 'after';
}

// Free right now: in service, the library is open, and no confirmed booking is running.
export function isFreeNow(room, bookings, now = new Date()) {
  if (room.status === 'out-of-service' || openingState(now) !== 'open') return false;
  return !bookings.some(
    (b) => b.roomId === room.id && b.status === 'confirmed' && new Date(b.start) <= now && now < new Date(b.end)
  );
}

// The part of today a list looks at, in minutes: from now (08:00 at the earliest) to two hours later
// ('soon') or to closing ('day'). null when none of it is left.
export function todayWindow(span, now = new Date()) {
  const minute = minuteOfDay(now);
  const from = Math.max(minute, DAY_START);
  const to = span === 'soon' ? Math.min(minute + SOON_MINUTES, DAY_END) : DAY_END;
  return from < to ? { from, to } : null;
}

// True when other people's bookings leave part of the window open. Your own bookings don't block you,
// so a room you hold stays on the list with its "Yours until" word, as in the pack.
function hasRoomFor(room, bookings, window, currentUser, today) {
  if (room.status === 'out-of-service') return false;
  const taken = bookings
    .filter((b) => b.roomId === room.id && b.status === 'confirmed' && !isOwner(b, currentUser) && dateKey(b.start) === today)
    .map((b) => ({ from: minuteOfDay(b.start), to: minuteOfDay(b.end) }))
    .sort((a, b) => a.from - b.from);

  // Walk forward from the window's start; the first booking that starts after `cursor` leaves a gap.
  let cursor = window.from;
  for (const b of taken) {
    if (b.from > cursor) break;
    cursor = Math.max(cursor, b.to);
  }
  return cursor < window.to;
}

// The rooms a Today list shows: the ones you can still get into during its window.
export function roomsToShow(rooms, bookings, span, currentUser, now = new Date()) {
  const window = todayWindow(span, now);
  if (!window) return [];
  const today = dateKey(now);
  return rooms.filter((room) => hasRoomFor(room, bookings, window, currentUser, today));
}

// The page's big line in two parts, for the line break the pack puts in it:
// headline(3, now) -> ['Three rooms are free', 'right now.']
export function headline(freeCount, now = new Date()) {
  const hours = openingState(now);
  if (hours === 'before') return ['The library opens', 'at 08:00.'];
  if (hours === 'after') return ['The library has closed', 'for today.'];
  const noun = freeCount < 2 ? 'room is' : 'rooms are';
  return [`${WORDS[freeCount] ?? freeCount} ${noun} free`, 'right now.'];
}
