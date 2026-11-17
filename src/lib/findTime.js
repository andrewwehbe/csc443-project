import { bySize } from '../data/rooms.js';
import { overlaps } from './bookingRules.js';
import { clock } from './quickBook.js';
import { shiftDay } from './availabilityFilters.js';
import { dateKey, toISO } from './time.js';
import { isOwner } from './ownership.js';

// The room finder on Today: pick a day and an hour on the calendar, see which rooms are open for that long.
// What is picked lives in the address, so Back and a reload keep it:  /?day=2026-11-19&at=09:00&for=90

export const LENGTHS = [60, 90, 120];   // 1 h, 1 h 30, 2 h (the house maximum)
const OPEN = 8 * 60;
const CLOSE = 22 * 60;

// The seven days from today, as 'YYYY-MM-DD': the calendar's columns.
export function nextDays(today, count = 7) {
  return Array.from({ length: count }, (_, i) => shiftDay(today, i));
}

// The start times on the hour that still end by 22:00: 08:00 to 21:00 for an hour, to 20:00 for two.
export function startTimes(length) {
  const starts = [];
  for (let minute = OPEN; minute + length <= CLOSE; minute += 60) starts.push(minute);
  return starts;
}

// The rooms that take a booking of `length` minutes from `start` (a minute of the day) on `day`:
// in service, with no confirmed booking overlapping it, and not already begun. Smallest first.
export function openRooms(rooms, bookings, day, start, length, now = new Date()) {
  if (hasBegun(day, start, now)) return [];
  const slot = { start: toISO(day, clock(start)), end: toISO(day, clock(start + length)) };
  const taken = (room) => bookings.some((b) => b.roomId === room.id && b.status === 'confirmed' && overlaps(b, slot));
  return rooms.filter((room) => room.status !== 'out-of-service' && !taken(room)).toSorted(bySize);
}

// What the calendar shows picked before anyone clicks: the next hour today, or 08:00 tomorrow once
// today has no room left for `length`.
export function firstSlot(today, length, now = new Date()) {
  const next = Math.max((now.getHours() + 1) * 60, OPEN);
  return next + length <= CLOSE ? { day: today, start: next } : { day: shiftDay(today, 1), start: OPEN };
}

// The pick from the address. A missing or impossible part falls back to the first slot, so a bad link
// still opens a working calendar.
export function readFinder(searchParams, today, now = new Date()) {
  const length = LENGTHS.includes(Number(searchParams.get('for'))) ? Number(searchParams.get('for')) : 60;
  const fallback = firstSlot(today, length, now);
  const day = nextDays(today).includes(searchParams.get('day')) ? searchParams.get('day') : fallback.day;
  const at = startTimes(length).find((minute) => clock(minute) === searchParams.get('at'));
  const start = at ?? (day === fallback.day ? fallback.start : OPEN);
  // A slot that has already begun cannot be booked, so it is never the pick.
  return hasBegun(day, start, now) ? { ...fallback, length } : { day, start, length };
}

// True once a slot's start time has passed.
export function hasBegun(day, start, now = new Date()) {
  return new Date(toISO(day, clock(start))) <= now;
}

export function finderParams({ day, start, length }) {
  return new URLSearchParams({ day, at: clock(start), for: String(length) });
}

// The signed-in user's upcoming booking on `day`, if any: with one upcoming booking a day,
// it means a second one that day will be refused, so the finder says so up front.
export function ownBookingOn(bookings, currentUser, day, now = new Date()) {
  return bookings.find((b) => b.status === 'confirmed' && isOwner(b, currentUser) && dateKey(b.start) === day && new Date(b.end) > now) ?? null;
}
