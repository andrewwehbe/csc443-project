import { dateKey, formatDate } from './time.js';
import { isOwner } from './ownership.js';

// Helpers for the Room detail screen. Pure, so they are tested without React.

// '?week=1' -> 1. Anything that is not a whole number counts as this week (0).
export function parseWeek(value) {
  const week = Number(value);
  return Number.isInteger(week) ? week : 0;
}

// The seven days, Monday to Sunday, of the week `offset` weeks from the one containing `now`,
// as 'YYYY-MM-DD' keys: weekDays(0) is this week, weekDays(1) next week.
export function weekDays(offset, now = new Date()) {
  const sinceMonday = (now.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) =>
    dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + offset * 7 + i).toISOString())
  );
}

// 'This week', 'Next week', 'Last week', or 'Week of Mon 16 Nov'.
export function weekTitle(offset, days) {
  if (offset === 0) return 'This week';
  if (offset === 1) return 'Next week';
  if (offset === -1) return 'Last week';
  return `Week of ${formatDate(`${days[0]}T12:00`)}`;
}

// 'Mon 9' for the label in front of a day's timeline.
export function dayLabel(day) {
  const date = new Date(`${day}T12:00`);
  return `${date.toLocaleDateString('en-GB', { weekday: 'short' })} ${date.getDate()}`;
}

// 'first floor' … for the line under the room's name.
export function floorName(floor) {
  const words = ['ground', 'first', 'second', 'third', 'fourth'];
  return `${words[floor] ?? `level ${floor}`} floor`;
}

// The signed-in user's next confirmed booking of this room that has not ended yet, or null.
// Asked per booking with isOwner, so it changes as soon as a different user is signed in.
export function nextOwnBooking(roomId, bookings, currentUser, now = new Date()) {
  return (
    bookings
      .filter((b) => b.roomId === roomId && b.status === 'confirmed' && new Date(b.end) > now && isOwner(b, currentUser))
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0] ?? null
  );
}

// 'today', 'tomorrow' or 'on Thu 12 Nov', for "You have this room today, 14:00 to 16:00."
export function whenPhrase(iso, now = new Date()) {
  const day = dateKey(iso);
  if (day === dateKey(now.toISOString())) return 'today';
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (day === dateKey(tomorrow.toISOString())) return 'tomorrow';
  return `on ${formatDate(iso)}`;
}
