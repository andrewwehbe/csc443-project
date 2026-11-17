// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finderParams, firstSlot, hasBegun, nextDays, openRooms, ownBookingOn, readFinder, startTimes } from './findTime.js';
import { toISO } from './time.js';

// A fixed "now" (Tuesday 17 November 2026, 14:30) so the tests do not depend on the clock.
const today = '2026-11-17';
const now = new Date(2026, 10, 17, 14, 30);
const rooms = [
  { id: 'big', name: 'Room 9', capacity: 8, status: 'open' },
  { id: 'small', name: 'Room 2', capacity: 2, status: 'open' },
  { id: 'off', name: 'Room 5', capacity: 4, status: 'out-of-service' },
];
const booking = (id, roomId, day, start, end, userId = 'u2', status = 'confirmed') => ({
  id, roomId, userId, status, start: toISO(day, start), end: toISO(day, end),
});
const ids = (list) => list.map((room) => room.id);

test('the calendar runs seven days from today', () => {
  assert.deepEqual(nextDays(today), ['2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23']);
});

test('start times are on the hour and still end by 22:00', () => {
  assert.equal(startTimes(60).length, 14);
  assert.equal(startTimes(60).at(-1), 21 * 60);
  assert.equal(startTimes(120).at(-1), 20 * 60);
  assert.equal(startTimes(90).at(-1), 20 * 60);
});

test('open rooms: in service, no overlapping booking, smallest first', () => {
  const day = '2026-11-18';
  assert.deepEqual(ids(openRooms(rooms, [], day, 9 * 60, 60, now)), ['small', 'big']);
  const busy = [booking('a', 'small', day, '09:30', '10:30')];
  assert.deepEqual(ids(openRooms(rooms, busy, day, 9 * 60, 60, now)), ['big']);
});

test('a booking that only touches the slot, or is cancelled, does not take the room', () => {
  const day = '2026-11-18';
  const touching = [booking('a', 'small', day, '08:00', '09:00'), booking('b', 'big', day, '09:00', '10:00', 'u2', 'cancelled')];
  assert.deepEqual(ids(openRooms(rooms, touching, day, 9 * 60, 60, now)), ['small', 'big']);
});

test('a slot that has already begun has no open rooms', () => {
  assert.equal(hasBegun(today, 14 * 60, now), true);
  assert.equal(hasBegun(today, 15 * 60, now), false);
  assert.deepEqual(openRooms(rooms, [], today, 14 * 60, 60, now), []);
  assert.deepEqual(ids(openRooms(rooms, [], today, 15 * 60, 60, now)), ['small', 'big']);
});

test('the first slot is the next hour today, or 08:00 tomorrow when today is too late', () => {
  assert.deepEqual(firstSlot(today, 60, now), { day: today, start: 15 * 60 });
  assert.deepEqual(firstSlot(today, 120, new Date(2026, 10, 17, 20, 10)), { day: '2026-11-18', start: 8 * 60 });
  assert.deepEqual(firstSlot(today, 60, new Date(2026, 10, 17, 6, 0)), { day: today, start: 8 * 60 });
});

test('the pick is read from the address, and a bad part falls back', () => {
  const read = (query) => readFinder(new URLSearchParams(query), today, now);
  assert.deepEqual(read('day=2026-11-19&at=09:00&for=90'), { day: '2026-11-19', start: 9 * 60, length: 90 });
  assert.deepEqual(read(''), { day: today, start: 15 * 60, length: 60 });
  assert.deepEqual(read('day=2027-01-01&at=10:00&for=45'), { day: today, start: 15 * 60, length: 60 });
  assert.deepEqual(read('day=2027-01-01&at=17:00'), { day: today, start: 17 * 60, length: 60 });
  assert.deepEqual(read('day=2026-11-19&at=21:00&for=120'), { day: '2026-11-19', start: 8 * 60, length: 120 });
  assert.deepEqual(read(`day=${today}&at=09:00&for=60`), { day: today, start: 15 * 60, length: 60 }, 'a slot that has begun is never the pick');
  assert.equal(finderParams({ day: '2026-11-19', start: 9 * 60, length: 90 }).toString(), 'day=2026-11-19&at=09%3A00&for=90');
});

test('your own upcoming booking that day is found, so the finder can warn about the one-a-day rule', () => {
  const me = { id: 'u1' };
  const mine = booking('m', 'big', '2026-11-19', '12:00', '13:30', 'u1');
  assert.equal(ownBookingOn([mine], me, '2026-11-19', now), mine);
  assert.equal(ownBookingOn([mine], me, '2026-11-20', now), null);
  assert.equal(ownBookingOn([mine], { id: 'u3' }, '2026-11-19', now), null);
  assert.equal(ownBookingOn([{ ...mine, status: 'cancelled' }], me, '2026-11-19', now), null);
});
